// RBAC-enabled auth service: JWT login/logout, role normalization, and token integrity verification

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { SecureStorageService } from './secure-storage.service';

interface JwtPayload {
  userId: string;       // Prefixed: "S_202211223", "O_1", "A_1"
  legacyId: string;     // Original ID from the legacy table
  studentId?: string;   // Present only for students
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  organization: { org_id: number; org_name: string; position: string; } | null;
  userType: string;     // "student", "organization", or "admin"
  exp: number;
  iat: number;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  // Also accepts envelope shape: { success, data: { token, user } }
  data?: { token?: string; user?: { userId: string; email: string; firstName: string; lastName: string; roles: string[]; organization: any; }; message?: string; };
  user: { userId: string; email: string; firstName: string; lastName: string; roles: string[]; organization: any; };
}

@Injectable({
  providedIn: 'root'
})
export class RbacAuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'gc_organize_token';
  private readonly TOKEN_HASH_KEY = 'gc_organize_token_sig';

  // BehaviorSubject tracks the currently authenticated user
  private currentUserSubject: BehaviorSubject<JwtPayload | null>;
  public currentUser$: Observable<JwtPayload | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private secureStorage: SecureStorageService
  ) {
    // Initialize from any stored token and run a one-time integrity check
    const token = this.getToken();
    const decoded = token ? this.decodeToken(token) : null;
    this.currentUserSubject = new BehaviorSubject<JwtPayload | null>(decoded);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.verifyTokenIntegrity();
  }

  // One-time startup check: compare stored hash against current token to detect tampering
  private verifyTokenIntegrity(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const storedHash = localStorage.getItem(this.TOKEN_HASH_KEY);
    if (!token || !storedHash) return;
    this.secureStorage.hashData(token).then(expectedHash => {
      if (expectedHash !== storedHash) {
        console.warn('[Security] Startup token integrity check failed — clearing invalid token.');
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_HASH_KEY);
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      }
    }).catch(() => { /* Crypto API unavailable — trust token as-is */ });
  }

  // POST /auth/login, save the token, and emit the decoded user to currentUser$
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          // Accept both unwrapped ({ token }) and envelope ({ data: { token } }) shapes
          const token = response?.token ?? response?.data?.token;
          if (token) {
            this.saveToken(token);
            this.currentUserSubject.next(this.getDecodedToken());
          }
        })
      );
  }

  // POST /auth/register for new student accounts
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Clear token, emit null user, and navigate to login
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_HASH_KEY);
    localStorage.setItem('justLoggedOut', 'true');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Persist the JWT and store a SHA-256 integrity hash for tamper detection
  private saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.secureStorage.hashData(token).then(hash => {
      localStorage.setItem(this.TOKEN_HASH_KEY, hash);
    }).catch(() => {
      localStorage.removeItem(this.TOKEN_HASH_KEY);
    });
  }

  // Pure synchronous read — integrity is verified once at startup only
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Decode the JWT and normalize role strings to the frontend's expected casing
  private decodeToken(token: string): JwtPayload | null {
    try {
      if (!this.isJwt(token)) { localStorage.removeItem(this.TOKEN_KEY); return null; }
      const decoded = jwtDecode<any>(token) as JwtPayload | null;
      if (decoded && Array.isArray(decoded.roles)) {
        const mapRole = (r: string) => {
          const low = String(r).toLowerCase();
          if (low === 'student') return 'Student';
          if (low === 'orgofficer' || low === 'org_officer' || low === 'organization') return 'OrgOfficer';
          if (low === 'oswsadmin' || low === 'admin') return 'OSWSAdmin';
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

  // Validate token structure (header.payload.signature)
  private isJwt(token: string): boolean {
    const parts = String(token).split('.');
    return parts.length === 3 && parts.every(p => p.length > 0);
  }

  // Decode and return the current token, logging out if expired
  getDecodedToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    const decoded = this.decodeToken(token);
    if (!decoded) return null;
    if (decoded.exp && decoded.exp < Date.now() / 1000) { this.logout(); return null; }
    return decoded;
  }

  isAuthenticated(): boolean { return this.getDecodedToken() !== null; }
  getUserRoles(): string[] { return this.getDecodedToken()?.roles || []; }
  getUserId(): string | null { return this.getDecodedToken()?.userId || null; }
  getUserEmail(): string | null { return this.getDecodedToken()?.email || null; }
  getUserFullName(): string { const d = this.getDecodedToken(); return d ? `${d.firstName} ${d.lastName}` : ''; }
  getUserOrganization(): any { return this.getDecodedToken()?.organization || null; }
  getStudentId(): string | null { return this.getDecodedToken()?.studentId || null; }

  // Fetch the student's department from the API via callback
  getUserDepartment(callback: (department: string) => void): void {
    const studentId = this.getStudentId();
    if (!studentId) { callback(''); return; }
    this.http.get<any>(`${environment.apiUrl}/users/${studentId}`, { headers: { Authorization: `Bearer ${this.getToken()}` } }).subscribe({
      next: (res) => callback(res?.data?.department || res?.department || ''),
      error: (err) => { console.error('Error fetching user department:', err); callback(''); }
    });
  }

  // Return the org ID for OrgOfficer/organization accounts, or null
  getCreatorId(): number | null {
    const decoded = this.getDecodedToken();
    if (decoded?.userType === 'organization') return Number(decoded.legacyId);
    return decoded?.organization?.org_id || null;
  }

  // Return the admin's legacy ID, or null for non-admin accounts
  getAdminId(): number | null {
    const decoded = this.getDecodedToken();
    return decoded?.userType === 'admin' ? Number(decoded.legacyId) : null;
  }

  hasRole(roleName: string): boolean { return this.getUserRoles().includes(roleName); }
  hasAnyRole(roleNames: string[]): boolean { return roleNames.some(r => this.getUserRoles().includes(r)); }
  isStudent(): boolean { return this.hasRole('Student'); }
  isOrgOfficer(): boolean { return this.hasRole('OrgOfficer'); }
  isAdmin(): boolean { return this.hasRole('OSWSAdmin'); }

  // Build Authorization headers for manual HTTP requests
  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.getToken()}` });
  }

  verifyToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify`, { headers: this.getAuthHeaders() });
  }

  // Return the highest-priority role (Admin > OrgOfficer > Student)
  getPrimaryRole(): string | null {
    const roles = this.getUserRoles();
    if (roles.includes('OSWSAdmin')) return 'OSWSAdmin';
    if (roles.includes('OrgOfficer')) return 'OrgOfficer';
    if (roles.includes('Student')) return 'Student';
    return null;
  }

  // Map primary role to its default landing route
  getDefaultRoute(): string {
    switch (this.getPrimaryRole()) {
      case 'OSWSAdmin': return '/osws-admin';
      case 'OrgOfficer': return '/org-panel';
      case 'Student': return '/student-dashboard';
      default: return '/login';
    }
  }
}
