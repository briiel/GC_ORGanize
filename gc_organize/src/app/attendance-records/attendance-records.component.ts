import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-attendance-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-records.component.html',
  styleUrls: ['./attendance-records.component.css']
})
export class AttendanceRecordsComponent implements OnInit {
  attendanceRecords: any[] = [];
  filteredRecords: any[] = [];
  loading = true;
  error: string | null = null;
  searchTerm: string = '';
  role: string | null = null;

  get isOsws(): boolean { return this.role === 'osws_admin'; }

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.loading = true;
  this.role = this.auth.getUserRole();
    const token = localStorage.getItem('authToken');
  // Dev: this.http.get<any>('http://localhost:5000/api/event/attendance-records', {
  this.http.get<any>('https://gcorg-apiv1-8bn5.onrender.com/api/event/attendance-records', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.attendanceRecords = res.data;
        this.filteredRecords = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load attendance records';
        this.loading = false;
      }
    });
  }

  onSearch() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredRecords = this.attendanceRecords;
      return;
    }
    this.filteredRecords = this.attendanceRecords.filter(record => {
      const fullName = `${(record.first_name || '').toLowerCase()} ${(record.last_name || '').toLowerCase()}`.trim();
      return (
        (record.event_title && record.event_title.toLowerCase().includes(term)) ||
        (fullName && fullName.includes(term)) ||
        (record.student_id && record.student_id.toString().toLowerCase().includes(term))
      );
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredRecords = this.attendanceRecords;
  }

  downloadExcel() {
    const worksheetData = this.filteredRecords.map((record, i) => ({
      '#': i + 1,
      'Event': record.event_title || '-',
      'First Name': record.first_name || '-',
      'Last Name': record.last_name || '-',
      'Suffix': record.suffix || '-',
      'Department': record.department || '-',
      'Program': record.program || '-',
      'Student ID': record.student_id || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'attendance-records.xlsx');
  }
}
