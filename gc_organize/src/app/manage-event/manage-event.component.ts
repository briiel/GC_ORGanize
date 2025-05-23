import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Add this import
import { EventService } from '../services/event.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-event',
  templateUrl: './manage-event.component.html',
  styleUrls: ['./manage-event.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ManageEventComponent implements OnInit {
  events: any[] = [];
  oswsEvents: any[] = [];
  orgEvents: any[] = [];
  creatorId: number;
  adminId: number;
  searchTerm: string = '';
  statusFilter: string = '';
  filteredList: any[] = [];
  isOsws: boolean = false;
  orgEventsSearchTerm: string = '';
  filteredOrgEventsList: any[] = [];

  constructor(private eventService: EventService) {
    // Get creator/org ID from localStorage or AuthService
    this.creatorId = Number(localStorage.getItem('creatorId'));
    this.adminId = Number(localStorage.getItem('adminId'));
    this.isOsws = localStorage.getItem('role') === 'osws_admin';
  }

  ngOnInit() {
    if (this.isOsws) {
      this.fetchOswsEvents();
      this.fetchOrgEvents();
    } else {
      this.fetchEvents();
    }
  }

  fetchEvents() {
    this.eventService.getEventsByCreator(this.creatorId).subscribe({
      next: (res) => {
        this.events = res.data || res;
        this.filteredList = this.events;
      },
      error: (err) => {
        console.error('Error fetching events:', err);
      }
    });
  }

  fetchOswsEvents() {
    if (!this.adminId) return;
    this.eventService.getEventsByAdmin(this.adminId).subscribe({
      next: (res) => {
        this.oswsEvents = res.data || res;
      },
      error: (err) => {
        console.error('Error fetching OSWS events:', err);
      }
    });
  }

  fetchOrgEvents() {
    this.eventService.getAllOrgEvents().subscribe({
      next: (res) => {
        this.orgEvents = res.data || res;
        this.filteredOrgEventsList = this.orgEvents;
      },
      error: (err) => {
        console.error('Error fetching org events:', err);
      }
    });
  }

  updateEventStatus(event: any) {
    this.eventService.updateEventStatus(event.event_id, event.status).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error updating event status:', err);
      }
    });
  }

  updateOswsEventStatus(event: any) {
    this.updateEventStatus(event);
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

  searchEvents() {
    // For OSWS, search both tables
    if (this.isOsws) {
      // Optionally implement search for both tables if needed
    } else {
      this.filteredList = this.events.filter(event => {
        const search = this.searchTerm.trim().toLowerCase();
        const matchesSearch =
          !search ||
          event.title.toLowerCase().includes(search) ||
          event.location.toLowerCase().includes(search) ||
          (event.event_date && (new Date(event.event_date).toLocaleDateString().toLowerCase().includes(search)));
        const matchesStatus =
          !this.statusFilter || event.status === this.statusFilter;
        return matchesSearch && matchesStatus;
      });
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.statusFilter = '';
    if (!this.isOsws) {
      this.filteredList = this.events;
    }
  }

  filteredEvents() {
    return this.filteredList;
  }

  searchOrgEvents() {
    const search = this.orgEventsSearchTerm.trim().toLowerCase();
    if (!search) {
      this.filteredOrgEventsList = this.orgEvents;
      return;
    }
    this.filteredOrgEventsList = this.orgEvents.filter(event =>
      (event.title && event.title.toLowerCase().includes(search)) ||
      (event.location && event.location.toLowerCase().includes(search)) ||
      (event.event_date && (new Date(event.event_date).toLocaleDateString().toLowerCase().includes(search)))
    );
  }

  clearOrgEventsSearch() {
    this.orgEventsSearchTerm = '';
    this.filteredOrgEventsList = this.orgEvents;
  }

  filteredOrgEvents() {
    return this.filteredOrgEventsList;
  }

  confirmDeleteEvent(event: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete event "${event.title}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#679436',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteEvent(event.event_id);
      }
    });
  }

  deleteEvent(eventId: number) {
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        Swal.fire('Deleted!', 'The event has been deleted.', 'success');
        if (this.isOsws) {
          this.fetchOswsEvents();
          this.fetchOrgEvents();
        } else {
          this.fetchEvents();
        }
      },
      error: (err) => {
        Swal.fire('Error', 'Failed to delete event.', 'error');
        console.error('Error deleting event:', err);
      }
    });
  }
}
