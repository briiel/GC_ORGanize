import { Component, OnInit } from '@angular/core';
import { CertificateService } from '../services/certificate.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ecertificate',
  templateUrl: './ecertificate.component.html',
  styleUrls: ['./ecertificate.component.css'],
  imports: [CommonModule, FormsModule]
})
export class EcertificateComponent implements OnInit {
  certificates: any[] = [];
  loading = true;
  searchTerm: string = '';

  constructor(private certificateService: CertificateService) {}

  ngOnInit() {
    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      this.certificateService.getCertificates(studentId).subscribe({
        next: (res) => {
          this.certificates = res.data || [];
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

  downloadCertificate(certUrl: string) {
    window.open(`http://localhost:5000/${certUrl}`, '_blank');
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
}
