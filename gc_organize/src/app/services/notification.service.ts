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

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gc_organize_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // POST /fetch/list — resource name visible in Network tab; panel/org_id stay in the body
  list(panel?: string, orgId?: number): Observable<any> {
    const body: any = {};
    if (panel) body.panel = panel;
    if (orgId !== undefined && orgId !== null) body.org_id = orgId;
    return this.http.post<any>(`${this.api}/fetch/list`, body, { headers: this.getAuthHeaders() });
  }

  markRead(id: number): Observable<any> {
    return this.http.patch(`${this.api}/${id}/read`, {}, { headers: this.getAuthHeaders() });
  }

  // POST /read-all — panel travels in the body
  markAll(panel?: string, orgId?: number): Observable<any> {
    const body: any = {};
    if (panel) body.panel = panel;
    if (orgId !== undefined && orgId !== null) body.org_id = orgId;
    return this.http.post(`${this.api}/read-all`, body, { headers: this.getAuthHeaders() });
  }
}