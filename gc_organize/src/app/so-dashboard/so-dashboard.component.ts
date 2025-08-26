import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventService } from '../services/event.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <-- Add this import

@Component({
  selector: 'app-so-dashboard',
  templateUrl: './so-dashboard.component.html',
  styleUrls: ['./so-dashboard.component.css'],
  imports: [CommonModule, RouterModule], // <-- Add RouterModule here
})
export class SoDashboardComponent implements OnInit, OnDestroy {
  orgName: string = 'Student Organization'; // Default fallback
  events: any[] = [];
  stats = {
    upcoming: 0,
    ongoing: 0, // <-- Add this line
    completed: 0,
    cancelled: 0,
    totalAttendees: 0
  };

  private refreshHandle?: ReturnType<typeof setInterval>;
  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.orgName = localStorage.getItem('orgName') || 'Student Organization';
    const creatorId = Number(localStorage.getItem('creatorId'));
    if (!creatorId) {
      this.events = [];
      return;
    }
    this.loadOrgEvents(creatorId);
    // Periodic refresh to reflect status changes
    this.refreshHandle = setInterval(() => this.loadOrgEvents(creatorId), 60_000);
  }

  ngOnDestroy(): void {
    if (this.refreshHandle) clearInterval(this.refreshHandle);
  }

  private loadOrgEvents(creatorId: number) {
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

        const now = new Date();
        const isCompleted = (e: any) => {
          if (String(e.status).toLowerCase() === 'completed') return true;
          const endIso = e.end_date && e.end_time ? `${e.end_date}T${e.end_time}` : null;
          const end = endIso ? new Date(endIso) : undefined;
          return end instanceof Date && !isNaN(end.getTime()) && end < now;
        };
        const isOngoing = (e: any) => String(e.status).toLowerCase() === 'ongoing';
        const isCancelled = (e: any) => String(e.status).toLowerCase() === 'cancelled';
        const isNotYet = (e: any) => String(e.status).toLowerCase() === 'not yet started';

        // Default computation from events list (for UI), but override with backend stats when available
        this.stats.upcoming = events.filter(isNotYet).length;
        this.stats.ongoing = events.filter(isOngoing).length;
        this.stats.completed = events.filter(isCompleted).length;
        this.stats.cancelled = events.filter(isCancelled).length;

        // Query backend stats (completed includes trashed)
        this.eventService.getOrgStats().subscribe({
          next: (s) => {
            const data = s?.data ?? s;
            if (data) {
              this.stats.upcoming = data.upcoming ?? this.stats.upcoming;
              this.stats.ongoing = data.ongoing ?? this.stats.ongoing;
              this.stats.completed = data.completed ?? this.stats.completed;
              this.stats.cancelled = data.cancelled ?? this.stats.cancelled;
            }
          },
          error: () => { /* keep computed fallback */ }
        });

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