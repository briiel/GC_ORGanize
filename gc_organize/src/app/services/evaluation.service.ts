import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EvaluationResponses {
  // Rating questions 1-13 (NA or 1-5)
  ratings: {
    question1: number | string;
    question2: number | string;
    question3: number | string;
    question4: number | string;
    question5: number | string;
    question6: number | string;
    question7: number | string;
    question8: number | string;
    question9: number | string;
    question10: number | string;
    question11: number | string;
    question12: number | string;
    question13: number | string;
  };
  
  // Open-ended questions 14-16
  comments: {
    question14: string;
    question15: string;
    question16?: string;
  };
}

export interface EvaluationStatus {
  has_attended: boolean;
  has_evaluated: boolean;
  evaluation_submitted_at: string | null;
  can_download_certificate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private apiUrl = 'https://gcorg-apiv1-8bn5.onrender.com/api';
  // private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Submit evaluation for an event
   */
  submitEvaluation(eventId: number, responses: EvaluationResponses): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/events/${eventId}/evaluations`,
      { responses },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get evaluation status for current student and event
   */
  getEvaluationStatus(eventId: number): Observable<{ success: boolean; data: EvaluationStatus }> {
    return this.http.get<{ success: boolean; data: EvaluationStatus }>(
      `${this.apiUrl}/events/${eventId}/evaluations/status`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get student's submitted evaluation
   */
  getMyEvaluation(eventId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/events/${eventId}/evaluations/me`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all evaluations for an event (organizers/admins only)
   */
  getEventEvaluations(eventId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/events/${eventId}/evaluations`,
      { headers: this.getHeaders() }
    );
  }
}
