import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../modal.service';
import { RegistermodalComponent } from '../registermodal/registermodal.component';
import { ViewmodalComponent } from '../viewmodal/viewmodal.component';
import { Router, RouterModule } from '@angular/router';
import { RbacAuthService } from '../services/rbac-auth.service';
import { EventService } from '../services/event.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RegistermodalComponent, ViewmodalComponent, RouterModule, FormsModule]
})
export class HomeComponent implements OnInit, OnDestroy {
  dropdownVisible = false;
  notificationDropdownVisible = false;

  events: any[] = [];
  searchTerm: string = '';
  sortBy: string = 'date_desc';

  notifications: any[] = [];
  unreadCount: number = 0;

  currentPage: number = 1;
  pageSize: number = 9; // 3x3 layout per page

  constructor(private eventService: EventService, private authService: RbacAuthService, private router: Router) { }

  ngOnInit() {
    forkJoin([
      this.eventService.getAllEvents(),
      this.eventService.getAllOswsEvents()
    ]).subscribe(
      ([orgEvents, oswsEvents]) => {
        let allEvents: any[] = [];

        // Merge org events
        if (orgEvents && Array.isArray(orgEvents.data)) {
          allEvents = allEvents.concat(orgEvents.data);
        } else if (Array.isArray(orgEvents)) {
          allEvents = allEvents.concat(orgEvents);
        } else if (orgEvents && Array.isArray(orgEvents.events)) {
          allEvents = allEvents.concat(orgEvents.events);
        }

        // Merge OSWS events and tag them
        let oswsList: any[] = [];
        if (oswsEvents && Array.isArray(oswsEvents.data)) {
          oswsList = oswsEvents.data;
        } else if (Array.isArray(oswsEvents)) {
          oswsList = oswsEvents;
        } else if (oswsEvents && Array.isArray(oswsEvents.events)) {
          oswsList = oswsEvents.events;
        }
        oswsList = oswsList.map(e => ({
          ...e,
          osws: true,
          department: e.department || 'OSWS' 
        }));
        allEvents = allEvents.concat(oswsList);

        // Deduplicate by event_id or id, prioritize OSWS events
        const eventMap = new Map();
        for (const event of allEvents) {
          const id = event.event_id || event.id;
          if (!eventMap.has(id) || event.osws) {
            eventMap.set(id, event);
          }
        }
        allEvents = Array.from(eventMap.values());

        // Normalize/compute status client-side for consistency (unless cancelled)
        const now = new Date();
        allEvents = allEvents.map(e => {
          const status = String(e.status || '').toLowerCase();
          if (status === 'cancelled') return e;
          function parseLocalDateTime(dateStr: string, timeStr: string): Date {
            if (!dateStr || !timeStr) return new Date('');
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hour, minute] = timeStr.split(':').map(Number);
            return new Date(year, month - 1, day, hour, minute, 0, 0);
          }
          const start = e.start_date && e.start_time ? parseLocalDateTime(e.start_date, e.start_time) : null;
          const end = e.end_date && e.end_time ? parseLocalDateTime(e.end_date, e.end_time) : null;
          let computed = status;
          if (start && end) {
            if (start > now) computed = 'not yet started';
            else if (start <= now && end >= now) computed = 'ongoing';
            else if (end < now) computed = 'concluded';
          }
          return { ...e, status: computed };
        });

        // Sort: normal < concluded < cancelled; within each group, latest created_at first
        const weight = (e: any) => {
          const status = String(e.status || '').toLowerCase();
          if (status === 'cancelled') return 2;
          if (status === 'concluded') return 1;
          return 0;
        };
        allEvents.sort((a, b) => {
          const wDiff = weight(a) - weight(b);
          if (wDiff !== 0) return wDiff;
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA; // latest first
        });

        this.events = allEvents;
      },
      (error) => {
        console.error('Error fetching events:', error);
        this.events = [];
      }
    );
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  get filteredEvents() {
    const search = this.searchTerm.trim().toLowerCase();
    let filtered = this.events;
    if (search) {
      filtered = this.events.filter(event => {
        // If searching for "osws", show all events tagged as OSWS
        if (search === 'osws') {
          return event.osws === true;
        }
        // Otherwise, normal search logic
        return (
          (event.title && event.title.toLowerCase().includes(search)) ||
          (event.department && event.department.toLowerCase().includes(search)) ||
          ((event.room && event.room.toLowerCase().includes(search)) || (event.location && event.location.toLowerCase().includes(search))) ||
          (event.description && event.description.toLowerCase().includes(search)) ||
          (event.status && String(event.status).toLowerCase().includes(search))
        );
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (this.sortBy) {
        case 'date_desc':
          return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
        case 'date_asc':
          return new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime();
        case 'title_asc':
          return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());
        case 'title_desc':
          return (b.title || '').toLowerCase().localeCompare((a.title || '').toLowerCase());
        case 'department':
          return (a.department || '').toLowerCase().localeCompare((b.department || '').toLowerCase());
        default:
          return 0;
      }
    });

    // Pagination logic
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  get totalPages() {
    const search = this.searchTerm.trim().toLowerCase();
    let filtered = this.events;
    if (search) {
      filtered = this.events.filter(event => {
        if (search === 'osws') {
          return event.osws === true;
        }
        return (
          (event.title && event.title.toLowerCase().includes(search)) ||
          (event.department && event.department.toLowerCase().includes(search)) ||
          ((event.room && event.room.toLowerCase().includes(search)) || (event.location && event.location.toLowerCase().includes(search))) ||
          (event.description && event.description.toLowerCase().includes(search)) ||
          (event.status && String(event.status).toLowerCase().includes(search))
        );
      });
    }
    return Math.ceil(filtered.length / this.pageSize) || 1;
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  onSearchInput(event: any) {
    this.searchTerm = event.target.value;
    this.currentPage = 1;
  }

  onSortChange() {
    this.currentPage = 1;
  }

  updateBackgroundImage(event: Event, bgElementId: string): void {
    const imgElement = event.target as HTMLImageElement;
    const bgElement = document.getElementById(bgElementId);
    if (bgElement && imgElement) {
      bgElement.style.backgroundImage = `url('${imgElement.src}')`;
    }
  }

  isRegisterModalOpen = false;
  selectedEventId: number | null = null;

  openRegisterModal(event: any) {
    this.selectedEventId = event.event_id || event.id; 
    this.isRegisterModalOpen = true;
  this.toggleBodyModalClass();
  }

  closeRegisterModal() {
    this.isRegisterModalOpen = false;
    this.selectedEventId = null;
  this.toggleBodyModalClass();
  }

  isViewModalOpen = false;
  selectedEvent: any = null;

  openViewModal(event: any) {
    this.selectedEvent = event;
    this.isViewModalOpen = true;
  this.toggleBodyModalClass();
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.selectedEvent = null;
  this.toggleBodyModalClass();
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

  onSearchClick() {
    // This method is for UX clarity; filtering is already reactive.
    // Optionally, you could trigger analytics or focus the results here.
  }

  private toggleBodyModalClass() {
    const hasOpenModal = this.isRegisterModalOpen || this.isViewModalOpen;
    document.body.classList.toggle('modal-open', hasOpenModal);
  }

  // Helper to check if event is concluded
  isConcluded(event: any): boolean {
    return String(event?.status || '').toLowerCase() === 'concluded';
  }

  // Helper to get display status
  getDisplayStatus(event: any): string {
    return String(event?.status || '').toLowerCase();
  }

}
