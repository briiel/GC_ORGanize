import { Component } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-eventsreg',
  standalone: true,
  imports: [QRCodeComponent, CommonModule, FormsModule],
  templateUrl: './eventsreg.component.html',
  styleUrls: ['./eventsreg.component.css']
})
export class EventsregComponent {
  // QR Code related properties
  activeRow: number | null = null;
  qrCodeData: string = '#';

  // Search related properties
  searchTerm: string = '';
  

  // Filtered events based on search
  events = [
    {
      id: 1,
      name: 'Tech Conference 2024',
      venue: 'Convention Center',
      date: '2024-04-15',
      time: '09:00 AM',
      status: 'Active',
      image: '#'
    },
    // ... other events ...
  ];

  get filteredEvents() {
    return this.events.filter(event =>
      event.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // QR Code toggle function
  toggleQRCode(eventId: number) {
    if (this.activeRow === eventId) {
      this.activeRow = null;
    } else {
      this.activeRow = eventId;
      this.qrCodeData = `#`;
    }
  }

  // Search function
  onSearch(event: any) {
    this.searchTerm = event.target.value;
  }

  // Certificate download function (dummy for now)
  downloadCertificate(eventId: number) {
    alert('Certificate download functionality will be implemented with backend integration');
  }
}
