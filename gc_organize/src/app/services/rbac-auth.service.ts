/**
 * Authentication Service (RBAC-enabled)
 * Manages JWT authentication and role-based access control
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface JwtPayload {
  userId: string;           // Prefixed: "S_202211223", "O_1", "A_1"
  legacyId: string;         // Original ID from legacy table
  studentId?: string;       // Only present for students
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  organization: {
    org_id: number;
    org_name: string;
    position: string;
  } | null;
  userType: string;         // "student", "organization", or "admin"
  exp: number;
  iat: number;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  // Some server responses wrap payloads under a `data` envelope: { success: true, data: { token, user } }
  // Accept that shape here so callers can safely access `response.data.token` when present.
  data?: {
    token?: string;
    user?: {
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      roles: string[];
      organization: any;
    };
    message?: string;
  };
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    organization: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RbacAuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'gc_organize_token';
  
  // BehaviorSubject to track authentication state
  private currentUserSubject: BehaviorSubject<JwtPayload | null>;
  public currentUser$: Observable<JwtPayload | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize with current token if exists
    const token = this.getToken();
    const decoded = token ? this.decodeToken(token) : null;
    this.currentUserSubject = new BehaviorSubject<JwtPayload | null>(decoded);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
            // Support both envelope-shaped responses ({ success, data: { token } })
            // and unwrapped responses ( { token, user } ) depending on interceptor state.
            const token = response?.token ?? response?.data?.token;
            if (token) {
              this.saveToken(token);
              const decoded = this.getDecodedToken();
              this.currentUserSubject.next(decoded);
            }
          })
      );
  }

  /**
   * Register new student user
   */
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.setItem('justLoggedOut', 'true');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Save JWT to localStorage
   */
  private saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get JWT from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwtDecode<any>(token) as JwtPayload | null;

      // Normalize roles to the frontend's expected casing for compatibility
      if (decoded && Array.isArray(decoded.roles)) {
        const mapRole = (r: string) => {
          const low = String(r).toLowerCase();
          if (low === 'student') return 'Student';
          if (low === 'orgofficer' || low === 'org_officer' || low === 'organization') return 'OrgOfficer';
          if (low === 'oswsadmin' || low === 'admin') return 'OSWSAdmin';
          // Fallback: capitalize first letter
          return String(r).charAt(0).toUpperCase() + String(r).slice(1);
        };

        decoded.roles = decoded.roles.map(mapRole);
      }

      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get decoded token payload
   */
  getDecodedToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    
    const decoded = this.decodeToken(token);
    
    // Check if token is expired
    if (decoded && decoded.exp) {
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        this.logout();
        return null;
      }
    }
    
    return decoded;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const decoded = this.getDecodedToken();
    return decoded !== null;
  }

  /**
   * Get user roles from token
   */
  getUserRoles(): string[] {
    const decoded = this.getDecodedToken();
    return decoded?.roles || [];
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.userId || null;
  }

  /**
   * Get user email
   */
  getUserEmail(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.email || null;
  }

  /**
   * Get user's full name
   */
  getUserFullName(): string {
    const decoded = this.getDecodedToken();
    if (!decoded) return '';
    return `${decoded.firstName} ${decoded.lastName}`;
  }

  /**
   * Get user's organization (if OrgOfficer)
   */
  getUserOrganization(): any {
    const decoded = this.getDecodedToken();
    return decoded?.organization || null;
  }

  /**
   * Get student ID (for students only)
   */
  getStudentId(): string | null {
    const decoded = this.getDecodedToken();
    const studentId = decoded?.studentId || null;
    
    return studentId;
  }

  /**
   * Get user department (from backend API)
   */
  getUserDepartment(callback: (department: string) => void): void {
    const studentId = this.getStudentId();
    if (!studentId) {
      callback('');
      return;
    }

    const token = this.getToken();
    this.http.get<any>(`${environment.apiUrl}/users/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const student = res?.data || res;
        callback(student?.department || '');
      },
      error: (err) => {
        console.error('Error fetching user department:', err);
        callback('');
      }
    });
  }

  /**
   * Get creator/organization ID (for organization accounts)
   */
  getCreatorId(): number | null {
    const decoded = this.getDecodedToken();
    // For organization accounts, legacyId is the org ID
    // For students with OrgOfficer role, use organization.org_id
    let creatorId = null;
    if (decoded?.userType === 'organization') {
      creatorId = Number(decoded.legacyId);
    } else if (decoded?.organization?.org_id) {
      creatorId = decoded.organization.org_id;
    }
    
    return creatorId;
  }

  /**
   * Get admin ID (for OSWS admins only)
   */
  getAdminId(): number | null {
    const decoded = this.getDecodedToken();
    let adminId = null;
    if (decoded?.userType === 'admin') {
      adminId = Number(decoded.legacyId);
    }
    
    return adminId;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleName: string): boolean {
    const roles = this.getUserRoles();
    return roles.includes(roleName);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roleNames: string[]): boolean {
    const roles = this.getUserRoles();
    return roleNames.some(role => roles.includes(role));
  }

  /**
   * Check if user is a Student
   */
  isStudent(): boolean {
    return this.hasRole('Student');
  }

  /**
   * Check if user is an Organization Officer
   */
  isOrgOfficer(): boolean {
    return this.hasRole('OrgOfficer');
  }

  /**
   * Check if user is an OSWS Admin
   */
  isAdmin(): boolean {
    return this.hasRole('OSWSAdmin');
  }

  /**
   * Get HTTP headers with Authorization token
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Verify token with backend
   */
  verifyToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get primary role for routing (priority: Admin > OrgOfficer > Student)
   */
  getPrimaryRole(): string | null {
    const roles = this.getUserRoles();
    
    if (roles.includes('OSWSAdmin')) return 'OSWSAdmin';
    if (roles.includes('OrgOfficer')) return 'OrgOfficer';
    if (roles.includes('Student')) return 'Student';
    
    return null;
  }

  /**
   * Get default route based on primary role
   */
  getDefaultRoute(): string {
    const primaryRole = this.getPrimaryRole();
    
    switch (primaryRole) {
      case 'OSWSAdmin':
        return '/osws-admin';
      case 'OrgOfficer':
        return '/org-panel';
      case 'Student':
        return '/student-dashboard';
      default:
        return '/login';
    }
  }
}
