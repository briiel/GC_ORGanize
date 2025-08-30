import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-attendance-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-records.component.html',
  styleUrls: ['./attendance-records.component.css']
})


export class AttendanceRecordsComponent implements OnInit {
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

  get isOsws(): boolean { return this.role === 'osws_admin'; }

  get filteredEvents() {
    const term = this.eventSearchTerm.trim().toLowerCase();
    if (!term) return this.events;
    return this.events.filter(e => (e.title || '').toLowerCase().includes(term));
  }
  get sortedEvents() {
    return [...this.filteredEvents].sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
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

  constructor(private eventService: EventService, private auth: AuthService) {}

  ngOnInit() {
    this.loading = true;
  this.role = this.auth.getUserRole();
    const token = localStorage.getItem('authToken');
  // Dev: this.http.get<any>('http://localhost:5000/api/event/attendance-records', {
  this.http.get<any>('https://gcorg-apiv1-8bn5.onrender.com/api/event/attendance-records', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
    this.role = this.auth.getUserRole();
    if (this.role === 'osws_admin') {
      const adminId = Number(localStorage.getItem('adminId'));
      this.eventService.getEventsByAdmin(adminId).subscribe({
        next: (res) => {
          this.events = res.data || res;
          this.selectedEvent = null;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load events';
          this.loading = false;
        }
      });
    } else if (this.role === 'organization') {
      const creatorId = Number(localStorage.getItem('creatorId'));
      this.eventService.getEventsByCreator(creatorId).subscribe({
        next: (res) => {
          this.events = res.data || res;
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
        this.attendanceRecords = res.data || res;
        this.filteredRecords = this.attendanceRecords;
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
  }

  onSearch() {
    if (!this.selectedEvent) {
      this.filteredRecords = [];
      return;
    }
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredRecords = this.attendanceRecords;
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
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterAttendees();
  }

  downloadExcel() {
    const worksheetData = this.filteredRecords.map((record, i) => ({
      '#': i + 1,
      'Student ID': record.student_id || '-',
      'First Name': record.first_name || '-',
      'Last Name': record.last_name || '-',
      'Suffix': record.suffix || '-',
      'Department': record.department || '-',
      'Program': record.program || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'attendees-' + (this.selectedEvent ? this.selectedEvent.replace(/\s+/g, '_') : 'event') + '.xlsx');
  }
}
