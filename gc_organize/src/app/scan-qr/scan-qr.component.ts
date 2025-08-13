import { Component, ChangeDetectorRef, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-scan-qr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.css']
})
export class ScanQrComponent implements AfterViewInit, OnDestroy {
  qrResultString: string = '';
  message: string = '';
  scanning: boolean = true;
  html5QrCode?: Html5Qrcode;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.startScanner();
  }

  async ngOnDestroy() {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop();
      } catch (e) {}
      try {
        await this.html5QrCode.clear();
      } catch (e) {}
    }
  }

  startScanner() {
    this.html5QrCode = new Html5Qrcode("qr-reader");
    this.html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250
      },
      (decodedText, decodedResult) => {
        this.onCodeResult(decodedText);
      },
      (errorMessage) => {
        // Optionally handle scan errors
      }
    ).catch(err => {
      this.message = "Camera start failed: " + err;
      this.cdr.detectChanges();
    });
  }

  stopScanner() {
    if (this.html5QrCode) {
      this.html5QrCode.stop().catch(() => {});
      this.html5QrCode.clear();
    }
  }

  onCodeResult(resultString: string) {
    // Prevent multiple triggers for the same scan
    if (!this.scanning) return;
    this.scanning = false; // Pause scanning

    let qrData;
    try {
      qrData = JSON.parse(resultString);
    } catch (e) {
      this.message = 'Invalid QR code format.';
      Swal.fire('Error', 'Invalid QR code format.', 'error').then(() => {
        this.scanning = true; // Resume scanning after alert
      });
      return;
    }

    const { registration_id, event_id, student_id } = qrData;
    if (!registration_id || !event_id || !student_id) {
      this.message = 'QR code missing required data.';
      Swal.fire('Error', 'QR code missing required data.', 'error').then(() => {
        this.scanning = true; // Resume scanning after alert
      });
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      this.message = 'You must be logged in as an organization.';
      Swal.fire('Error', 'You must be logged in as an organization.', 'error').then(() => {
        this.scanning = true; // Resume scanning after alert
      });
      return;
    }

    this.http.post(
  // Dev: 'http://localhost:5000/api/event/events/attendance',
  'https://gcorg-apiv1-8bn5.onrender.com/api/event/events/attendance',
      { registration_id, event_id, student_id },
      { headers: { Authorization: `Bearer ${token}` }, observe: 'response' }
    ).subscribe({
      next: (res: any) => {
        this.message = res.body?.message || 'Attendance recorded!';
        Swal.fire('Success', 'Attendance recorded successfully.', 'success').then(() => {
          this.scanning = true; // Resume scanning after alert
        });
      },
      error: (err) => {
        if (err.status === 409 || (err.error?.message && err.error.message.toLowerCase().includes('already'))) {
          this.message = 'Attendance already recorded.';
          Swal.fire('Notice', 'Attendance already recorded.', 'info').then(() => {
            this.scanning = true; // Resume scanning after alert
          });
        } else {
          this.message = err.error?.message || 'Attendance failed.';
          Swal.fire('Error', this.message, 'error').then(() => {
            this.scanning = true; // Resume scanning after alert
          });
        }
      }
    });
  }
}
