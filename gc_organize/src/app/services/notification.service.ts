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


  constructor(private http: HttpClient) {}

  list(): Observable<{ success: boolean; data: NotificationItem[] } | NotificationItem[]> {
    // Some endpoints in project return { success, data }, so accept both
    return this.http.get<any>(`${this.api}`);
  }

  markRead(id: number): Observable<any> {
    return this.http.patch(`${this.api}/${id}/read`, {});
  }
}
