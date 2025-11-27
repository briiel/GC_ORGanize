import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RbacAuthService } from '../services/rbac-auth.service';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment';
import { parseMysqlDatetimeToDate } from '../utils/date-utils';

interface RoleRequest {
  request_id: number;
  user_id: number;
  org_id: number;
  requested_position: string;
  justification?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  review_notes?: string;
  email: string;
  first_name: string;
  last_name: string;
  student_id: string;
  org_name: string;
  department: string;
  reviewer_first_name?: string;
  reviewer_last_name?: string;
}

@Component({
  selector: 'app-request-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-queue.component.html',
  styleUrls: ['./request-queue.component.css']
})
export class RequestQueueComponent implements OnInit {
  // private apiUrl = 'https://gcorg-apiv1-8bn5.onrender.com/api';
  private apiUrl = environment.apiUrl;
  
  pendingRequests: RoleRequest[] = [];
  allRequests: RoleRequest[] = [];
  
  selectedTab: 'pending' | 'all' = 'pending';
  filterStatus: string = 'all';
  
  isLoading = true;
  processingRequestId: number | null = null;

  constructor(
    private http: HttpClient,
    private authService: RbacAuthService
  ) {}

  ngOnInit(): void {
    this.loadPendingRequests();
  }

  /**
   * Load pending requests
   */
  loadPendingRequests(): void {
    this.isLoading = true;
    const headers = this.authService.getAuthHeaders();

    this.http.get<any>(`${this.apiUrl}/admin/requests/pending`, { headers }).subscribe({
      next: (response) => {
        this.pendingRequests = response.requests || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending requests:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load pending requests.'
        });
      }
    });
  }

  /**
   * Load all requests
   */
  loadAllRequests(): void {
    this.isLoading = true;
    const headers = this.authService.getAuthHeaders();

    this.http.get<any>(`${this.apiUrl}/admin/requests`, { headers }).subscribe({
      next: (response) => {
        this.allRequests = response.requests || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading all requests:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load requests.'
        });
      }
    });
  }

  /**
   * Switch tabs
   */
  switchTab(tab: 'pending' | 'all'): void {
    this.selectedTab = tab;
    if (tab === 'pending') {
      this.loadPendingRequests();
    } else {
      this.loadAllRequests();
    }
  }

  /**
   * Approve a request
   */
  async approveRequest(request: RoleRequest): Promise<void> {
    const result = await Swal.fire({
      title: 'Approve Request?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Student:</strong> ${request.first_name} ${request.last_name} (${request.student_id})</p>
          <p class="mb-2"><strong>Organization:</strong> ${request.org_name}</p>
          <p class="mb-4"><strong>Position:</strong> ${request.requested_position}</p>
          <label for="review-notes" class="block text-sm font-medium text-gray-700 mb-2">Review Notes (Optional)</label>
          <textarea id="review-notes" class="swal2-input w-full" rows="3" placeholder="Add any notes about this approval..."></textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      confirmButtonColor: '#679436',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const notes = (document.getElementById('review-notes') as HTMLTextAreaElement)?.value;
        return { notes };
      }
    });

    if (result.isConfirmed) {
      this.processingRequestId = request.request_id;
      const headers = this.authService.getAuthHeaders();

      this.http.post<any>(
        `${this.apiUrl}/admin/approve/${request.request_id}`,
        { review_notes: result.value?.notes || null },
        { headers }
      ).subscribe({
        next: (response) => {
          this.processingRequestId = null;
          
          Swal.fire({
            icon: 'success',
            title: 'Request Approved!',
            text: `${request.first_name} ${request.last_name} is now an officer of ${request.org_name}.`,
            confirmButtonColor: '#679436'
          });

          // Reload requests
          if (this.selectedTab === 'pending') {
            this.loadPendingRequests();
          } else {
            this.loadAllRequests();
          }
        },
        error: (error) => {
          this.processingRequestId = null;
          
          Swal.fire({
            icon: 'error',
            title: 'Approval Failed',
            text: error.error?.message || 'Failed to approve request. Please try again.'
          });
        }
      });
    }
  }

  /**
   * Decline a request (UI label only)
   */
  async rejectRequest(request: RoleRequest): Promise<void> {
    const result = await Swal.fire({
      title: 'Decline Request?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Student:</strong> ${request.first_name} ${request.last_name} (${request.student_id})</p>
          <p class="mb-2"><strong>Organization:</strong> ${request.org_name}</p>
          <p class="mb-4"><strong>Position:</strong> ${request.requested_position}</p>
          <label for="rejection-reason" class="block text-sm font-medium text-gray-700 mb-2">Reason for Decline (Optional)</label>
          <textarea id="rejection-reason" class="swal2-input w-full" rows="3" placeholder="Explain why this request is being declined..."></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Decline',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const notes = (document.getElementById('rejection-reason') as HTMLTextAreaElement)?.value;
        return { notes };
      }
    });

    if (result.isConfirmed) {
      this.processingRequestId = request.request_id;
      const headers = this.authService.getAuthHeaders();

      this.http.post<any>(
        `${this.apiUrl}/admin/reject/${request.request_id}`,
        { review_notes: result.value?.notes || null },
        { headers }
      ).subscribe({
        next: (response) => {
          this.processingRequestId = null;
          
          Swal.fire({
            icon: 'success',
            title: 'Request Declined',
            text: 'The role request has been declined.',
            confirmButtonColor: '#679436'
          });

          // Reload requests
          if (this.selectedTab === 'pending') {
            this.loadPendingRequests();
          } else {
            this.loadAllRequests();
          }
        },
        error: (error) => {
          this.processingRequestId = null;
          
          Swal.fire({
            icon: 'error',
            title: 'Decline Failed',
            text: error.error?.message || 'Failed to decline request. Please try again.'
          });
        }
      });
    }
  }

  /**
   * Get filtered requests for "All" tab
   */
  get filteredRequests(): RoleRequest[] {
    if (this.filterStatus === 'all') {
      return this.allRequests;
    }
    return this.allRequests.filter(req => req.status === this.filterStatus);
  }

  /**
   * Return a user-facing label for status values.
   * Keeps backend status values unchanged; maps 'rejected' -> 'Declined'.
   */
  getStatusLabel(status: string): string {
    if (!status) return '';
    if (String(status).toLowerCase() === 'rejected') return 'Declined';
    return String(status).replace(/(^|\s)\S/g, t => t.toUpperCase());
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const d = parseMysqlDatetimeToDate(dateString);
    if (!d) return '';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
