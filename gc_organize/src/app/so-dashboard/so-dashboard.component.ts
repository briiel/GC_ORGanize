import { Component, OnInit } from '@angular/core';
import { EventService } from '../services/event.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-dashboard',
  templateUrl: './so-dashboard.component.html',
  styleUrls: ['./so-dashboard.component.css'],
  imports: [CommonModule],
})
export class SoDashboardComponent implements OnInit {
  events: any[] = [];

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.eventService.getAllEvents().subscribe(
      (data) => {
        console.log('Events API response:', data); // Check the structure in the browser console
        // Fix: Use data.data for events
        if (data && Array.isArray(data.data)) {
          this.events = data.data;
        } else if (Array.isArray(data)) {
          this.events = data;
        } else if (data && Array.isArray(data.events)) {
          this.events = data.events;
        } else {
          this.events = [];
          console.error('Unexpected events data structure:', data);
        }
      },
      (error) => {
        console.error('Error fetching events:', error);
      }
    );
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