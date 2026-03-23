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

  // Trash (soft-delete) multiple events
  trashMultipleEvents(eventIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/trash-multiple`, { eventIds });
  }

  // Fetch attendance records for a specific event
  getEventAttendance(eventId: number) {
    return this.http.get<any>(`${this.apiUrl}/attendance-records/event/${eventId}`);
  }

  // Fetch all events
  getAllEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/events`);
  }

  // Create a new event
  createEvent(eventData: FormData): Observable<any> {
    // Do NOT set Content-Type here; browser will set it for FormData
    return this.http.post(`${this.apiUrl}/events`, eventData);
  }

  // Fetch events a participant registered in
  getRegisteredEvents(studentId: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/participants/${studentId}/events`);
  }

  // Fetch attended events (history) for a student
  getAttendedEvents(studentId: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/${studentId}/attended`);
  }

  // Request e-certificate via email to organizer
  requestCertificate(eventId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/${eventId}/request-certificate`, {});
  }

  // Fetch events by creator/org ID
  getEventsByCreator(creatorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/creator/${creatorId}`);
  }

  // Update event status
  updateEventStatus(eventId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/events/${eventId}/status`, { status })
      .pipe(
        tap(() => this.statusChangedSubject.next())
      );
  }

  // Fetch all attendance records
  getAllAttendanceRecords(): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance-records`);
  }

  // Fetch total attendee count scoped to a creator org (lightweight — avoids full table scan)
  getAttendeeCountByCreator(creatorId: number): Observable<{ success: boolean; total: number }> {
    return this.http.get<{ success: boolean; total: number }>(`${this.apiUrl}/attendance-records/count-by-creator/${creatorId}`);
  }

  // Delete an event
  deleteEvent(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${eventId}`);
  }

  // List trashed events for current user (org or OSWS, based on token)
  getTrashedEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/trash`);
  }

  // Restore an event from trash
  restoreEvent(eventId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/${eventId}/restore`, {});
  }

  // Permanently delete an event from trash
  permanentDelete(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${eventId}/permanent`);
  }

  // Fetch events by admin ID
  getEventsByAdmin(adminId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/admin/${adminId}`);
  }

  // Fetch all events created by student organizations (not OSWS)
  getAllOrgEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/organizations`);
  }

  getAllOswsEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/osws`);
  }

  getEventParticipants(eventId: number) {
    return this.http.get<any>(`${this.apiUrl}/${eventId}/participants`);
  }

  approveRegistration(registrationId: number) {
    return this.http.post(`${this.apiUrl}/registrations/${registrationId}/approve`, {});
  }

  rejectRegistration(registrationId: number) {
    return this.http.post(`${this.apiUrl}/registrations/${registrationId}/reject`, {});
  }

  getEventById(eventId: number) {
    return this.http.get<any>(`${this.apiUrl}/events/${eventId}`);
  }

  updateEvent(eventId: number, formData: FormData) {
    return this.http.put<any>(`${this.apiUrl}/events/${eventId}`, formData);
  }

  // Dashboard stats endpoints
  getOrgStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/organization`);
  }

  getOswsStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/osws`);
  }

  // Fetch aggregated chart datasets for OSWS dashboard
  getOswsCharts(filter: 'weekly' | 'monthly' | 'yearly' = 'monthly'): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/osws/charts?filter=${filter}`);
  }
}