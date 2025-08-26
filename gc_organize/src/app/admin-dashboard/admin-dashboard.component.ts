import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
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
    completed: 0,
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

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    // Initial load
    this.loadEventsAndStats();
    // Periodic refresh to keep statuses (esp. Completed) up-to-date
    this.refreshHandle = setInterval(() => this.loadEventsAndStats(), 60_000);
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

        // Fetch backend OSWS stats to ensure Completed includes trashed until permanent delete
        this.eventService.getOswsStats().subscribe({
          next: (s) => {
            const data = (s as any)?.data ?? s;
            if (data) {
              this.stats.upcoming = data.upcoming ?? this.stats.upcoming;
              this.stats.ongoing = data.ongoing ?? this.stats.ongoing;
              this.stats.completed = data.completed ?? this.stats.completed;
              this.stats.cancelled = data.cancelled ?? this.stats.cancelled;
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
    const now = new Date();
    const oswsEvents = this.events.filter((e: any) => e.created_by_osws_id != null);

    const isCompleted = (e: any) => {
      // Consider it completed if status says so OR its end datetime has passed
      if (String(e.status).toLowerCase() === 'completed') return true;
      const endIso = e.end_date && e.end_time ? `${e.end_date}T${e.end_time}` : null;
      const end = endIso ? new Date(endIso) : undefined;
      return end instanceof Date && !isNaN(end.getTime()) && end < now;
    };

    const isOngoing = (e: any) => String(e.status).toLowerCase() === 'ongoing';
    const isCancelled = (e: any) => String(e.status).toLowerCase() === 'cancelled';
    const isNotYet = (e: any) => String(e.status).toLowerCase() === 'not yet started';

  // OSWS Dashboard: scope status counters to OSWS-created events only
  this.stats.upcoming = oswsEvents.filter(isNotYet).length;
  this.stats.ongoing = oswsEvents.filter(isOngoing).length;
  this.stats.completed = oswsEvents.filter(isCompleted).length;
  this.stats.cancelled = oswsEvents.filter(isCancelled).length;
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
