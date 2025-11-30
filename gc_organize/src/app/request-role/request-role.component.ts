import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RbacAuthService } from '../services/rbac-auth.service';
import Swal from 'sweetalert2';
import { REQUEST_POSITIONS } from '../constants/positions';
import { environment } from '../../environments/environment';
import { parseMysqlDatetimeToDate } from '../utils/date-utils';

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
  // private apiUrl = 'https://gcorg-apiv1-8bn5.onrender.com/api';
  private apiUrl = environment.apiUrl;
  
  organizations: Organization[] = [];
  myRequests: MyRequest[] = [];
  userDepartment: string = '';
  
  selectedOrgId: number | null = null;
  requestedPosition: string = '';
  otherPosition: string = '';
  positions: string[] = REQUEST_POSITIONS;
  justification: string = '';
  // UI / validation helpers
  formErrors: { [key: string]: string } = {};
  justificationMax = 300;
  @ViewChild('orgSelect') orgSelect?: ElementRef<HTMLSelectElement>;
  
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
      
    });
  }

  /**
   * Get filtered organizations based on user's department
   */
  get filteredOrganizations(): Organization[] {
    const orgs = Array.isArray(this.organizations) ? this.organizations : [];
    if (!this.userDepartment) {
      return orgs;
    }
    return orgs.filter(org => org.department === this.userDepartment);
  }

  /**
   * Open the request modal
   */
  openRequestModal(): void {
    this.isModalOpen = true;
    // focus organization select for faster keyboard flow
    setTimeout(() => {
      try {
        this.orgSelect?.nativeElement.focus();
      } catch (e) {
        // ignore
      }
    }, 50);
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
    const headers = this.authService.getAuthHeaders();
    this.http.get<any>(`${this.apiUrl}/organizations`, { headers }).subscribe({
      next: (response) => {
        // Normalize response to an array of organizations.
        // Some APIs return { organizations: [...] }, others may return the array directly,
        // or in rare cases an object map. Handle those gracefully and log unexpected shapes.
        let orgs: Organization[] = [];
        try {
          if (response) {
            if (Array.isArray(response.organizations)) {
              orgs = response.organizations;
            } else if (Array.isArray(response)) {
              orgs = response;
            } else if (response.organizations && typeof response.organizations === 'object') {
              orgs = Object.values(response.organizations) as Organization[];
            } else if (typeof response === 'object') {
              // If the API returned a plain object (e.g. id->org map), convert to array
              orgs = Object.values(response) as Organization[];
            }
          }
        } catch (e) {
          console.warn('Error normalizing organizations response', e, response);
        }

        if (!Array.isArray(orgs)) {
          console.warn('Unexpected organizations response shape, defaulting to empty array:', response);
          orgs = [];
        }

        this.organizations = orgs;
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
    // validate and show inline messages
    if (!this.validateForm()) {
      // focus first invalid field
      if (this.formErrors['organization']) {
        this.orgSelect?.nativeElement.focus();
      } else if (this.formErrors['position'] || this.formErrors['otherPosition']) {
        const el: HTMLElement | null = document.getElementById('position');
        el?.focus();
      } else if (this.formErrors['justification']) {
        const el: HTMLElement | null = document.getElementById('justification');
        el?.focus();
      }
      return;
    }

    const finalPosition = this.requestedPosition === 'Others' ? this.otherPosition : this.requestedPosition;

    this.isSubmitting = true;
    const headers = this.authService.getAuthHeaders();
    
    const requestData = {
      org_id: this.selectedOrgId,
      requested_position: finalPosition.trim(),
      justification: this.justification.trim() || null
    };

    this.http.post<any>(`${this.apiUrl}/roles/request`, requestData, { headers }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.closeRequestModal();
        
        Swal.fire({
          icon: 'success',
          title: 'Request Submitted!',
          text: (response?.message ?? response?.data?.message) || 'Your role request has been submitted successfully. Please wait for admin approval.',
          confirmButtonColor: '#679436'
        });

        // Reset form
        this.selectedOrgId = null;
        this.requestedPosition = '';
        this.otherPosition = '';
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

  isPositionValid(): boolean {
    if (this.requestedPosition === 'Others') {
      return !!this.otherPosition && !!this.otherPosition.trim();
    }
    return !!this.requestedPosition && !!this.requestedPosition.trim();
  }

  get justificationCharsLeft(): number {
    return this.justificationMax - (this.justification ? this.justification.length : 0);
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.selectedOrgId) {
      this.formErrors['organization'] = 'Please select an organization.';
    }

    if (!this.requestedPosition || !this.requestedPosition.trim()) {
      this.formErrors['position'] = 'Please select a position.';
    } else if (this.requestedPosition === 'Others') {
      if (!this.otherPosition || !this.otherPosition.trim()) {
        this.formErrors['otherPosition'] = 'Please specify your position.';
      }
    }

    if (this.justification && this.justification.length > this.justificationMax) {
      this.formErrors['justification'] = `Justification must be ${this.justificationMax} characters or fewer.`;
    }

    return Object.keys(this.formErrors).length === 0;
  }
}
