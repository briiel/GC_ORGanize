import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EventService } from '../services/event.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterModule, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  events: any[] = [];
  stats = {
    upcoming: 0,
    ongoing: 0,
    concluded: 0,
    cancelled: 0,
    totalAttendees: 0
  };

  // Chart elements
  @ViewChild('deptPieChart') deptPieChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('eventsBarChart') eventsBarChart!: ElementRef<HTMLCanvasElement>;
  private deptChart?: Chart;
  private monthlyChart?: Chart;
  private viewReady = false;
  private refreshHandle?: ReturnType<typeof setInterval>;
  private statusChangedSub?: Subscription;

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    // Initial load
    this.loadEventsAndStats();
    // Periodic refresh to keep statuses (esp. Concluded) up-to-date
    this.refreshHandle = setInterval(() => this.loadEventsAndStats(), 60_000);

    // Instant update on status change
    this.statusChangedSub = this.eventService.statusChanged$.subscribe(() => {
      this.loadEventsAndStats();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    // If data already loaded, render now
    if (this.events && this.events.length) {
      this.renderCharts();
    } else {
      // If no data yet, still render empty charts to avoid layout jump
      this.renderCharts();
    }
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
        // Refresh the events list and charts to reflect the change
        this.loadEventsAndStats();
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
    
    // Customize this logic based on your business rules
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

  // Helper method to check if event is OSWS-created (for admin permissions)
  isOswsEvent(event: any): boolean {
    return event.created_by_osws_id != null;
  }

  // Helper method to check if admin can modify event status
  canModifyEventStatus(event: any): boolean {
    // Admin can modify all events, but you might want to add additional rules
    return true;
  }

  private loadEventsAndStats(): void {
    // For OSWS admin, aggregate across all events (OSWS + organizations)
    this.eventService.getAllEvents().subscribe({
      next: (res) => {
        let events: any[] = [];
        if (res && Array.isArray(res.data)) {
          events = res.data;
        } else if (Array.isArray(res)) {
          events = res;
        } else if (res && Array.isArray(res.events)) {
          events = res.events;
        }
        this.events = events || [];

        // Compute statistics by status with date-based fallback
        this.computeStats();

        // Attendance across all events
        const ids = this.events
          .map((e: any) => e.event_id || e.id)
          .filter((id: any) => id != null);
        if (ids.length) this.fetchAttendanceStats(ids);

        // Fetch backend OSWS stats to ensure Concluded includes trashed until permanent delete
        this.eventService.getOswsStats().subscribe({
          next: (s) => {
            const data = (s as any)?.data ?? s;
            if (data) {
              // Only override if backend has different totals (e.g., includes archived)
              const totalBackendEvents = (data.upcoming || 0) + (data.ongoing || 0) + 
                                       (data.concluded || 0) + (data.cancelled || 0);
              const totalLocalEvents = this.stats.upcoming + this.stats.ongoing + 
                                     this.stats.concluded + this.stats.cancelled;
              
              if (totalBackendEvents !== totalLocalEvents) {
                this.stats.upcoming = data.upcoming ?? this.stats.upcoming;
                this.stats.ongoing = data.ongoing ?? this.stats.ongoing;
                this.stats.concluded = data.concluded ?? this.stats.concluded;
                this.stats.cancelled = data.cancelled ?? this.stats.cancelled;
              }
            }
          },
          error: () => { /* keep computeStats() fallback */ }
        });

        // Render charts when view is ready
        if (this.viewReady) {
          this.renderCharts();
        }
      },
      error: (err) => {
        console.error('Error fetching all events:', err);
      }
    });
  }

  private computeStats(): void {
    const oswsEvents = this.events.filter((e: any) => e.created_by_osws_id != null);

    // Improved: Only count each event in one category with flexible status handling
    let upcoming = 0, ongoing = 0, concluded = 0, cancelled = 0;
    for (const e of oswsEvents) {
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
  }

  private fetchAttendanceStats(eventIds: number[]): void {
    this.eventService.getAllAttendanceRecords().subscribe({
      next: (res) => {
        let records: any[] = [];
        if (res && Array.isArray(res.data)) {
          records = res.data;
        } else if (Array.isArray(res)) {
          records = res;
        }
        this.stats.totalAttendees = records.filter((r: any) => eventIds.includes(r.event_id)).length;
        // Re-render charts if needed (no-op for current datasets)
      },
      error: (err) => {
        console.error('Error fetching attendance records:', err);
      }
    });
  }

  private renderCharts(): void {
    // Safeguard against missing canvas
    if (!this.deptPieChart || !this.eventsBarChart) return;

    // Pie/Donut: events by department (EXCLUDES OSWS-created)
    const departmentCounts = new Map<string, number>();
    const orgEventsOnly = this.events.filter((e: any) => e.created_by_org_id != null);
    for (const e of orgEventsOnly) {
      // Normalize: if department missing for an org event, mark as 'Unknown'
      const dept = (e.department || 'Unknown') as string;
      departmentCounts.set(dept, (departmentCounts.get(dept) || 0) + 1);
    }
    const deptLabels = Array.from(departmentCounts.keys());
    const deptData = Array.from(departmentCounts.values());
    // Fixed color mapping per requirement
    const deptColorMap: Record<string, string> = {
      'CCS': '#f59e0b',   // orange
      'CBA': '#eab308',   // yellow
      'CEAS': '#3b82f6',  // blue
      'CHTM': '#ec4899',  // pink
      'CAHS': '#ef4444',  // red
      'OSWS': '#14532d',  // brand green for OSWS-created
      'Unknown': '#9ca3af' // gray fallback
    };
    const fallbackPalette = ['#10b981', '#a855f7', '#06b6d4', '#f97316', '#84cc16'];
    const deptColors = deptLabels.map((label, i) => deptColorMap[label] || fallbackPalette[i % fallbackPalette.length]);

    if (this.deptChart) this.deptChart.destroy();
    if (this.deptPieChart) {
      this.deptChart = new Chart(this.deptPieChart.nativeElement.getContext('2d')!, {
        type: 'doughnut',
        data: {
          labels: deptLabels,
          datasets: [
            {
              data: deptData,
              backgroundColor: deptColors,
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    // Bar: events per month (OSWS-created ONLY)
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyCounts = new Array(12).fill(0);
    const oswsOnly = this.events.filter((e: any) => e.created_by_osws_id != null);
    for (const e of oswsOnly) {
      const d = e.start_date ? new Date(e.start_date) : undefined;
      if (d && !isNaN(d.getTime())) {
        monthlyCounts[d.getMonth()]++;
      }
    }

    if (this.monthlyChart) this.monthlyChart.destroy();
    this.monthlyChart = new Chart(this.eventsBarChart.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'OSWS Events',
            data: monthlyCounts,
            backgroundColor: 'rgba(20, 83, 45, 0.2)', // #14532d @ 20%
            borderColor: '#14532d',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}