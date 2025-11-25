import { Component, ChangeDetectorRef, OnDestroy, AfterViewInit, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Swal from 'sweetalert2';
import { RbacAuthService } from '../services/rbac-auth.service';
import { OsmService } from '../services/osm.service';
import { firstValueFrom } from 'rxjs';
import { EventService } from '../services/event.service';
import { environment } from '../../environments/environment';

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

  // Event selection for disambiguating which event to record attendance for
  events: any[] = [];
  selectedEventId: number | null = null;
  // Mode selection for better UX: 'time_in' | 'time_out'
  mode: 'time_in' | 'time_out' = 'time_in';
  // Location consent flag bound to the checkbox in the UI
  locationConsent: boolean = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: RbacAuthService,
    private eventService: EventService,
    private osm: OsmService
  ) {}

  ngOnInit() {
    // Set initial UI text before first change detection to avoid NG0100.
    this.message = 'Click Start Scanner and allow camera access.';
    const primaryRole = this.auth.getPrimaryRole();
    if (primaryRole === 'OSWSAdmin') {
      this.role = 'osws_admin';
    } else if (primaryRole === 'OrgOfficer') {
      this.role = 'organization';
    } else if (primaryRole === 'Student') {
      this.role = 'student';
    }
    this.fetchScannerEvents();
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
    // Require explicit location consent before starting scanner
    if (!this.locationConsent) {
      const result = await Swal.fire({
        title: 'Location Consent Required',
        html: `Scanning requires you to share your location for attendance verification. <br/><br/>
          <b>Privacy:</b> Your location will be used only to verify presence at Gordon College and will be stored with the attendance record.`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'I consent',
        cancelButtonText: 'Cancel'
      });
      if (!result.isConfirmed) {
        return;
      }
      this.locationConsent = true;
    }
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

  async onCodeResult(resultString: string) {
    // Prevent multiple triggers for the same scan
    if (!this.scanning) return;
    this.scanning = false; // Pause scanning

    // Require an event selection to make the same QR usable across different events
    if (!this.selectedEventId) {
      this.message = 'Please select the event you are scanning for.';
      Swal.fire('Select Event', 'Please select the event you are scanning for.', 'warning').then(() => {
        this.scanning = true; // Resume scanning after alert
      });
      return;
    }

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

    const token = localStorage.getItem('gc_organize_token');
    if (!token) {
      this.message = 'You must be logged in as an organization or OSWS admin.';
      Swal.fire('Error', 'You must be logged in as an organization or OSWS admin.', 'error').then(() => {
        this.scanning = true; // Resume scanning after alert
      });
      return;
    }

    // Always use the selected event for attendance
    event_id = this.selectedEventId ?? event_id;

    // Validate user's location before submitting attendance and obtain coords
    let locResult: any = null;
    try {
      locResult = await this.validateLocation();
      if (!locResult || !locResult.ok) {
        this.scanning = true;
        return;
      }
    } catch (e) {
      this.scanning = true;
      return;
    }

    const payload: any = { registration_id, event_id, student_id, mode: this.mode };
    if (locResult && locResult.coords) {
      payload.user_lat = locResult.coords.lat;
      payload.user_lon = locResult.coords.lon;
      payload.user_accuracy = locResult.accuracy ?? null;
      payload.location_consent = this.locationConsent === true;
    }

    this.http.post(
      `${environment.apiUrl}/event/events/attendance`,
      payload,
      { headers: { Authorization: `Bearer ${token}` }, observe: 'response' }
    ).subscribe({
      next: (res: any) => {
        this.message = res.body?.message || 'Attendance recorded!';
        Swal.fire('Success', this.message, 'success').then(() => {
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

  showPrivacy() {
    Swal.fire({
      title: 'Privacy Notice',
      html: `We collect your device location only to verify attendance at Gordon College. The location is stored with the attendance record for audit and fraud prevention and will be retained according to policy. By consenting you agree to this usage.`,
      icon: 'info',
      confirmButtonText: 'Close'
    });
  }

  private async validateLocation(): Promise<any> {
    if (!('geolocation' in navigator)) {
      Swal.fire('Location Unavailable', 'Geolocation is not available in this browser.', 'error');
      return { ok: false };
    }

    // Request user permission for location
    const getPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
      // Force fresh high-accuracy position, no cached values
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });

    let pos: GeolocationPosition;
    try {
      pos = await getPosition();
    } catch (err: any) {
      const msg = err?.message || String(err);
      Swal.fire('Location Required', `Unable to obtain your location: ${msg}`, 'error');
      return { ok: false };
    }

    const userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };

    // If the device reports low accuracy (usually IP-based/wifi geolocation), block.
    const accuracy = pos.coords.accuracy ?? null;
    if (accuracy !== null && accuracy > 100) {
      console.warn('Low location accuracy', accuracy, 'meters');
      Swal.fire('Location Not Precise', 'Your device cannot get a precise location. Use a mobile device with GPS or enable high-accuracy location and try again.', 'warning');
      return { ok: false };
    }

    // Determine event coordinates to validate against
    let eventCoords: { lat: number; lon: number } | null = null;
    try {
      const ev = this.events?.find((x: any) => x && (x.event_id === this.selectedEventId || x.event_id == this.selectedEventId));
      if (ev) {
        // Prefer explicit stored coordinates if backend provides them
        if (ev.event_latitude != null && ev.event_longitude != null) {
          eventCoords = { lat: Number(ev.event_latitude), lon: Number(ev.event_longitude) };
        } else if (ev.latitude != null && ev.longitude != null) {
          eventCoords = { lat: Number(ev.latitude), lon: Number(ev.longitude) };
        } else if (ev.lat != null && ev.lon != null) {
          eventCoords = { lat: Number(ev.lat), lon: Number(ev.lon) };
        } else if (ev.location) {
          // Resolve textual location on-demand via OSM
          try {
            const resolved = await firstValueFrom(this.osm.getPlaceCoordinates(ev.location));
            if (resolved) eventCoords = { lat: resolved.lat, lon: resolved.lon };
          } catch (_) {
            // ignore resolution failure and fall back later
          }
        }
      }
    } catch (e) {
      eventCoords = null;
    }

    // If event coordinates could not be determined, fail explicitly (no silent campus fallback)
    if (!eventCoords) {
      Swal.fire('Location Error', 'Event does not have saved coordinates. Organizer must set event location.', 'error');
      return { ok: false };
    }

    const dist = this.osm.distanceMeters(userCoords, eventCoords as any);
    const radiusMeters = (environment as any).defaultGeofenceMeters ?? 200;

    if (dist > radiusMeters) {
      Swal.fire('Not at Event Location', `You appear to be outside the allowed area. Move closer to the event location (within ${radiusMeters} m) or use a mobile device with GPS, then try again.`, 'error');
      return { ok: false, coords: userCoords, accuracy };
    }

    return { ok: true, coords: userCoords, accuracy };
  }

  private fetchScannerEvents() {
    const token = localStorage.getItem('gc_organize_token');
    if (!token) return;
    const role = this.role;
    if (role === 'osws_admin') {
      const adminId = this.auth.getAdminId();
      if (!adminId) return;
      this.eventService.getEventsByAdmin(adminId).subscribe({
        next: (res: any) => {
          const rows = res?.data || res || [];
          this.events = rows.filter((e: any) => String(e?.status || '').toLowerCase() === 'ongoing');
        },
        error: () => {}
      });
    } else if (role === 'organization') {
      const creatorId = this.auth.getCreatorId();
      if (!creatorId) return;
      this.eventService.getEventsByCreator(creatorId).subscribe({
        next: (res: any) => {
          const rows = res?.data || res || [];
          this.events = rows.filter((e: any) => String(e?.status || '').toLowerCase() === 'ongoing');
        },
        error: () => {}
      });
    }
  }
}
