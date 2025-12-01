import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificationItem {
  id: number;
  user_id: string | null;
  message: string;
  event_id?: number | null;
  is_read: 0 | 1 | boolean;
  created_at: string;
  event_title?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gc_organize_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  list(panel?: string, orgId?: number): Observable<any> {
    let url = `${this.api}`;
    const params: any = {};
    if (panel) params.panel = panel;
    if (orgId !== undefined && orgId !== null) params.org_id = String(orgId);

    return this.http.get<any>(url, { headers: this.getAuthHeaders(), params });
  }

  markRead(id: number): Observable<any> {
    return this.http.patch(`${this.api}/${id}/read`, {}, { headers: this.getAuthHeaders() });
  }

  markAll(panel?: string, orgId?: number): Observable<any> {
    const params: any = {};
    if (panel) params.panel = panel;
    if (orgId !== undefined && orgId !== null) params.org_id = String(orgId);
    return this.http.patch(`${this.api}/read-all`, {}, { headers: this.getAuthHeaders(), params });
  }
}