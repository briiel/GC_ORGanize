import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scan-qr',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.css']
})
export class ScanQrComponent {
  qrResultString: string = '';
  message: string = '';
  scanning: boolean = true;
  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice: MediaDeviceInfo | undefined = undefined;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  onCamerasFound(devices: MediaDeviceInfo[]) {
    console.log('Cameras found:', devices);
    this.availableDevices = devices;
    if (devices.length === 0) {
      this.message = 'No cameras found. Please check your device and permissions.';
    } else {
      this.selectedDevice = devices[0];
      this.scanning = true;
      this.cdr.detectChanges(); // Force update
      console.log('Selected device:', this.selectedDevice);
    }
  }

  onDeviceSelectChange(event: Event) {
    const deviceId = (event.target as HTMLSelectElement).value;
    this.selectedDevice = this.availableDevices.find(d => d.deviceId === deviceId);
    this.message = `Selected camera: ${this.selectedDevice?.label || this.selectedDevice?.deviceId}`;
    this.scanning = true;
    this.cdr.detectChanges(); // Force update
  }

  onCodeResult(resultString: string) {
    this.qrResultString = resultString;
    this.scanning = false;

    let qrData;
    try {
      qrData = JSON.parse(resultString);
    } catch (e) {
      this.message = 'Invalid QR code format.';
      return;
    }

    // You may need to adjust these keys based on your QR code structure
    const { registration_id, event_id, student_id } = qrData;
    if (!registration_id || !event_id || !student_id) {
      this.message = 'QR code missing required data.';
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      this.message = 'You must be logged in as an organization.';
      return;
    }

    this.http.post(
      'http://localhost:5000/api/event/events/attendance',
      { registration_id, event_id, student_id },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (res: any) => {
        this.message = res?.message || 'Attendance recorded!';
      },
      error: (err) => {
        this.message = err.error?.message || 'Attendance failed.';
      }
    });
  }

  onScanError(error: any) {
    console.error('Scan error:', error);
    this.message = 'Camera error: ' + (error?.name || error?.message || error);
  }
}
