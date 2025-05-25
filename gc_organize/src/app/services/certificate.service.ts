import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private apiUrl = 'https://gcorg-apiv1-8bn5.onrender.com/api/event/certificates';

  constructor(private http: HttpClient) {}

  getCertificates(studentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?student_id=${studentId}`);
  }
}