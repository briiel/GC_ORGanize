import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RbacAuthService } from '../services/rbac-auth.service';
import { EventService } from '../services/event.service';
import { ExcelExportService } from '../services/excel-export.service';
import { parseMysqlDatetimeToDate, formatToLocalShort } from '../utils/date-utils';
import { normalizeList } from '../utils/api-utils';

@Component({
  selector: 'app-attendance-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-records.component.html',
  styleUrls: ['./attendance-records.component.css']
})
export class AttendanceRecordsComponent implements OnInit {
  // Pagination for records table
  recordPage: number = 1;
  recordsPerPage: number = 10;

  // Pagination for event list
  eventPage: number = 1;
  eventsPerPage: number = 10;
  eventSearchTerm: string = '';
  events: any[] = [];
  attendanceRecords: any[] = [];
  filteredRecords: any[] = [];
  selectedEvent: any = null;
  loading = true;
  error: string | null = null;
  searchTerm: string = '';
  departmentFilter: string = '';
  programFilter: string = '';
  role: string | null = null;
  showMobileModal: boolean = false;

  get isOsws(): boolean { 
    return this.role === 'osws_admin'; 
  }

  get filteredEvents() {
    const term = this.eventSearchTerm.trim().toLowerCase();
    // Organization: hide concluded by default; include when searching.
    if (!term) {
      if (!this.isOsws) {
        return (this.events || []).filter(e => (String(e?.status || '').toLowerCase()) !== 'concluded');
      }
      return this.events;
    }
    // With search: match by title or status, include concluded if matched
    return (this.events || []).filter(e => {
      const title = String(e?.title || '').toLowerCase();
      const status = String(e?.status || '').toLowerCase();
      return title.includes(term) || status.includes(term);
    });
  }
  
  get sortedEvents() {
    return [...this.filteredEvents].sort((a, b) => 
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    );
  }
  
  get pagedEvents() {
    const start = (this.eventPage - 1) * this.eventsPerPage;
    return this.sortedEvents.slice(start, start + this.eventsPerPage);
  }
  
  get totalEventPages() {
    return Math.ceil(this.filteredEvents.length / this.eventsPerPage) || 1;
  }
  
  setEventPage(page: number) {
    if (page >= 1 && page <= this.totalEventPages) {
      this.eventPage = page;
    }
  }
  
  onEventSearch() {
    this.eventPage = 1;
  }

  constructor(
    private eventService: EventService, 
    private auth: RbacAuthService, 
    private http: HttpClient,
    private excelExportService: ExcelExportService
  ) {}

  ngOnInit() {
    this.loading = true;
    const primaryRole = this.auth.getPrimaryRole();
    if (primaryRole === 'OSWSAdmin') {
      this.role = 'osws_admin';
    } else if (primaryRole === 'OrgOfficer') {
      this.role = 'organization';
    } else if (primaryRole === 'Student') {
      this.role = 'student';
    }
    
    if (this.role === 'osws_admin') {
      const adminId = this.auth.getAdminId();
      if (!adminId) return;
      this.eventService.getEventsByAdmin(adminId).subscribe({
              next: (res) => {
                this.events = normalizeList(res);
                this.selectedEvent = null;
                this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load events';
          this.loading = false;
        }
      });
    } else if (this.role === 'organization') {
      const creatorId = this.auth.getCreatorId();
      if (!creatorId) return;
      this.eventService.getEventsByCreator(creatorId).subscribe({
        next: (res) => {
          this.events = normalizeList(res);
          this.selectedEvent = null;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load events';
          this.loading = false;
        }
      });
    } else {
      this.error = 'You are not authorized to view attendance records.';
      this.loading = false;
    }
  }

  fetchAttendanceForEvent(eventId: number) {
    this.loading = true;
    this.eventService.getEventAttendance(eventId).subscribe({
      next: (res) => {
        this.attendanceRecords = normalizeList(res);
        this.filteredRecords = this.attendanceRecords;
        this.recordPage = 1;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load attendance records for event.';
        this.loading = false;
      }
    });
  }

  selectEvent(event: any) {
    this.selectedEvent = event;
    this.searchTerm = '';
    this.fetchAttendanceForEvent(event.event_id);
    this.recordPage = 1;
    // Automatically open modal on mobile
    if (window.innerWidth < 768) {
      this.showMobileModal = true;
    }
  }

  filterAttendees() {
    if (!this.selectedEvent) {
      this.filteredRecords = [];
      return;
    }
    this.filteredRecords = this.attendanceRecords;
    this.recordPage = 1;
  }

  onSearch() {
    if (!this.selectedEvent) {
      this.filteredRecords = [];
      return;
    }
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredRecords = this.attendanceRecords;
      this.recordPage = 1;
      return;
    }
    this.filteredRecords = this.attendanceRecords.filter(record => {
      const fullName = `${(record.first_name || '').toLowerCase()} ${(record.last_name || '').toLowerCase()}`.trim();
      return (
        (fullName && fullName.includes(term)) ||
        (record.student_id && record.student_id.toString().toLowerCase().includes(term)) ||
        (record.department && record.department.toLowerCase().includes(term)) ||
        (record.program && record.program.toLowerCase().includes(term))
      );
    });
    this.recordPage = 1;
  }
  get pagedRecords() {
    const start = (this.recordPage - 1) * this.recordsPerPage;
    return this.filteredRecords.slice(start, start + this.recordsPerPage);
  }

  get totalRecordPages() {
    return Math.ceil(this.filteredRecords.length / this.recordsPerPage) || 1;
  }

  setRecordPage(page: number) {
    if (page >= 1 && page <= this.totalRecordPages) {
      this.recordPage = page;
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterAttendees();
  }

  // Format timestamp into a readable local string
  formatDateTime(value: string | Date | null | undefined): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' && value.trim() === '') return '-';
    try {
      const d = parseMysqlDatetimeToDate(value as any);
      if (!d) return '-';
      return formatToLocalShort(d);
    } catch {
      return '-';
    }
  }

  // Combine first name, last name, and suffix into a single display string
  formatName(record: any): string {
    const first = (record?.first_name || '').trim();
    const last = (record?.last_name || '').trim();
    const suffix = (record?.suffix || '').trim();
    const core = [first, last].filter(Boolean).join(' ').trim();
    const withSuffix = suffix ? `${core} ${suffix}`.trim() : core;
    return withSuffix || '-';
  }

  async downloadExcel() {
    const headers = ['#', 'Student ID', 'Name', 'Department', 'Program', 'Time In', 'Time Out', 'Scanned By'];
    
    const data = this.filteredRecords.map((record, i) => [
      i + 1,
      record.student_id || '-',
      this.formatName(record),
      record.department || '-',
      record.program || '-',
      this.formatDateTime(record.time_in || record.attended_at),
      this.formatDateTime(record.time_out),
      record.scanned_by || '-'
    ]);

    const eventTitle = this.selectedEvent?.title || 'event';
    const filename = `attendees-${eventTitle.replace(/\s+/g, '_')}.xlsx`;

    await this.excelExportService.createAndExportExcel('Attendees', headers, data, filename);
  }
}