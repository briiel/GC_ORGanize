import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface VisitsResponse { success: boolean; total: number; }

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVisits(): Observable<VisitsResponse> {
    return this.http.get<VisitsResponse>(`${this.api}/visits`);
  }

  incrementVisit(): Observable<VisitsResponse> {
    return this.http.post<VisitsResponse>(`${this.api}/visits`, {});
  }
}
