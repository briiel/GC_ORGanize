// filepath: src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Dev: 'http://localhost:5000/api'
  private apiUrl = 'https://gcorg-apiv1-8bn5.onrender.com/api'; // Use as base URL

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
    localStorage.setItem('authToken', token);
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Remove token from localStorage (logout)
  logout(): void {
    localStorage.removeItem('authToken');
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