import { Component } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-eventsreg',
  imports: [QRCodeComponent, CommonModule],
  templateUrl: './eventsreg.component.html',
  styleUrls: ['./eventsreg.component.css']
})
export class EventsregComponent {
  activeRow: number | null = null;
  qrCodeData: string | null = null;

  generateQRCode(): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000000);
    return `GC_ORGanize-${timestamp}-${random}`;
  }

  toggleQRCode(row: number): void {
    if (this.activeRow === row) {
      this.activeRow = null;
      this.qrCodeData = null;
    } else {
      this.activeRow = row;
      this.qrCodeData = this.generateQRCode();
    }
  }
}
