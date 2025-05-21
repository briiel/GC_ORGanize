import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-eventsreg',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eventsreg.component.html',
  styleUrls: ['./eventsreg.component.css']
})
export class EventsregComponent implements OnInit {
  // Search related properties
  searchTerm: string = '';

  registeredEvents: any[] = [];
  studentId: string | null = null;

  constructor(private http: HttpClient, private eventService: EventService) {
    // Get studentId from localStorage as string
    this.studentId = localStorage.getItem('studentId');
  }

  ngOnInit() {
    this.fetchRegisteredEvents();
  }

  fetchRegisteredEvents() {
    if (!this.studentId) return;
    this.eventService.getRegisteredEvents(this.studentId).subscribe({
      next: (events) => {
        this.registeredEvents = events.data || events;
      },
      error: (err) => {
        console.error('Error fetching registered events:', err);
      }
    });
  }

  // Filtered events based on search
  get filteredEvents() {
    return this.registeredEvents.filter(event =>
      event.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Search function
  onSearch(event: any) {
    this.searchTerm = event.target.value;
  }

  // Certificate download function (dummy for now)
  downloadCertificate(eventId: number) {
    alert('Certificate download functionality will be implemented with backend integration');
  }

  downloadQrCode(qrUrl: string, eventId: number) {
    // Fetch the image as a blob and trigger download
    this.http.get(qrUrl, { responseType: 'blob' }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr_code_${eventId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

    formatTime(timeString: string | null | undefined): string {
    if (!timeString) return '';
    const parts = timeString.split(':');
    if (parts.length < 2) return '';
    const [hours, minutes] = parts;
    const date = new Date();
    date.setHours(+hours, +minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}
