import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/event`;

  private statusChangedSubject = new Subject<void>();
  public statusChanged$ = this.statusChangedSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * POST /event/fetch/:resource
   * The resource name is visible in the Network tab (e.g. "all_events", "org_stats").
   * Sensitive parameters (IDs, filters) travel only in the encrypted body.
   */
  private fetch<T = any>(resource: string, body: Record<string, any> = {}): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/fetch/${resource}`, body);
  }

  // ── Mutations (POST / PATCH / PUT / DELETE) stay on their own explicit URLs ──

  trashMultipleEvents(eventIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/trash-multiple`, { eventIds });
  }

  createEvent(eventData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/events`, eventData);
  }

  requestCertificate(eventId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/${eventId}/request-certificate`, {});
  }

  updateEventStatus(eventId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/events/${eventId}/status`, { status })
      .pipe(tap(() => this.statusChangedSubject.next()));
  }

  deleteEvent(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${eventId}`);
  }

  restoreEvent(eventId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/${eventId}/restore`, {});
  }

  permanentDelete(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${eventId}/permanent`);
  }

  updateEvent(eventId: number, formData: FormData) {
    return this.http.put<any>(`${this.apiUrl}/events/${eventId}`, formData);
  }

  approveRegistration(registrationId: number) {
    return this.http.post(`${this.apiUrl}/registrations/${registrationId}/approve`, {});
  }

  rejectRegistration(registrationId: number) {
    return this.http.post(`${this.apiUrl}/registrations/${registrationId}/reject`, {});
  }

  // ── Data fetches — resource name visible in Network tab ──

  getAllEvents(): Observable<any> {
    return this.fetch('all_events');
  }

  getRegisteredEvents(studentId: string | null): Observable<any> {
    return this.fetch('events_by_participant', { student_id: studentId });
  }

  getAttendedEvents(studentId: string | null): Observable<any> {
    return this.fetch('attended_events', { student_id: studentId });
  }

  getEventsByCreator(creatorId: number): Observable<any> {
    return this.fetch('events_by_creator', { creator_id: creatorId });
  }

  getAllAttendanceRecords(): Observable<any> {
    return this.fetch('all_attendance');
  }

  getAttendeeCountByCreator(creatorId: number): Observable<{ count: number }> {
    return this.fetch('attendance_count_by_creator', { creator_id: creatorId });
  }

  getEventAttendance(eventId: number) {
    return this.fetch('attendance_by_event', { event_id: eventId });
  }

  getTrashedEvents(): Observable<any> {
    return this.fetch('trashed_events');
  }

  getEventsByAdmin(adminId: number): Observable<any> {
    return this.fetch('events_by_admin', { admin_id: adminId });
  }

  getAllOrgEvents(): Observable<any> {
    return this.fetch('org_events');
  }

  getAllOswsEvents(): Observable<any> {
    return this.fetch('osws_events');
  }

  getEventParticipants(eventId: number) {
    return this.fetch('event_participants', { event_id: eventId });
  }

  getEventById(eventId: number) {
    return this.fetch<any>('event_by_id', { event_id: eventId });
  }

  getCertificates(studentId: string): Observable<any> {
    return this.fetch('certificates', { student_id: studentId });
  }

  getOrgStats(): Observable<any> {
    return this.fetch('org_stats');
  }

  getOswsStats(): Observable<any> {
    return this.fetch('osws_stats');
  }

  getOswsCharts(filter: 'weekly' | 'monthly' | 'yearly' = 'monthly'): Observable<any> {
    return this.fetch('osws_charts', { filter });
  }
}