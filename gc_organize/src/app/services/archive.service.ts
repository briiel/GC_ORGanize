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
    const token = localStorage.getItem('gc_organize_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // POST /archive/fetch — resource discriminator in the body (sub-paths hidden from URL)
  getTrash(): Observable<any> {
    return this.http.post(`${this.apiUrl}/archive/fetch/trash`, {}, { headers: this.getAuthHeaders() });
  }

  // Restore operations
  restoreAdmin(adminId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/archive/admins/${adminId}/restore`, {}, { headers: this.getAuthHeaders() });
  }

  restoreOrganization(orgId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/archive/organizations/${orgId}/restore`, {}, { headers: this.getAuthHeaders() });
  }

  restoreMember(memberId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/archive/members/${memberId}/restore`, {}, { headers: this.getAuthHeaders() });
  }

  // Permanent delete operations
  permanentDeleteAdmin(adminId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/archive/admins/${adminId}`, { headers: this.getAuthHeaders() });
  }

  permanentDeleteOrganization(orgId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/archive/organizations/${orgId}`, { headers: this.getAuthHeaders() });
  }

  permanentDeleteMember(memberId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/archive/members/${memberId}`, { headers: this.getAuthHeaders() });
  }

  // POST /archive/fetch with resource=expired_count
  getExpiredItemsCount(): Observable<any> {
    return this.http.post(`${this.apiUrl}/archive/fetch/expired_count`, {}, { headers: this.getAuthHeaders() });
  }

  triggerAutoCleanup(): Observable<any> {
    return this.http.post(`${this.apiUrl}/archive/cleanup`, {}, { headers: this.getAuthHeaders() });
  }
}
