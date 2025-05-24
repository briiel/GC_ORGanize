import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../modal.service';
import { RegistermodalComponent } from '../registermodal/registermodal.component';
import { ViewmodalComponent } from '../viewmodal/viewmodal.component';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RegistermodalComponent, ViewmodalComponent, RouterModule]
})
export class HomeComponent implements OnInit {
  dropdownVisible = false;
  notificationDropdownVisible = false;

  events: any[] = [];
  searchTerm: string = '';

  notifications: any[] = [];
  unreadCount: number = 0;

  currentPage: number = 1;
  pageSize: number = 6;

  constructor(private eventService: EventService, private authService: AuthService, private router: Router) { }

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

        // Sort by created_at descending (latest first)
        allEvents.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        this.events = allEvents;
      },
      (error) => {
        console.error('Error fetching events:', error);
        this.events = [];
      }
    );
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
          (event.location && event.location.toLowerCase().includes(search)) ||
          (event.description && event.description.toLowerCase().includes(search))
        );
      });
    }
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
          (event.location && event.location.toLowerCase().includes(search)) ||
          (event.description && event.description.toLowerCase().includes(search))
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
    this.selectedEventId = event.event_id; 
    this.isRegisterModalOpen = true;
  }

  closeRegisterModal() {
    this.isRegisterModalOpen = false;
    this.selectedEventId = null;
  }

  isViewModalOpen = false;
  selectedEvent: any = null;

  openViewModal(event: any) {
    this.selectedEvent = event;
    this.isViewModalOpen = true;
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.selectedEvent = null;
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

}
