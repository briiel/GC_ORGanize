import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // POST /admin/fetch — hides the manage-users sub-path from the URL
  getManageUsers(): Observable<any> {
    const token = localStorage.getItem('gc_organize_token');
    return this.http.post(`${this.apiUrl}/admin/fetch/manage_users`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  addAdmin(admin: { email: string; password: string; name: string }): Observable<any> {
    const token = localStorage.getItem('gc_organize_token');
    return this.http.post(`${this.apiUrl}/admins`, admin, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  deleteAdmin(id: number): Observable<any> {
    const token = localStorage.getItem('gc_organize_token');
    return this.http.delete(`${this.apiUrl}/admins/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}