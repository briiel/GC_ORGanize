import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  // Dev: 'http://localhost:5000/api/event'
  private apiUrl = 'https://gcorg-apiv1-8bn5.onrender.com/api/event';

  constructor(private http: HttpClient) {}

  // Fetch all events
  getAllEvents(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/events`, { headers });
  }

  // Create a new event
  createEvent(eventData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    // Do NOT set Content-Type here; browser will set it for FormData
    return this.http.post(`${this.apiUrl}/events`, eventData, { headers });
  }

  // Fetch events a participant registered in
  getRegisteredEvents(studentId: string | null): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/participants/${studentId}/events`, { headers });
  }

  // Fetch events by creator/org ID
  getEventsByCreator(creatorId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/events/creator/${creatorId}`, { headers });
  }

  // Update event status
  updateEventStatus(eventId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/events/${eventId}/status`, { status });
  }

  // Fetch all attendance records
  getAllAttendanceRecords(): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/attendance-records`, { headers });
  }

  // Delete an event
  deleteEvent(eventId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/events/${eventId}`, { headers });
  }

  // List trashed events for current user (org or OSWS, based on token)
  getTrashedEvents(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/events/trash`, { headers });
  }

  // Restore an event from trash
  restoreEvent(eventId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/events/${eventId}/restore`, {}, { headers });
  }

  // Permanently delete an event from trash
  permanentDelete(eventId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/events/${eventId}/permanent`, { headers });
  }

  // Helper method to get Authorization headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Get notifications
  // getNotifications() {
  //   Dev: this.http.get<any[]>('http://localhost:5000/api/notifications', {
  //   return this.http.get<any[]>('https://gcorg-apiv1-8bn5.onrender.com/api/notifications', {
  //     headers: this.getAuthHeaders()
  //   });
  // }

  // // Mark notification as read
  // markNotificationAsRead(id: number) {
  //   Dev: this.http.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, {
  //   return this.http.patch(`https://gcorg-apiv1-8bn5.onrender.com/api/notifications/${id}/read`, {}, {
  //     headers: this.getAuthHeaders()
  //   });
  // }

  // Fetch events by admin ID
  getEventsByAdmin(adminId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/events/admin/${adminId}`, { headers });
  }

  // Fetch all events created by student organizations (not OSWS)
  getAllOrgEvents(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/events/organizations`, { headers });
  }

  getAllOswsEvents(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/events/osws`, { headers });
  }

  getEventParticipants(eventId: number) {
    return this.http.get<any>(`${this.apiUrl}/${eventId}/participants`);
  }

  getEventById(eventId: number) {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/events/${eventId}`, { headers });
  }

  updateEvent(eventId: number, formData: FormData) {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/events/${eventId}`, formData, { headers });
  }
}