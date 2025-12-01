import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../services/event.service';
import { RbacAuthService } from '../services/rbac-auth.service';
import Swal from 'sweetalert2';
import { parseMysqlDatetimeToDate } from '../utils/date-utils';
import { normalizeList } from '../utils/api-utils';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  // Data
  attendedEvents: any[] = [];
  loading = false;
  error: string | null = null;

  // UI state
  searchTerm = '';
  // Default: latest event date/time first
  sortBy: 'attended_desc' | 'attended_asc' | 'start_desc' | 'start_asc' = 'start_desc';
  // Pagination
  page = 1;
  readonly pageSize = 9;
  // per-card request state
  sendingId: number | null = null;

  constructor(private eventService: EventService, private auth: RbacAuthService) {}

  ngOnInit(): void {
    const studentId = this.auth.getStudentId();
    if (!studentId) {
      this.error = 'No student ID found.';
      return;
    }
    this.loading = true;
    this.eventService.getAttendedEvents(studentId).subscribe({
      next: (res) => {
        this.attendedEvents = normalizeList(res);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load attended events';
        this.loading = false;
      }
    });
  }

  // Derived list for template
  get items() {
    const term = this.searchTerm.trim().toLowerCase();
    let list = [...(this.attendedEvents || [])];

    // Search
    if (term) {
      list = list.filter(e =>
        String(e.event_title || e.title || '').toLowerCase().includes(term) ||
        String((e.venue ?? e.location) || '').toLowerCase().includes(term)
      );
    }

    // Sort
    list.sort((a, b) => {
      const aAtt = this.safeDate(a.attended_at);
      const bAtt = this.safeDate(b.attended_at);
      const aStart = this.safeDate(`${a.start_date}T${a.start_time || '00:00'}`);
      const bStart = this.safeDate(`${b.start_date}T${b.start_time || '00:00'}`);
      switch (this.sortBy) {
        case 'attended_asc': return aAtt - bAtt;
        case 'attended_desc': return bAtt - aAtt;
        case 'start_asc': return aStart - bStart;
        case 'start_desc': return bStart - aStart;
        default: return 0;
      }
    });

    return list;
  }

  // Paged items for display (3x3 on large screens)
  get totalItems() { return this.items.length; }
  get totalPages() { return Math.max(1, Math.ceil(this.totalItems / this.pageSize)); }
  get pagedItems() {
    const start = (this.page - 1) * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  get showingFrom() {
    if (this.totalItems === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }
  get showingTo() {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  formatDate(d?: string) {
    if (!d) return '';
    try {
      const dd = parseMysqlDatetimeToDate(d as any);
      return dd ? dd.toLocaleDateString() : '';
    } catch { return d || ''; }
  }

  formatTime(t?: string) {
    if (!t) return '';
    try {
      const dd = parseMysqlDatetimeToDate(t as any);
      if (dd) return dd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Fallback for HH:MM format
      const [h, m] = String(t).split(':');
      const dt = new Date();
      dt.setHours(Number(h||0), Number(m||0), 0, 0);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  statusColor(status?: string) {
    const s = String(status || '').toLowerCase();
    if (s === 'ongoing') return 'bg-blue-50 text-blue-800 border-blue-300';
    if (s === 'concluded') return 'bg-green-50 text-green-800 border-green-300';
    if (s === 'cancelled') return 'bg-red-50 text-red-800 border-red-300';
    if (s === 'not yet started') return 'bg-yellow-50 text-yellow-800 border-yellow-300';
    return 'bg-gray-50 text-gray-600 border-gray-300';
  }

  private safeDate(v: any) {
    const d = parseMysqlDatetimeToDate(v as any);
    return d ? d.getTime() : 0;
  }

  // Keep the same handlers as Events Registered (no-op filter trigger and clear)
  onSearch() {
    // Filtering is computed in the getter
    this.page = 1;
  }

  clearSearch() {
    this.searchTerm = '';
    this.page = 1;
  }

  onSortChange() {
    this.page = 1;
  }

  goToPage(p: number) {
    const clamped = Math.min(Math.max(1, p), this.totalPages);
    this.page = clamped;
  }
  prevPage() { this.goToPage(this.page - 1); }
  nextPage() { this.goToPage(this.page + 1); }

  async requestCertificate(eventId?: number) {
    if (!eventId) return;
    const res = await Swal.fire({
      title: 'Request e-certificate?',
      text: 'We\'ll email the event organizer with your request.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Send request',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#679436'
    });
    if (!res.isConfirmed) return;
    this.sendingId = eventId;
    this.eventService.requestCertificate(eventId).subscribe({
      next: () => {
        this.sendingId = null;
        Swal.fire({
          title: 'Request sent',
          text: 'The organizer has been notified. Please check your email for updates.',
          icon: 'success',
          confirmButtonColor: '#679436'
        });
      },
      error: (err) => {
        this.sendingId = null;
        const msg = err?.error?.message || 'Failed to send request.';
        Swal.fire({
          title: 'Could not send',
          text: msg,
          icon: 'error'
        });
      }
    });
  }

  // Mirror Home: set blurred background from poster on load
  updateBackgroundImage(event: Event, bgElementId: string): void {
    const imgElement = event.target as HTMLImageElement;
    const bgElement = document.getElementById(bgElementId);
    if (bgElement && imgElement && imgElement.src) {
      bgElement.style.backgroundImage = `url('${imgElement.src}')`;
    }
  }
}
