import { Component, OnInit } from '@angular/core';
import { CertificateService } from '../services/certificate.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

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
  downloadingCertIds: Set<number> = new Set(); 

  constructor(
    private certificateService: CertificateService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      this.certificateService.getCertificates(studentId).subscribe({
        next: (res) => {
          // Filter to only show OSWS events (where is_osws_event is true)
          this.certificates = (res.data || []).filter((cert: any) => cert.is_osws_event === true);
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
    this.router.navigate(['/sidebar/evaluation', eventId], {
      queryParams: { title: eventTitle }
    });
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
    if (!this.searchTerm) {
      return this.certificates;
    }
    return this.certificates.filter(cert =>
      cert.event_title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onSearch() {
    // Optionally trigger filtering logic or just rely on ngModel binding
  }

  clearSearch() {
    this.searchTerm = '';
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
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    // Fallback to raw string
    return ymd;
  }
}