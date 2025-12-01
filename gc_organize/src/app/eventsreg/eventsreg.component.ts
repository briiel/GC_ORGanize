import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../services/event.service';
import { parseMysqlDatetimeToDate } from '../utils/date-utils';
import { RbacAuthService } from '../services/rbac-auth.service';

@Component({
  selector: 'app-eventsreg',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eventsreg.component.html',
  styleUrls: ['./eventsreg.component.css']
})
export class EventsregComponent implements OnInit {
  // Search related properties
  searchTerm: string = '';
  sortBy: string = 'date_desc';
  loading: boolean = false;
  registeredEvents: any[] = [];
  studentId: string | null = null;

  constructor(private http: HttpClient, private eventService: EventService, private auth: RbacAuthService) {
    // Get studentId from JWT token
    this.studentId = this.auth.getStudentId();
  }

  ngOnInit() {
    this.fetchRegisteredEvents();
  }

  fetchRegisteredEvents() {
    if (!this.studentId) return;
    this.loading = true;
    this.eventService.getRegisteredEvents(this.studentId).subscribe({
      next: (events) => {
        // Normalize response shape: support { items }, legacy { data }, or raw array
        let payload: any = events;
        // If API uses wrapper { success: true, data: ... }
        if (events && events.data !== undefined && events.success !== undefined) {
          payload = events.data;
        }
        // If payload contains paginated envelope { items: [...] }
        if (payload && Array.isArray(payload.items)) {
          this.registeredEvents = payload.items;
        } else if (payload && Array.isArray(payload)) {
          this.registeredEvents = payload;
        } else if (payload && Array.isArray(payload.data)) {
          // nested data.data
          this.registeredEvents = payload.data;
        } else {
          // fallback to empty array to avoid runtime errors
          this.registeredEvents = [];
        }
        // Sort latest first: assume "latest" means most recent event by start_date then start_time
        // Ensure we only call sort when we have an array
        if (Array.isArray(this.registeredEvents)) {
          this.registeredEvents.sort((a, b) => {
          const aDateStr: string | undefined = a?.start_date;
          const bDateStr: string | undefined = b?.start_date;
          const aTimeStr: string | undefined = a?.start_time;
          const bTimeStr: string | undefined = b?.start_time;

          // Build comparable timestamps; parse as UTC when possible
          const aFull = aDateStr ? `${aDateStr}${aDateStr.includes('T') ? '' : 'T'}${aDateStr.includes('T') ? '' : (aTimeStr || '00:00:00')}` : null;
          const bFull = bDateStr ? `${bDateStr}${bDateStr.includes('T') ? '' : 'T'}${bDateStr.includes('T') ? '' : (bTimeStr || '00:00:00')}` : null;
          const aD = parseMysqlDatetimeToDate(aFull as any);
          const bD = parseMysqlDatetimeToDate(bFull as any);
          const aTs = aD ? aD.getTime() : 0;
          const bTs = bD ? bD.getTime() : 0;
          return bTs - aTs; // descending (latest first)
          });
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching registered events:', err);
        this.loading = false;
      }
    });
  }

  // Filtered events based on search
  get filteredEvents() {
    let filtered = Array.isArray(this.registeredEvents) ? this.registeredEvents : [];
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        (event.title && event.title.toLowerCase().includes(term)) ||
        ((event.room && event.room.toLowerCase().includes(term)) || (event.location && event.location.toLowerCase().includes(term))) ||
        (event.venue && event.venue.toLowerCase().includes(term)) ||
        (event.department && event.department.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      const aDateStr: string | undefined = a?.start_date;
      const bDateStr: string | undefined = b?.start_date;
      const aTimeStr: string | undefined = a?.start_time;
      const bTimeStr: string | undefined = b?.start_time;

      const aFull = aDateStr ? `${aDateStr}${aDateStr.includes('T') ? '' : 'T'}${aDateStr.includes('T') ? '' : (aTimeStr || '00:00:00')}` : null;
      const bFull = bDateStr ? `${bDateStr}${bDateStr.includes('T') ? '' : 'T'}${bDateStr.includes('T') ? '' : (bTimeStr || '00:00:00')}` : null;
      const aD = parseMysqlDatetimeToDate(aFull as any);
      const bD = parseMysqlDatetimeToDate(bFull as any);
      const aTs = aD ? aD.getTime() : 0;
      const bTs = bD ? bD.getTime() : 0;

      switch (this.sortBy) {
        case 'date_desc':
          return bTs - aTs;
        case 'date_asc':
          return aTs - bTs;
        case 'title_asc':
          return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());
        case 'title_desc':
          return (b.title || '').toLowerCase().localeCompare((a.title || '').toLowerCase());
        default:
          return bTs - aTs;
      }
    });
  }

  // Search function
  onSearch() {
    // Optionally trigger filtering logic or just rely on ngModel binding
  }

  clearSearch() {
    this.searchTerm = '';
  }

  onSortChange() {
    // Trigger re-computation of filteredEvents
  }

  // Certificate download function (dummy for now)
  downloadCertificate(eventId: number) {
    alert('Certificate download functionality will be implemented with backend integration');
  }

  downloadQrCode(qrUrl: string, eventId: number) {
    // Fetch the image as a blob and trigger download
    this.http.get(qrUrl, { responseType: 'blob' }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr_code_${eventId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

    formatTime(timeString: string | null | undefined): string {
    if (!timeString) return '';
    const parts = timeString.split(':');
    if (parts.length < 2) return '';
    const [hours, minutes] = parts;
    const date = new Date();
    date.setHours(+hours, +minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
