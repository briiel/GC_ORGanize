import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../services/event.service';
import { LoadingService } from '../services/loading.service';
import { parseMysqlDatetimeToDate } from '../utils/date-utils';
import { eventLocationSummary as summarizeEventLocation } from '../utils/location-display';
import { RbacAuthService } from '../services/rbac-auth.service';

@Component({
  selector: 'app-eventsreg',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eventsreg.component.html',
  styleUrls: ['./eventsreg.component.css']
})
export class EventsregComponent implements OnInit {
  private loadingService = inject(LoadingService);

  // Search related properties
  searchTerm: string = '';
  sortBy: string = 'event_date_desc';
  loading: boolean = false;
  registeredEvents: any[] = [];
  studentId: string | null = null;
  // Pagination
  page = 1;
  readonly pageSize = 10;

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
    this.loadingService.show('Loading registered events...');
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
        // Frontend sorting has been removed to respect backend sorting by Registration Date.
        this.loading = false;
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error fetching registered events:', err);
        this.loading = false;
        this.loadingService.hide();
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
        (event.department && event.department.toLowerCase().includes(term)) ||
        (event.org_name && String(event.org_name).toLowerCase().includes(term)) ||
        (event.osws_name && String(event.osws_name).toLowerCase().includes(term)) ||
        (event.admin_name && String(event.admin_name).toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
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

      const aRegTs = a?.registered_at ? new Date(a.registered_at).getTime() : 0;
      const bRegTs = b?.registered_at ? new Date(b.registered_at).getTime() : 0;

      switch (this.sortBy) {
        case 'event_date_desc':
          return bTs - aTs;
        case 'event_date_asc':
          return aTs - bTs;
        case 'reg_date_desc':
          return bRegTs - aRegTs;
        case 'reg_date_asc':
          return aRegTs - bRegTs;
        case 'title_asc':
          return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());
        case 'title_desc':
          return (b.title || '').toLowerCase().localeCompare((a.title || '').toLowerCase());
        default:
          return 0;
      }
    });

    return filtered;
  }

  // Pagination getters
  get totalItems() { return this.filteredEvents.length; }
  get totalPages() { return Math.max(1, Math.ceil(this.totalItems / this.pageSize)); }
  
  get pagedEvents() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredEvents.slice(start, start + this.pageSize);
  }

  get showingFrom() {
    if (this.totalItems === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get showingTo() {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  goToPage(p: number) {
    const clamped = Math.min(Math.max(1, p), this.totalPages);
    this.page = clamped;
  }
  
  prevPage() { this.goToPage(this.page - 1); }
  nextPage() { this.goToPage(this.page + 1); }

  // Search function
  onSearch() {
    this.page = 1;
  }

  clearSearch() {
    this.searchTerm = '';
    this.page = 1;
  }

  onSortChange() {
    this.page = 1;
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

  organizerDisplayName(event: any): string {
    if (!event) return '';
    const s = (v: unknown) => (v != null && String(v).trim() ? String(v).trim() : '');
    return s(event.org_name) || s(event.osws_name) || s(event.admin_name);
  }

  organizerEmail(event: any): string {
    if (!event) return '';
    const org = event.org_email != null ? String(event.org_email).trim() : '';
    const osws = event.osws_email != null ? String(event.osws_email).trim() : '';
    return org || osws;
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

  eventLocationSummary(event: any): string {
    return summarizeEventLocation(event);
  }
}
