import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArchiveService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get all archived/trashed items
  getTrash(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/archive/trash`, { headers });
  }

  // Restore operations
  restoreAdmin(adminId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/archive/admins/${adminId}/restore`, {}, { headers });
  }

  restoreOrganization(orgId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/archive/organizations/${orgId}/restore`, {}, { headers });
  }

  restoreMember(memberId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/archive/members/${memberId}/restore`, {}, { headers });
  }

  // Permanent delete operations
  permanentDeleteAdmin(adminId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/archive/admins/${adminId}`, { headers });
  }

  permanentDeleteOrganization(orgId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/archive/organizations/${orgId}`, { headers });
  }

  permanentDeleteMember(memberId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/archive/members/${memberId}`, { headers });
  }

  // Auto-cleanup operations
  getExpiredItemsCount(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/archive/expired-count`, { headers });
  }

  triggerAutoCleanup(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/archive/cleanup`, {}, { headers });
  }
}
