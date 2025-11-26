import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CertificateRequestService {
  private apiUrl = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gc_organize_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Get all certificate requests for the organization
  getCertificateRequests(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/requests`, { headers: this.getAuthHeaders() }).pipe(
      map((resp: any) => (Array.isArray(resp) ? resp : resp.data || [])),
      catchError(err => throwError(() => err))
    );
  }

  // Approve a certificate request
  approveCertificateRequest(requestId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/requests/${requestId}/approve`, {}, { headers: this.getAuthHeaders() }).pipe(
      map((resp: any) => resp),
      catchError(err => throwError(() => err))
    );
  }

  // Decline a certificate request
  rejectCertificateRequest(requestId: number, rejectionReason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/requests/${requestId}/reject`, { rejection_reason: rejectionReason }, { headers: this.getAuthHeaders() }).pipe(
      map((resp: any) => resp),
      catchError(err => throwError(() => err))
    );
  }

  // Update certificate request status
  updateCertificateRequestStatus(requestId: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/requests/${requestId}/status`, { status }, { headers: this.getAuthHeaders() }).pipe(
      map((resp: any) => resp),
      catchError(err => throwError(() => err))
    );
  }
}
