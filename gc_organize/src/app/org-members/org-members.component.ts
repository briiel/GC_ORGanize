import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RbacAuthService } from '../services/rbac-auth.service';
import { ExcelExportService } from '../services/excel-export.service';
import { environment } from '../../environments/environment';
import { parseMysqlDatetimeToDate } from '../utils/date-utils';

interface OrganizationMember {
  member_id: number;
  student_id: string;
  position: string;
  joined_at: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  middle_initial: string;
  suffix: string;
  email: string;
  department: string;
  program: string;
}

@Component({
  selector: 'app-org-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './org-members.component.html',
  styleUrls: ['./org-members.component.css']
})
export class OrgMembersComponent implements OnInit {
  members: OrganizationMember[] = [];
  filteredMembers: OrganizationMember[] = [];
  loading: boolean = false;
  error: string | null = null;
  orgName: string = '';
  
  // Search and filter
  searchTerm: string = '';
  filterPosition: string = '';
  sortBy: string = 'name_asc';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Make Math available in template
  Math = Math;

  constructor(
    private http: HttpClient,
    private authService: RbacAuthService,
    private excelExportService: ExcelExportService
  ) {}

  ngOnInit(): void {
    const org = this.authService.getUserOrganization();
    if (org) {
      this.orgName = org.org_name;
      this.loadMembers(org.org_id);
    } else {
      this.error = 'Organization information not found';
    }
  }

  private async getSwal(): Promise<any> {
    const mod = await import('sweetalert2');
    return (mod as any).default || mod;
  }

  loadMembers(orgId: number): void {
    this.loading = true;
    this.error = null;

    const headers = this.getAuthHeaders();
    this.http.get<any>(`${environment.apiUrl}/users/organization/${orgId}/members`, { headers }).subscribe({
      next: (response) => {
        // Normalize response: interceptor may unwrap envelopes to data,
        // or backend may return { success: true, data: [...] }.
        let members: OrganizationMember[] = [];
        try {
          if (Array.isArray(response)) {
            members = response as OrganizationMember[];
          } else if (Array.isArray((response as any).data)) {
            members = (response as any).data;
          } else if ((response as any).members && Array.isArray((response as any).members)) {
            members = (response as any).members;
          } else if (response && typeof response === 'object') {
            // If response is an object map, convert to array
            members = Object.values(response) as OrganizationMember[];
          }
        } catch (e) {
          console.warn('Error normalizing members response', e, response);
        }

        if (!Array.isArray(members)) members = [];

        this.members = members;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.error = 'Failed to load organization members';
        this.loading = false;
        (async () => {
          const Swal = await this.getSwal();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load organization members'
          });
        })();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.members];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(member => 
        member.first_name.toLowerCase().includes(term) ||
        member.last_name.toLowerCase().includes(term) ||
        member.student_id.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term) ||
        member.position.toLowerCase().includes(term)
      );
    }

    // Position filter
    if (this.filterPosition) {
      filtered = filtered.filter(member => 
        member.position.toLowerCase() === this.filterPosition.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name_asc':
          const fullNameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const fullNameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          return fullNameA.localeCompare(fullNameB);
        case 'name_desc':
          const fullNameA2 = `${a.first_name} ${a.last_name}`.toLowerCase();
          const fullNameB2 = `${b.first_name} ${b.last_name}`.toLowerCase();
          return fullNameB2.localeCompare(fullNameA2);
        case 'position_asc':
          return a.position.toLowerCase().localeCompare(b.position.toLowerCase());
        case 'date_desc':
          return new Date(b.joined_at || 0).getTime() - new Date(a.joined_at || 0).getTime();
        default:
          return 0;
      }
    });

    this.filteredMembers = filtered;
    this.totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  get paginatedMembers(): OrganizationMember[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredMembers.slice(startIndex, endIndex);
  }

  get uniquePositions(): string[] {
    return [...new Set(this.members.map(m => m.position))].sort();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterPosition = '';
    this.applyFilters();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getFullName(member: OrganizationMember): string {
    let name = `${member.first_name}`;
    if (member.middle_initial) {
      name += ` ${member.middle_initial}.`;
    }
    name += ` ${member.last_name}`;
    if (member.suffix) {
      name += ` ${member.suffix}`;
    }
    return name;
  }

  formatDate(dateString: string): string {
    const d = parseMysqlDatetimeToDate(dateString);
    if (!d) return '';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getPositionBadgeClass(position: string): string {
    const pos = position.toLowerCase();
    if (pos.includes('president')) return 'bg-purple-100 text-purple-800';
    if (pos.includes('vice')) return 'bg-blue-100 text-blue-800';
    if (pos.includes('secretary')) return 'bg-green-100 text-green-800';
    if (pos.includes('treasurer')) return 'bg-yellow-100 text-yellow-800';
    if (pos.includes('auditor')) return 'bg-orange-100 text-orange-800';
    if (pos.includes('member')) return 'bg-gray-100 text-gray-800';
    return 'bg-indigo-100 text-indigo-800';
  }

  async downloadExcel(): Promise<void> {
    if (!this.filteredMembers || this.filteredMembers.length === 0) return;

    const headers = ['#', 'Student ID', 'Name', 'Email', 'Position', 'Department', 'Program', 'Joined Date'];
    
    const data = this.filteredMembers.map((member, i) => [
      i + 1,
      member.student_id ?? '-',
      this.getFullName(member),
      member.email ?? '-',
      member.position ?? '-',
      member.department ?? '-',
      member.program ?? '-',
      this.formatDate(member.joined_at) || '-'
    ]);

    const slug = this.orgName.trim().replace(/\s+/g, '_').toLowerCase();
    const filename = `${slug}_members.xlsx`;

    await this.excelExportService.createAndExportExcel('Organization Members', headers, data, filename);
  }

  async removeMember(member: OrganizationMember): Promise<void> {
    const Swal = await this.getSwal();
    const result = await Swal.fire({
      title: 'Remove Member?',
      html: `Are you sure you want to remove <strong>${this.getFullName(member)}</strong> from the organization?<br><small class="text-gray-500">This action will deactivate their membership.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove member',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      const org = this.authService.getUserOrganization();
      if (!org) return;

      const headers = this.getAuthHeaders();
      this.http.delete(
        `${environment.apiUrl}/users/organization/${org.org_id}/members/${member.member_id}`,
        { headers }
      ).subscribe({
        next: async () => {
          const Swal2 = await this.getSwal();
          Swal2.fire({
            icon: 'success',
            title: 'Member Removed',
            text: `${this.getFullName(member)} has been removed from the organization.`,
            timer: 2000,
            showConfirmButton: false
          });
          // Reload members list
          this.loadMembers(org.org_id);
        },
        error: async (error) => {
          console.error('Error removing member:', error);
          const Swal2 = await this.getSwal();
          Swal2.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to remove member. Please try again.'
          });
        }
      });
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('gc_organize_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
}
