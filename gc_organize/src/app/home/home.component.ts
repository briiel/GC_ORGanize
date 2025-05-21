import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../modal.service';
import { RegistermodalComponent } from '../registermodal/registermodal.component';
import { ViewmodalComponent } from '../viewmodal/viewmodal.component';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';


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

  constructor(private eventService: EventService, private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.eventService.getAllEvents().subscribe(
      (data) => {
        if (data && Array.isArray(data.data)) {
          this.events = data.data;
        } else if (Array.isArray(data)) {
          this.events = data;
        } else if (data && Array.isArray(data.events)) {
          this.events = data.events;
        } else {
          this.events = [];
        }
      },
      (error) => {
        console.error('Error fetching events:', error);
      }
    );
    this.loadNotifications();
  }

  loadNotifications() {
    this.eventService.getNotifications().subscribe({
      next: (data: any) => {
        // Safely handle different response shapes
        let notifications: any[] = [];
        if (Array.isArray(data)) {
          notifications = data;
        } else if (data && Array.isArray(data.data)) {
          notifications = data.data;
        } else if (data && Array.isArray(data.notifications)) {
          notifications = data.notifications;
        }
        this.notifications = notifications;
        this.unreadCount = notifications.filter((n: any) => !n.is_read).length;
      },
      error: (err) => {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  get filteredEvents() {
    const search = this.searchTerm.trim().toLowerCase();
    if (!search) return this.events;
    return this.events.filter(event =>
      (event.title && event.title.toLowerCase().includes(search)) ||
      (event.department && event.department.toLowerCase().includes(search)) ||
      (event.location && event.location.toLowerCase().includes(search)) ||
      (event.description && event.description.toLowerCase().includes(search))
    );
  }

  onSearchInput(event: any) {
    this.searchTerm = event.target.value;
  }

  clearSearch() {
    this.searchTerm = '';
  }

  toggleDropdown() {
    this.dropdownVisible = !this.dropdownVisible;
    this.notificationDropdownVisible = false; // Hide notification dropdown when account dropdown is shown
    const dropdown = document.getElementById('dropdown');
    const notificationDropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden', !this.dropdownVisible);
    }
    if (notificationDropdown) {
      notificationDropdown.classList.add('hidden');
    }
  }

  onNotificationClick(notif: any, event: MouseEvent) {
    event.preventDefault();
    if (!notif.is_read) {
      this.eventService.markNotificationAsRead(notif.id).subscribe(() => {
        notif.is_read = true;
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
      });
    }
    if (notif.event_id) {
      const eventObj = this.events.find(e => e.event_id === notif.event_id || e.id === notif.event_id);
      if (eventObj) {
        this.openViewModal(eventObj);
      }
    }
  }

  toggleNotificationDropdown() {
    this.notificationDropdownVisible = !this.notificationDropdownVisible;
    this.dropdownVisible = false;
    const notificationDropdown = document.getElementById('notificationDropdown');
    const dropdown = document.getElementById('dropdown');
    if (notificationDropdown) {
      notificationDropdown.classList.toggle('hidden', !this.notificationDropdownVisible);
    }
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
    if (this.notificationDropdownVisible) {
      this.loadNotifications(); // Refresh notifications when opened
    }
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
    this.selectedEventId = event.event_id; // or event.id, depending on your event object
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

  // changePage(page: number) {
  //   this.currentPage = page;
  //   this.updateDisplayedCards();
  // }

  // getPageNumbers(): number[] {
  //   return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  // }

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

  expandedNotificationId: number | null = null;

  onNotificationExpand(notif: any, event: MouseEvent) {
    event.stopPropagation(); // Prevents the click from bubbling up
    event.preventDefault(); // Prevents the anchor's default navigation
    this.expandedNotificationId = this.expandedNotificationId === notif.id ? null : notif.id;
  }
}
