import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  // Dev: 'http://localhost:5000/api'
  private apiUrl = 'https://gcorg-apiv1-8bn5.onrender.com/api';

  constructor(private http: HttpClient) {}

  getManageUsers(): Observable<any> {
    const token = localStorage.getItem('authToken');
    return this.http.get(`${this.apiUrl}/admin/manage-users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  addAdmin(admin: { email: string; password: string; name: string }): Observable<any> {
    const token = localStorage.getItem('authToken');
    return this.http.post(`${this.apiUrl}/admins`, admin, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  deleteAdmin(id: number): Observable<any> {
    const token = localStorage.getItem('authToken');
    return this.http.delete(`${this.apiUrl}/admins/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}