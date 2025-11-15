import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private api = 'https://gcorg-apiv1-8bn5.onrender.com/api/notifications';
  // private api = 'http://localhost:5000/api/notifications'; // Comment this out for production

  constructor(private http: HttpClient) {}

  list(): Observable<{ success: boolean; data: NotificationItem[] } | NotificationItem[]> {
    return this.http.get<any>(`${this.api}`);
  }

  markRead(id: number): Observable<any> {
    return this.http.patch(`${this.api}/${id}/read`, {});
  }
}