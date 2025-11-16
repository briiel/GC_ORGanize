import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RbacAuthService } from '../services/rbac-auth.service';
import Swal from 'sweetalert2';

interface Organization {
  org_id: number;
  org_name: string;
  department: string;
}

interface MyRequest {
  request_id: number;
  org_id: number;
  org_name: string;
  department: string;
  requested_position: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  review_notes?: string;
  reviewer_first_name?: string;
  reviewer_last_name?: string;
}

@Component({
  selector: 'app-request-role',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-role.component.html',
  styleUrls: ['./request-role.component.css']
})
export class RequestRoleComponent implements OnInit {
  private apiUrl = 'https://gcorg-apiv1-8bn5.onrender.com/api';
  // private apiUrl = 'http://localhost:5000/api';
  
  organizations: Organization[] = [];
  myRequests: MyRequest[] = [];
  userDepartment: string = '';
  
  selectedOrgId: number | null = null;
  requestedPosition: string = '';
  justification: string = '';
  
  isSubmitting = false;
  isLoading = true;
  isModalOpen = false;

  constructor(
    private http: HttpClient,
    private authService: RbacAuthService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadOrganizations();
    this.loadMyRequests();
  }

  /**
   * Load user information to get department
   */
  loadUserInfo(): void {
    this.authService.getUserDepartment((department) => {
      this.userDepartment = department;
      console.log('User department loaded:', this.userDepartment);
    });
  }

  /**
   * Get filtered organizations based on user's department
   */
  get filteredOrganizations(): Organization[] {
    if (!this.userDepartment) {
      return this.organizations;
    }
    return this.organizations.filter(org => org.department === this.userDepartment);
  }

  /**
   * Open the request modal
   */
  openRequestModal(): void {
    this.isModalOpen = true;
  }

  /**
   * Close the request modal
   */
  closeRequestModal(): void {
    this.isModalOpen = false;
  }

  /**
   * Load list of organizations
   */
  loadOrganizations(): void {
    this.http.get<any>(`${this.apiUrl}/organizations`).subscribe({
      next: (response) => {
        this.organizations = response.organizations || response || [];
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load organizations.'
        });
      }
    });
  }

  /**
   * Load user's own requests
   */
  loadMyRequests(): void {
    const headers = this.authService.getAuthHeaders();
    
    this.http.get<any>(`${this.apiUrl}/roles/my-requests`, { headers }).subscribe({
      next: (response) => {
        this.myRequests = response.requests || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load your requests.'
        });
      }
    });
  }

  /**
   * Submit role request
   */
  submitRequest(): void {
    if (!this.selectedOrgId || !this.requestedPosition.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select an organization and enter a position.'
      });
      return;
    }

    this.isSubmitting = true;
    const headers = this.authService.getAuthHeaders();
    
    const requestData = {
      org_id: this.selectedOrgId,
      requested_position: this.requestedPosition.trim(),
      justification: this.justification.trim() || null
    };

    this.http.post<any>(`${this.apiUrl}/roles/request`, requestData, { headers }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.closeRequestModal();
        
        Swal.fire({
          icon: 'success',
          title: 'Request Submitted!',
          text: response.message || 'Your role request has been submitted successfully. Please wait for admin approval.',
          confirmButtonColor: '#679436'
        });

        // Reset form
        this.selectedOrgId = null;
        this.requestedPosition = '';
        this.justification = '';

        // Reload requests
        this.loadMyRequests();
      },
      error: (error) => {
        this.isSubmitting = false;
        
        const errorMessage = error.error?.message || 'Failed to submit request. Please try again.';
        
        Swal.fire({
          icon: 'error',
          title: 'Request Failed',
          text: errorMessage
        });
      }
    });
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-50 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-300';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-300';
    }
  }

  /**
   * Get organization name by ID
   */
  getOrgName(orgId: number): string {
    const org = this.organizations.find(o => o.org_id === orgId);
    return org ? org.org_name : 'Unknown Organization';
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
