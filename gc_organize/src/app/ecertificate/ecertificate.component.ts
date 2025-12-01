import { Component, OnInit } from '@angular/core';
import { CertificateService } from '../services/certificate.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { RbacAuthService } from '../services/rbac-auth.service';
import { normalizeList, normalizeSingle } from '../utils/api-utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ecertificate',
  standalone: true,
  templateUrl: './ecertificate.component.html',
  styleUrls: ['./ecertificate.component.css'],
  imports: [CommonModule, FormsModule]
})
export class EcertificateComponent implements OnInit {
  certificates: any[] = [];
  loading = true;
  searchTerm: string = '';
  sortBy: string = 'date_desc';
  downloadingCertIds: Set<number> = new Set();
  requestingCertIds: Set<number> = new Set();
  requestMessage: string = '';
  requestError: string = ''; 

  constructor(
    private certificateService: CertificateService,
    private http: HttpClient,
    private router: Router,
    private auth: RbacAuthService
  ) {}

  ngOnInit() {
    const studentId = this.auth.getStudentId();
    if (studentId) {
      this.certificateService.getCertificates(studentId).subscribe({
        next: (res) => {
          // Show all events (both OSWS and Organization events)
          // Students can see evaluation requirements and request certificates
          this.certificates = normalizeList(res);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  downloadCertificate(certUrl: string, eventTitle: string, certId?: number) {
    if (certId) {
      this.downloadingCertIds.add(certId);
    }

    fetch(certUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        
        const sanitizedEventTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `certificate_${sanitizedEventTitle}.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Download failed:', error);
        window.open(certUrl, '_blank');
      })
      .finally(() => {
        if (certId) {
          this.downloadingCertIds.delete(certId);
        }
      });
  }

  goToEvaluation(eventId: number, eventTitle: string) {
    this.router.navigate(['/student-dashboard/evaluation', eventId], {
      queryParams: { title: eventTitle }
    });
  }
  
  requestCertificate(eventId: number) {
    this.requestingCertIds.add(eventId);
    this.requestMessage = '';
    this.requestError = '';
    
    this.certificateService.requestCertificate(eventId).subscribe({
      next: (res) => {
        this.requestingCertIds.delete(eventId);
        if (res.success) {
          const msg = res.message || 'Certificate request submitted successfully!';
          this.requestMessage = msg;
          // show SweetAlert toast for better UX
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: msg,
            showConfirmButton: false,
            timer: 3500,
            timerProgressBar: true
          });
          // Update the local certificate entry so UI immediately reflects the new request state
          const cert = this.certificates.find(c => c.event_id === eventId || c.id === eventId);
            if (cert) {
              const s = normalizeSingle(res) || res;
              cert.request_status = s?.request_status ?? res?.request_status ?? 'pending';
              // if server returned any certificate url or related fields, merge them
              if (s?.certificate_url || res?.certificate_url) cert.certificate_url = s?.certificate_url ?? res?.certificate_url;
              if (s?.request_certificate_url || res?.request_certificate_url) cert.request_certificate_url = s?.request_certificate_url ?? res?.request_certificate_url;
          }
          setTimeout(() => this.requestMessage = '', 5000);
        }
      },
      error: (err) => {
        this.requestingCertIds.delete(eventId);
        const msg = err.error?.message || 'Failed to request certificate. Please try again.';
        this.requestError = msg;
        Swal.fire({
          icon: 'error',
          title: 'Request failed',
          text: msg
        });
        setTimeout(() => this.requestError = '', 5000);
      }
    });
  }
  
  isRequesting(eventId: number): boolean {
    return this.requestingCertIds.has(eventId);
  }

  downloadCertificateWithHttp(certUrl: string, eventTitle: string, certId?: number) {
    if (certId) {
      this.downloadingCertIds.add(certId);
    }

    this.http.get(certUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;

        const sanitizedEventTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `certificate_${sanitizedEventTitle}.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Download failed:', error);
        window.open(certUrl, '_blank');
      },
      complete: () => {
        if (certId) {
          this.downloadingCertIds.delete(certId);
        }
      }
    });
  }

  isDownloading(certId: number): boolean {
    return this.downloadingCertIds.has(certId);
  }

  get filteredCertificates() {
    let filtered = this.certificates;
    
    if (this.searchTerm) {
      filtered = filtered.filter(cert =>
        cert.event_title.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (this.sortBy) {
        case 'date_desc':
          return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
        case 'date_asc':
          return new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime();
        case 'title_asc':
          return (a.event_title || '').toLowerCase().localeCompare((b.event_title || '').toLowerCase());
        case 'title_desc':
          return (b.event_title || '').toLowerCase().localeCompare((a.event_title || '').toLowerCase());
        default:
          return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
      }
    });
  }

  onSearch() {
    // Optionally trigger filtering logic or just rely on ngModel binding
  }

  clearSearch() {
    this.searchTerm = '';
  }

  onSortChange() {
    // Trigger re-computation of filteredCertificates
  }

  // Format event date range using start_date/end_date from API
  formatEventDate(cert: any): string {
    const sd: string | undefined = cert?.start_date;
    const ed: string | undefined = cert?.end_date;
    if (!sd && !ed) return '—';
    if (sd && !ed) return this.formatYmd(sd);
    if (!sd && ed) return this.formatYmd(ed);
  if (sd === ed && sd) return this.formatYmd(sd);
    return `${this.formatYmd(sd!)} – ${this.formatYmd(ed!)}`;
  }

  private formatYmd(ymd: string): string {
    // Parse YYYY-MM-DD safely in local time to avoid TZ shifts
    const parts = ymd.split('-').map(n => parseInt(n, 10));
    if (parts.length === 3 && !parts.some(isNaN)) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
    }
    // Fallback to raw string
    return ymd;
  }
}