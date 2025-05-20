import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Add this import
import { EventService } from '../services/event.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manage-event',
  templateUrl: './manage-event.component.html',
  styleUrls: ['./manage-event.component.css'],
  imports: [CommonModule, FormsModule] // <-- Add this line
})
export class ManageEventComponent implements OnInit {
  events: any[] = [];
  creatorId: number;

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
}
