import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loading = true;
    const token = localStorage.getItem('authToken');
    this.http.get<any>('http://localhost:5000/api/event/attendance-records', {
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
    this.filteredRecords = this.attendanceRecords.filter(record =>
      (record.event_title && record.event_title.toLowerCase().includes(term)) ||
      (record.student_name && record.student_name.toLowerCase().includes(term)) ||
      (record.student_id && record.student_id.toString().toLowerCase().includes(term))
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredRecords = this.attendanceRecords;
  }

  downloadExcel() {
    const worksheetData = this.filteredRecords.map((record, i) => ({
      '#': i + 1,
      'Event': record.event_title || '-',
      'Student Name': record.student_name || '-',
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
