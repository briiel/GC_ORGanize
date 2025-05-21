import { Component, OnInit } from '@angular/core';
import { EventService } from '../services/event.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <-- Add this import

@Component({
  selector: 'app-so-dashboard',
  templateUrl: './so-dashboard.component.html',
  styleUrls: ['./so-dashboard.component.css'],
  imports: [CommonModule, RouterModule], // <-- Add RouterModule here
})
export class SoDashboardComponent implements OnInit {
  orgName: string = 'Student Organization'; // Default fallback
  events: any[] = [];
  stats = {
    upcoming: 0,
    ongoing: 0, // <-- Add this line
    completed: 0,
    cancelled: 0,
    totalAttendees: 0
  };

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.orgName = localStorage.getItem('orgName') || 'Student Organization';
    const creatorId = Number(localStorage.getItem('creatorId'));
    if (!creatorId) {
      this.events = [];
      return;
    }
    // Fetch events by creator/org
    this.eventService.getEventsByCreator(creatorId).subscribe({
      next: (res) => {
        let events: any[] = [];
        if (res && Array.isArray(res.data)) {
          events = res.data;
        } else if (Array.isArray(res)) {
          events = res;
        } else if (res && Array.isArray(res.events)) {
          events = res.events;
        }
        this.events = events;

        // Add explicit type for 'e'
        this.stats.upcoming = events.filter((e: any) => e.status === 'not yet started').length;
        this.stats.ongoing = events.filter((e: any) => e.status === 'ongoing').length; // <-- Add this line
        this.stats.completed = events.filter((e: any) => e.status === 'completed').length;
        this.stats.cancelled = events.filter((e: any) => e.status === 'cancelled').length;

        // Add explicit type for 'e'
        this.fetchAttendanceStats(events.map((e: any) => e.event_id));
      },
      error: (err) => {
        console.error('Error fetching events:', err);
      }
    });
  }

  fetchAttendanceStats(eventIds: number[]) {
    this.eventService.getAllAttendanceRecords().subscribe({
      next: (res) => {
        let records: any[] = [];
        if (res && Array.isArray(res.data)) {
          records = res.data;
        } else if (Array.isArray(res)) {
          records = res;
        }
        // Add explicit type for 'r'
        this.stats.totalAttendees = records.filter((r: any) => eventIds.includes(r.event_id)).length;
      },
      error: (err) => {
        console.error('Error fetching attendance records:', err);
      }
    });
  }

  formatTime(timeString: string | null | undefined): string {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}