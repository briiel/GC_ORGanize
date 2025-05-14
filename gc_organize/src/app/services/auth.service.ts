// filepath: src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode'; // Correct import for jwt-decode
import { tap } from 'rxjs/operators'; // Import tap operator

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth'; // Backend base URL

  constructor(private http: HttpClient) {}

  // Login method
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response && response.token) {
          this.saveToken(response.token); // Save token after login
        }
      })
    );
  }

  // Save token to localStorage
  saveToken(token: string): void {
    console.log('Saving token:', token); // Debug log to verify the token
    localStorage.setItem('authToken', token); // Ensure the key is 'authToken'
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('authToken'); // Ensure the key matches 'authToken'
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
        console.log('Decoded token:', decodedToken); // Debug log
        return decodedToken.role || null; 
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  // Create headers for authenticated requests
  createAuthHeaders(): { [header: string]: string } {
    const token = this.getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  // Create a new event
  createEvent(eventData: any): Observable<any> {
    const headers = this.createAuthHeaders();
    return this.http.post(`${this.apiUrl}/events`, eventData, { headers });
  }
}