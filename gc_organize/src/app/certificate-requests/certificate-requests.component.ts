import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CertificateRequestService } from '../services/certificate-request.service';
import { FormsModule } from '@angular/forms';

interface CertificateRequest {
  id: number;
  event_id: number;
  student_id: string;
  status: 'pending' | 'processing' | 'sent' | 'approved' | 'rejected';
  requested_at: string;
  processed_at?: string;
  rejection_reason?: string;
  certificate_url?: string;
  event_title: string;
  event_location?: string;
  event_start_date: string;
  event_end_date?: string;
  first_name: string;
  middle_initial?: string;
  last_name: string;
  suffix?: string;
  student_email: string;
  department?: string;
  program?: string;
}

@Component({
  selector: 'app-certificate-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificate-requests.component.html',
  styleUrls: ['./certificate-requests.component.css']
})
export class CertificateRequestsComponent implements OnInit {
  requests: CertificateRequest[] = [];
  filteredRequests: CertificateRequest[] = [];
  pagedRequests: CertificateRequest[] = [];
  loading = true;
  error: string | null = null;
  
  updatingRequestId: number | null = null;
  
  // Bulk update
  selectedRequests: Set<number> = new Set();
  bulkStatus: 'pending' | 'processing' | 'sent' = 'processing';
  isUpdatingBulk = false;
  selectAll = false;
  
  // Filters
  statusFilter: 'all' | 'pending' | 'processing' | 'sent' | 'approved' | 'rejected' = 'all';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(private certificateRequestService: CertificateRequestService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.error = null;
    
    this.certificateRequestService.getCertificateRequests().subscribe({
      next: (response: any) => {
        this.requests = Array.isArray(response) ? response : response.data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading certificate requests:', err);
        this.error = err.error?.message || 'Failed to load certificate requests';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.requests];
    
    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }
    
    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.event_title.toLowerCase().includes(term) ||
        r.first_name.toLowerCase().includes(term) ||
        r.last_name.toLowerCase().includes(term) ||
        r.student_id.toLowerCase().includes(term) ||
        r.student_email.toLowerCase().includes(term)
      );
    }
    
    this.filteredRequests = filtered;
    this.totalPages = Math.ceil(this.filteredRequests.length / this.itemsPerPage);
    this.currentPage = 1; // Reset to first page when filters change
    this.updatePagedRequests();
  }

  updatePagedRequests(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedRequests = this.filteredRequests.slice(startIndex, endIndex);
    this.updateSelectAllState();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedRequests();
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getStudentName(request: CertificateRequest): string {
    return [
      request.first_name,
      request.middle_initial ? `${request.middle_initial}.` : '',
      request.last_name,
      request.suffix || ''
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async updateRequestStatus(request: CertificateRequest, newStatus: string): Promise<void> {
    // Only allow updating to pending, processing, or sent statuses
    if (!['pending', 'processing', 'sent'].includes(newStatus)) {
      return;
    }

    if (this.updatingRequestId === request.id) {
      return;
    }

    this.updatingRequestId = request.id;
    this.error = null;

    try {
      // Update status through API
      const response: any = await this.certificateRequestService.updateCertificateRequestStatus(
        request.id,
        newStatus
      ).toPromise();
      
      request.status = newStatus as any;
      this.applyFilters();
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to update status';
      console.error('Error updating status:', error);
      // Revert the status on error
      this.loadRequests();
    } finally {
      this.updatingRequestId = null;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-900 border-yellow-400';
      case 'processing': return 'bg-blue-100 text-blue-900 border-blue-400';
      case 'sent': return 'bg-green-100 text-green-900 border-green-400';
      case 'approved': return 'bg-green-100 text-green-900 border-green-400';
      case 'rejected': return 'bg-red-100 text-red-900 border-red-400';
      default: return 'bg-gray-100 text-gray-900 border-gray-400';
    }
  }

  getStatusSelectClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-900 border-yellow-400 focus:ring-yellow-500';
      case 'processing': return 'bg-blue-50 text-blue-900 border-blue-400 focus:ring-blue-500';
      case 'sent': return 'bg-green-50 text-green-900 border-green-400 focus:ring-green-500';
      default: return 'bg-gray-50 text-gray-900 border-gray-400 focus:ring-gray-500';
    }
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.pagedRequests.forEach(req => this.selectedRequests.add(req.id));
    } else {
      this.selectedRequests.clear();
    }
  }

  toggleSelectRequest(requestId: number): void {
    if (this.selectedRequests.has(requestId)) {
      this.selectedRequests.delete(requestId);
    } else {
      this.selectedRequests.add(requestId);
    }
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    this.selectAll = this.pagedRequests.length > 0 && 
      this.pagedRequests.every(req => this.selectedRequests.has(req.id));
  }

  isSelected(requestId: number): boolean {
    return this.selectedRequests.has(requestId);
  }

  async bulkUpdateStatus(): Promise<void> {
    if (this.selectedRequests.size === 0) {
      alert('Please select at least one request to update.');
      return;
    }

    if (!confirm(`Update ${this.selectedRequests.size} selected request(s) to "${this.bulkStatus.toUpperCase()}" status?`)) {
      return;
    }

    this.isUpdatingBulk = true;
    this.error = null;

    const updatePromises = Array.from(this.selectedRequests).map(async (requestId) => {
      const request = this.requests.find(r => r.id === requestId);
      if (request) {
        try {
          await this.certificateRequestService.updateCertificateRequestStatus(
            requestId,
            this.bulkStatus
          ).toPromise();
          request.status = this.bulkStatus as any;
        } catch (error: any) {
          console.error(`Failed to update request ${requestId}:`, error);
          throw error;
        }
      }
    });

    try {
      await Promise.all(updatePromises);
      this.selectedRequests.clear();
      this.selectAll = false;
      this.applyFilters();
      alert(`Successfully updated ${updatePromises.length} request(s) to ${this.bulkStatus.toUpperCase()}.`);
    } catch (error: any) {
      this.error = 'Some requests failed to update. Please try again.';
    } finally {
      this.isUpdatingBulk = false;
    }
  }

  getPendingCount(): number {
    return this.requests.filter(r => r.status === 'pending').length;
  }

  // Expose Math for template
  Math = Math;
}
