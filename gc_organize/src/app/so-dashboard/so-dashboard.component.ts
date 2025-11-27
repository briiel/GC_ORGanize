import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventService } from '../services/event.service';
import { RbacAuthService } from '../services/rbac-auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { parseMysqlDatetimeToDate } from '../utils/date-utils';

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

  // Activity log
  activities: any[] = [];
  activityPage: number = 1;
  readonly activityPageSize: number = 10;

  // Pagination for upcoming events
  upcomingPage: number = 1;
  readonly upcomingPageSize: number = 3;

  // Modal states
  showUpcomingEventsModal: boolean = false;
  showRecentActivityModal: boolean = false;
  modalUpcomingPage: number = 1;
  readonly modalUpcomingPageSize: number = 10;
  modalActivityPage: number = 1;
  readonly modalActivityPageSize: number = 15;

  private refreshHandle?: ReturnType<typeof setInterval>;
  private statusChangedSub?: Subscription;

  constructor(private eventService: EventService, private auth: RbacAuthService) {}

  ngOnInit() {
    const org = this.auth.getUserOrganization();
    this.orgName = org?.org_name || 'Student Organization';
    const creatorId = this.auth.getCreatorId();
    if (!creatorId) {
      this.events = [];
      return;
    }
    this.loadOrgEvents(creatorId);
    this.loadActivityLog();
    this.refreshHandle = setInterval(() => {
      this.loadOrgEvents(creatorId);
      this.loadActivityLog();
    }, 60_000);

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
        
        // Refresh the events list to reflect the change
        const creatorId = this.auth.getCreatorId();
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

        // Load activity log after events are loaded
        this.loadActivityLog();

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
        return (parseMysqlDatetimeToDate(a.start_date)?.getTime() ?? 0) - (parseMysqlDatetimeToDate(b.start_date)?.getTime() ?? 0);
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

  // Activity log methods
  private loadActivityLog() {
    // Generate activity log from events
    this.activities = [];
    
    
    
    // Helper function to create valid date
    const createValidDate = (dateStr: string | null | undefined, timeStr?: string | null): Date => {
      if (!dateStr) return new Date(); // Fallback to current date
      const dateTimeStr = timeStr ? `${dateStr} ${timeStr}` : dateStr;
      const parsed = parseMysqlDatetimeToDate(dateTimeStr);
      return parsed ?? new Date();
    };

    // Generate activity entries based on events - showing all activities as they happen
    this.events.forEach(event => {
      const eventDate = event.created_at
        ? createValidDate(event.created_at)
        : createValidDate(event.start_date);
      
      const status = String(event.status || 'not yet started').toLowerCase();

      // Determine the name of the creator for this event (org or OSWS admin)
      // Prefer the individual creator's name (created_by_name) over the organization name
      const creatorName = event.created_by_name || event.org_name || event.osws_name || this.auth.getUserFullName() || 'User';

      // Always show creation activity
      this.activities.push({
        type: 'create',
        action: `Created event "${event.title}"`,
        user: creatorName,
        timestamp: eventDate,
        eventId: event.event_id
      });

      // Show update activity if event was updated (and it's different from creation)
      if (event.updated_at && event.updated_at !== event.created_at) {
        this.activities.push({
          type: 'update',
          action: `Updated event "${event.title}"`,
          user: creatorName,
          timestamp: createValidDate(event.updated_at),
          eventId: event.event_id
        });
      }

      // Only show cancellation if it was a manual action (status change)
      if (status === 'cancelled' && event.updated_at) {
        const cancelTime = createValidDate(event.updated_at);
        this.activities.push({
          type: 'delete',
          action: `Event "${event.title}" was cancelled`,
          user: creatorName,
          timestamp: cancelTime,
          eventId: event.event_id
        });
      }
      // Note: We don't show automatic status changes (ongoing/concluded) since we don't have 
      // actual status change timestamps - only scheduled start/end times
    });

    // Sort activities: prioritize user actions by timestamp (most recent first)
    this.activities.sort((a, b) => {
      // Define priority levels (higher = more important)
      const getPriority = (activity: any) => {
        if (activity.action.includes('Updated event')) return 3; // Manual updates first
        if (activity.action.includes('Created event')) return 2; // Then creations
        if (activity.action.includes('was cancelled')) return 2; // Cancellations same as creations
        return 1; // Other activities
      };
      
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      // First, sort by priority
      if (priorityB !== priorityA) return priorityB - priorityA;
      
      // Within same priority, sort by timestamp (most recent first)
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    
    
    // Reset to first page
    this.activityPage = 1;
  }

  get pagedActivities(): any[] {
    // Always show the most recent activities (first 10) on the main dashboard
    return this.activities.slice(0, 10);
  }

  get totalActivityPages(): number {
    return Math.max(1, Math.ceil(this.activities.length / this.activityPageSize));
  }

  setActivityPage(page: number) {
    if (page >= 1 && page <= this.totalActivityPages) {
      this.activityPage = page;
    }
  }

  // Modal methods for Upcoming Events
  openUpcomingEventsModal() {
    this.showUpcomingEventsModal = true;
    this.modalUpcomingPage = 1;
    document.body.classList.add('modal-open');
  }

  closeUpcomingEventsModal() {
    this.showUpcomingEventsModal = false;
    document.body.classList.remove('modal-open');
  }

  get modalPagedUpcomingEvents(): any[] {
    const upcoming = this.events
      .filter(e => {
        const status = String(e.status).toLowerCase();
        return status === 'not yet started' || status === 'upcoming';
      })
      .sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return (parseMysqlDatetimeToDate(a.start_date)?.getTime() ?? 0) - (parseMysqlDatetimeToDate(b.start_date)?.getTime() ?? 0);
      });
    const start = (this.modalUpcomingPage - 1) * this.modalUpcomingPageSize;
    return upcoming.slice(start, start + this.modalUpcomingPageSize);
  }

  get modalTotalUpcomingPages(): number {
    const count = this.events.filter(e => {
      const status = String(e.status).toLowerCase();
      return status === 'not yet started' || status === 'upcoming';
    }).length;
    return Math.max(1, Math.ceil(count / this.modalUpcomingPageSize));
  }

  setModalUpcomingPage(page: number) {
    if (page >= 1 && page <= this.modalTotalUpcomingPages) {
      this.modalUpcomingPage = page;
    }
  }

  get totalUpcomingEvents(): number {
    return this.events.filter(e => {
      const status = String(e.status).toLowerCase();
      return status === 'not yet started' || status === 'upcoming';
    }).length;
  }

  // Modal methods for Recent Activity
  openRecentActivityModal() {
    this.showRecentActivityModal = true;
    this.modalActivityPage = 1;
    document.body.classList.add('modal-open');
  }

  closeRecentActivityModal() {
    this.showRecentActivityModal = false;
    document.body.classList.remove('modal-open');
  }

  get modalPagedActivities(): any[] {
    const start = (this.modalActivityPage - 1) * this.modalActivityPageSize;
    return this.activities.slice(start, start + this.modalActivityPageSize);
  }

  get modalTotalActivityPages(): number {
    return Math.max(1, Math.ceil(this.activities.length / this.modalActivityPageSize));
  }

  setModalActivityPage(page: number) {
    if (page >= 1 && page <= this.modalTotalActivityPages) {
      this.modalActivityPage = page;
    }
  }
}