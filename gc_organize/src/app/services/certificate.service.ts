import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private baseApiUrl = `${environment.apiUrl}/event`;
  private fetchUrl = `${this.baseApiUrl}/fetch`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gc_organize_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // POST /event/fetch — student_id travels in the body (not visible in URL)
  getCertificates(studentId: string): Observable<any> {
    return this.http.post<any>(
      `${this.fetchUrl}/certificates`,
      { student_id: studentId },
      { headers: this.getAuthHeaders() }
    );
  }
  
  requestCertificate(eventId: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseApiUrl}/events/${eventId}/request-certificate`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }
}