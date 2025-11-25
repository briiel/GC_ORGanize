import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private apiUrl = `${environment.apiUrl}/event/certificates`;
  private baseApiUrl = `${environment.apiUrl}/event`;

  constructor(private http: HttpClient) {}

  getCertificates(studentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?student_id=${studentId}`);
  }
  
  requestCertificate(eventId: number): Observable<any> {
    // Backend expects the event ID as a URL param: POST /event/events/:id/request-certificate
    return this.http.post<any>(`${this.baseApiUrl}/events/${eventId}/request-certificate`, {});
  }
}