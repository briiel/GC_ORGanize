import { Component, ChangeDetectorRef, OnDestroy, AfterViewInit, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-scan-qr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.css']
})
export class ScanQrComponent implements OnInit, AfterViewInit, OnDestroy {
  qrResultString: string = '';
  message: string = '';
  scanning: boolean = true;
  html5QrCode?: Html5Qrcode;
  isRunning = false;
  cameras: { id: string; label: string }[] = [];
  selectedCameraId: string | undefined;
  role: string | null = null;
  get isOsws(): boolean { return this.role === 'osws_admin'; }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private auth: AuthService) {}

  ngOnInit() {
    // Set initial UI text before first change detection to avoid NG0100.
    this.message = 'Click Start Scanner and allow camera access.';
  this.role = this.auth.getUserRole();
  }

  ngAfterViewInit() {}

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

  async startScanner() {
    // Security requirement: must be HTTPS or localhost
    const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    if (!window.isSecureContext && !isLocalhost) {
      this.message = 'Camera requires HTTPS or localhost. Please use https:// or run via ng serve (localhost).';
      this.isRunning = false;
      this.cdr.detectChanges();
      return;
    }

    // Clear any existing instance
    if (this.html5QrCode) {
      try { await this.html5QrCode.stop(); } catch {}
      try { await this.html5QrCode.clear(); } catch {}
    }

    this.message = 'Initializing camera…';
    this.cdr.detectChanges();

    try {
      // Create a new instance bound to the DOM element
      this.html5QrCode = new Html5Qrcode('qr-reader');

      // Ask for permission once to trigger browser prompt explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Immediately stop tracks; Html5Qrcode will request again with correct constraints
        stream.getTracks().forEach(t => t.stop());
      } catch (permErr) {
        const msg = permErr instanceof Error ? permErr.message : String(permErr);
        this.message = 'Camera permission denied. Please allow access in your browser settings.';
        this.isRunning = false;
        this.cdr.detectChanges();
        return;
      }

      // Enumerate cameras if not selected yet
      const devices = await Html5Qrcode.getCameras();
      this.cameras = devices.map(d => ({ id: d.id, label: d.label }));
      if (!this.cameras.length) {
        this.message = 'No cameras found on this device.';
        this.isRunning = false;
        return;
      }

      if (!this.selectedCameraId) {
        const back = this.cameras.find(c => /back|rear|environment/i.test(c.label));
        this.selectedCameraId = (back || this.cameras[this.cameras.length - 1]).id;
      }

      await this.html5QrCode.start(
        { deviceId: { exact: this.selectedCameraId } },
        { fps: 10, qrbox: 250 },
        (decodedText) => this.onCodeResult(decodedText),
        () => {}
      );

      this.isRunning = true;
      this.message = 'Scanner ready. Present a QR code.';
      this.cdr.detectChanges();
    } catch (err: any) {
  this.isRunning = false;
  const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      // Helpful hints for common issues
      const hint = /NotAllowedError/i.test(msg)
        ? ' Camera permission was denied.'
        : /NotFoundError/i.test(msg)
        ? ' No suitable camera found.'
        : /NotReadableError|TrackStartError/i.test(msg)
        ? ' Camera is in use by another app.'
        : '';
      this.message = 'Camera start failed: ' + msg + hint;
      this.cdr.detectChanges();
    }
  }

  async stopScanner() {
    if (this.html5QrCode) {
      try { await this.html5QrCode.stop(); } catch {}
      try { await this.html5QrCode.clear(); } catch {}
    }
    this.isRunning = false;
    this.message = 'Scanner stopped.';
    this.cdr.detectChanges();
  }

  async onCameraChange(newId: string) {
    this.selectedCameraId = newId;
    await this.startScanner();
  }

  async switchCamera() {
    if (!this.cameras.length) return;
    const idx = this.cameras.findIndex(c => c.id === this.selectedCameraId);
    const next = this.cameras[(idx + 1) % this.cameras.length];
    this.selectedCameraId = next.id;
    await this.startScanner();
  }

  async retry() {
    await this.startScanner();
  }

  onCodeResult(resultString: string) {
    // Prevent multiple triggers for the same scan
    if (!this.scanning) return;
    this.scanning = false; // Pause scanning

    // Accept both legacy JSON payload and new plain student_id string
    let registration_id: number | undefined;
    let event_id: number | undefined;
    let student_id: string | undefined;
    try {
      const parsed: any = JSON.parse(resultString);
      if (parsed && typeof parsed === 'object') {
        registration_id = parsed.registration_id;
        event_id = parsed.event_id;
        student_id = parsed.student_id ?? parsed.studentId ?? parsed.id ?? parsed['student-id'];
      } else if (typeof parsed === 'string' || typeof parsed === 'number') {
        // QR contained a primitive like "202211223" or 202211223
        student_id = String(parsed).trim();
      }
    } catch {
      // Not JSON; treat whole string as student_id
      student_id = resultString?.trim();
    }
    // If the value still has surrounding quotes, remove them
    if (student_id && ((student_id.startsWith('"') && student_id.endsWith('"')) || (student_id.startsWith("'") && student_id.endsWith("'")))) {
      student_id = student_id.slice(1, -1).trim();
    }

    if (!student_id) {
      this.message = 'Invalid QR code. No student ID found.';
      Swal.fire('Error', 'Invalid QR code. No student ID found.', 'error').then(() => {
        this.scanning = true; // Resume scanning after alert
      });
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      this.message = 'You must be logged in as an organization or OSWS admin.';
      Swal.fire('Error', 'You must be logged in as an organization or OSWS admin.', 'error').then(() => {
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
