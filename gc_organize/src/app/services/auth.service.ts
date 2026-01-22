/**
 * LEGACY FILE - NOT ACTIVELY USED
 * This service has been replaced by rbac-auth.service.ts for RBAC functionality.
 * Kept for reference and potential future use.
 * 
 * Status: Recently updated to use environment.apiUrl, but not imported anywhere
 * Date marked as legacy: January 4, 2026
 * Replacement: Use RbacAuthService instead
 */

// filepath: src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenExpiryTimeout: any = null;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Login method
  login(emailOrId: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { emailOrId, password }).pipe(
      tap((response: any) => {
        if (response && response.token) {
          this.saveToken(response.token);
        }
      })
    );
  }

  // Save token to localStorage
  saveToken(token: string): void {
    localStorage.setItem('gc_organize_token', token);
    this.setTokenExpiryTimer(token);
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('gc_organize_token');
  }

  // Remove token from localStorage (logout)
  logout(): void {
    localStorage.removeItem('gc_organize_token');
    if (this.tokenExpiryTimeout) {
      clearTimeout(this.tokenExpiryTimeout);
      this.tokenExpiryTimeout = null;
    }
  }

  // Set a timer to warn and logout when token expires
  setTokenExpiryTimer(token: string): void {
    if (this.tokenExpiryTimeout) {
      clearTimeout(this.tokenExpiryTimeout);
    }
    try {
      const decoded: any = jwtDecode(token);
      if (decoded && decoded.exp) {
        const expiry = decoded.exp * 1000; // exp is in seconds
        const now = Date.now();
        const timeout = expiry - now;
        if (timeout > 0) {
          this.tokenExpiryTimeout = setTimeout(() => {
            Swal.fire({
              icon: 'warning',
              title: 'Session Expired',
              text: 'Your session has expired. Please log in again.',
              confirmButtonText: 'OK'
            }).then(() => {
              this.logout();
              window.location.href = '/login';
            });
          }, timeout);
        } else {
          // Token already expired
          this.logout();
          window.location.href = '/login';
        }
      }
    } catch (e) {
      // Invalid token, logout just in case
      this.logout();
      window.location.href = '/login';
    }
  }
  // Call this on app start to check for existing token and set timer
  checkTokenOnStartup(): void {
    const token = this.getToken();
    if (token) {
      this.setTokenExpiryTimer(token);
    }
  }

  // Decode token to get user role
  getUserRole(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
    let role: string | null = decodedToken.role || null;
    // Normalize backend 'admin' to frontend 'osws_admin'
    if (role === 'admin') role = 'osws_admin';
    return role;
      } catch (error) {
        console.error('Error decoding token:', error);
    // fall through to localStorage below
      }
    }
  // Fallback to stored role if token decode failed
  return localStorage.getItem('role');
  }

  // Create headers for authenticated requests
  createAuthHeaders(): { [header: string]: string } {
    const token = this.getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }
}