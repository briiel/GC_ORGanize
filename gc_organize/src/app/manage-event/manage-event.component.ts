import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Add this import
import { EventService } from '../services/event.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-event',
  templateUrl: './manage-event.component.html',
  styleUrls: ['./manage-event.component.css'],
  imports: [CommonModule, FormsModule] // <-- Add this line
})
export class ManageEventComponent implements OnInit {
  events: any[] = [];
  creatorId: number;
  searchTerm: string = '';
  statusFilter: string = '';
  filteredList: any[] = [];

  constructor(private eventService: EventService) {
    // Get creator/org ID from localStorage or AuthService
    this.creatorId = Number(localStorage.getItem('creatorId'));
  }

  ngOnInit() {
    this.fetchEvents();
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

  updateEventStatus(event: any) {
    // Use event.event_id instead of event.id
    this.eventService.updateEventStatus(event.event_id, event.status).subscribe({
      next: (res) => {
        // Optionally show a success message or refresh events
        // this.fetchEvents(); // Uncomment if you want to refresh the list
      },
      error: (err) => {
        console.error('Error updating event status:', err);
        // Optionally revert the status change in UI or show an error message
      }
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

  // Remove onSearch(event: any) and ngDoCheck if you want it to be strictly non-reactive

  searchEvents() {
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

  clearSearch() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.filteredList = this.events; // Show all events
  }

  filteredEvents() {
    return this.filteredList;
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
        this.fetchEvents(); // Refresh the list
      },
      error: (err) => {
        Swal.fire('Error', 'Failed to delete event.', 'error');
        console.error('Error deleting event:', err);
      }
    });
  }
}
