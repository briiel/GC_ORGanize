import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventService } from '../services/event.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-so-dashboard',
  templateUrl: './so-dashboard.component.html',
  styleUrls: ['./so-dashboard.component.css'],
  imports: [CommonModule, RouterModule],
})

export class SoDashboardComponent implements OnInit, OnDestroy {
  orgName: string = 'Student Organization';
  events: any[] = [];
  stats = {
    upcoming: 0,
    ongoing: 0,
    concluded: 0,
    cancelled: 0,
    totalAttendees: 0
  };

  // Pagination for upcoming events
  upcomingPage: number = 1;
  readonly upcomingPageSize: number = 5;

  private refreshHandle?: ReturnType<typeof setInterval>;
  private statusChangedSub?: Subscription;

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.orgName = localStorage.getItem('orgName') || 'Student Organization';
    const creatorId = Number(localStorage.getItem('creatorId'));
    if (!creatorId) {
      this.events = [];
      return;
    }
    this.loadOrgEvents(creatorId);
    this.refreshHandle = setInterval(() => this.loadOrgEvents(creatorId), 60_000);

    this.statusChangedSub = this.eventService.statusChanged$.subscribe(() => {
      this.loadOrgEvents(creatorId);
    });
  }

  ngOnDestroy(): void {
    if (this.refreshHandle) clearInterval(this.refreshHandle);
    if (this.statusChangedSub) this.statusChangedSub.unsubscribe();
  }

  // New method to manually update event status
  updateEventStatus(eventId: number, newStatus: string): void {
    this.eventService.updateEventStatus(eventId, newStatus).subscribe({
      next: (response) => {
        console.log('Status updated successfully:', response);
        // Refresh the events list to reflect the change
        const creatorId = Number(localStorage.getItem('creatorId'));
        if (creatorId) {
          this.loadOrgEvents(creatorId);
        }
      },
      error: (error) => {
        console.error('Error updating event status:', error);
        // You might want to show a toast notification here
      }
    });
  }

  // Helper method to check if an event can be set to ongoing
  canSetToOngoing(event: any): boolean {
    const status = String(event.status).toLowerCase();
    // Allow setting to ongoing if it's currently upcoming or if it was previously ongoing
    return status === 'not yet started' || status === 'upcoming' || status === 'ongoing';
  }

  // Helper method to get available status options for an event
  getAvailableStatuses(event: any): string[] {
    const currentStatus = String(event.status).toLowerCase();
    const allStatuses = ['not yet started', 'ongoing', 'concluded', 'cancelled'];
    
    // You can customize this logic based on your business rules
    switch (currentStatus) {
      case 'not yet started':
      case 'upcoming':
        return ['not yet started', 'ongoing', 'cancelled'];
      case 'ongoing':
        return ['ongoing', 'concluded', 'cancelled'];
      case 'concluded':
        return ['concluded']; // Usually can't change from concluded
      case 'cancelled':
        return ['cancelled', 'not yet started']; // Allow reactivation
      default:
        return allStatuses;
    }
  }

  private loadOrgEvents(creatorId: number) {
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

        // Reset to first page if events change
        this.upcomingPage = 1;

        // Count events by status
        let upcoming = 0, ongoing = 0, concluded = 0, cancelled = 0;
        for (const e of events) {
          const status = String(e.status).toLowerCase();
          if (status === 'cancelled') {
            cancelled++;
          } else if (status === 'concluded') {
            concluded++;
          } else if (status === 'ongoing') {
            ongoing++;
          } else if (status === 'not yet started' || status === 'upcoming') {
            upcoming++;
          }
        }

        this.stats.upcoming = upcoming;
        this.stats.ongoing = ongoing;
        this.stats.concluded = concluded;
        this.stats.cancelled = cancelled;

        // Get backend stats (if needed for additional data)
        this.eventService.getOrgStats().subscribe({
          next: (s) => {
            const data = s?.data ?? s;
            if (data) {
              // Only override if backend has different totals (e.g., includes archived events)
              if (data.totalEvents && data.totalEvents !== events.length) {
                this.stats.upcoming = data.upcoming ?? this.stats.upcoming;
                this.stats.ongoing = data.ongoing ?? this.stats.ongoing;
                this.stats.concluded = data.concluded ?? this.stats.concluded;
                this.stats.cancelled = data.cancelled ?? this.stats.cancelled;
              }
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

  // Get paginated upcoming events
  get pagedUpcomingEvents(): any[] {
    const upcoming = this.events
      .filter(e => {
        const status = String(e.status).toLowerCase();
        return status === 'not yet started' || status === 'upcoming';
      })
      .sort((a, b) => {
        // Compare by start_date (assume format YYYY-MM-DD)
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });
    const start = (this.upcomingPage - 1) * this.upcomingPageSize;
    return upcoming.slice(start, start + this.upcomingPageSize);
  }

  get totalUpcomingPages(): number {
    const count = this.events.filter(e => {
      const status = String(e.status).toLowerCase();
      return status === 'not yet started' || status === 'upcoming';
    }).length;
    return Math.max(1, Math.ceil(count / this.upcomingPageSize));
  }

  setUpcomingPage(page: number) {
    if (page >= 1 && page <= this.totalUpcomingPages) {
      this.upcomingPage = page;
    }
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