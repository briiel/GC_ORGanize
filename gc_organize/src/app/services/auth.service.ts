// LEGACY — replaced by rbac-auth.service.ts; kept for reference only (not imported anywhere)

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

  // POST /auth/login and save the returned JWT
  login(emailOrId: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { emailOrId, password }).pipe(
      tap((response: any) => {
        if (response && response.token) this.saveToken(response.token);
      })
    );
  }

  // Save token to localStorage and start its expiry timer
  saveToken(token: string): void {
    localStorage.setItem('gc_organize_token', token);
    this.setTokenExpiryTimer(token);
  }

  getToken(): string | null {
    return localStorage.getItem('gc_organize_token');
  }

  // Remove token from localStorage and cancel the expiry timer
  logout(): void {
    localStorage.removeItem('gc_organize_token');
    if (this.tokenExpiryTimeout) {
      clearTimeout(this.tokenExpiryTimeout);
      this.tokenExpiryTimeout = null;
    }
  }

  // Schedule a SweetAlert warning and logout when the JWT expires
  setTokenExpiryTimer(token: string): void {
    if (this.tokenExpiryTimeout) clearTimeout(this.tokenExpiryTimeout);
    try {
      const decoded: any = jwtDecode(token);
      if (decoded && decoded.exp) {
        const timeout = decoded.exp * 1000 - Date.now();
        if (timeout > 0) {
          this.tokenExpiryTimeout = setTimeout(() => {
            Swal.fire({
              icon: 'warning',
              title: 'Session Expired',
              text: 'Your session has expired. Please log in again.',
              confirmButtonText: 'OK'
            }).then(() => { this.logout(); window.location.href = '/login'; });
          }, timeout);
        } else {
          this.logout();
          window.location.href = '/login';
        }
      }
    } catch (e) {
      this.logout();
      window.location.href = '/login';
    }
  }

  // Re-arm the expiry timer if a token exists on app startup
  checkTokenOnStartup(): void {
    const token = this.getToken();
    if (token) this.setTokenExpiryTimer(token);
  }

  // Decode JWT and return the primary role (maps 'admin' -> 'osws_admin')
  getUserRole(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        let role: string | null = decodedToken.role || null;
        if (role === 'admin') role = 'osws_admin';
        return role;
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    return localStorage.getItem('role');
  }

  // Build an Authorization header object for manual HTTP requests
  createAuthHeaders(): { [header: string]: string } {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}