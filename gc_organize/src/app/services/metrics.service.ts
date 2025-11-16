import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface VisitsResponse { success: boolean; total: number; }

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private api = 'https://gcorg-apiv1-8bn5.onrender.com/api';
  // private api = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getVisits(): Observable<VisitsResponse> {
    return this.http.get<VisitsResponse>(`${this.api}/visits`);
  }

  incrementVisit(): Observable<VisitsResponse> {
    return this.http.post<VisitsResponse>(`${this.api}/visits`, {});
  }
}
