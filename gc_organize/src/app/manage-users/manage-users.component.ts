import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import Swal from 'sweetalert2';
import { normalizeSingle } from '../utils/api-utils';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit, OnDestroy {
  admins: any[] = [];
  organizations: any[] = [];
  loading = true;
  error: string | null = null;

  // Search terms
  adminSearchTerm: string = '';
  orgSearchTerm: string = '';

  // Modal state and form fields
  isAddAdminModalOpen = false;
  newEmail: string = '';
  newPassword: string = '';
  newName: string = '';

  // Loading states for actions
  isAddingAdmin = false;
  deletingAdminId: number | null = null;

  constructor(private adminService: AdminService) {}

  // Filtered admins based on search term
  get filteredAdmins() {
    if (!this.adminSearchTerm.trim()) {
      return this.admins;
    }
    const searchLower = this.adminSearchTerm.toLowerCase();
    return this.admins.filter(admin =>
      admin.name.toLowerCase().includes(searchLower) ||
      admin.email.toLowerCase().includes(searchLower)
    );
  }

  // Filtered organizations based on search term
  get filteredOrganizations() {
    if (!this.orgSearchTerm.trim()) {
      return this.organizations;
    }
    const searchLower = this.orgSearchTerm.toLowerCase();
    return this.organizations.filter(org =>
      org.name.toLowerCase().includes(searchLower) ||
      org.email.toLowerCase().includes(searchLower) ||
      org.department.toLowerCase().includes(searchLower)
    );
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getManageUsers().subscribe({
      next: (res) => {
      // Support multiple possible response shapes for resilience:
      // - { success: true, data: { admins, organizations } }
      // - { admins, organizations }
      // - { data: { admins, organizations } }
      const payload = normalizeSingle(res) || (res?.data ?? res ?? {});
        // If API returns top-level success=false, surface message
        if (res && res.success === false) {
          console.error('ManageUsers API returned failure:', res);
          this.error = res.message || 'Failed to load users';
          this.loading = false;
          return;
        }

        this.admins = payload.admins || payload.admin || [];
        this.organizations = payload.organizations || payload.orgs || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('ManageUsers load error:', err);
        // Try to show a helpful message if provided by backend
        this.error = err?.error?.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  openAddAdminModal() {
    this.isAddAdminModalOpen = true;
  // Add a global class so the sidebar can blur while modal is open
  document.body.classList.add('modal-open');
  }

  closeAddAdminModal() {
    this.isAddAdminModalOpen = false;
  document.body.classList.remove('modal-open');
  }

  addAdmin() {
    this.isAddingAdmin = true;
    const newAdmin = {
      email: this.newEmail,
      password: this.newPassword,
      name: this.newName
    };
    this.adminService.addAdmin(newAdmin).subscribe({
      next: () => {
        this.isAddingAdmin = false;
        this.closeAddAdminModal();
        this.loadUsers();
      },
      error: () => {
        this.isAddingAdmin = false;
        // Optionally show error message
      }
    });
  }

  async deleteAdmin(id: number, adminName: string) {
    const result = await Swal.fire({
      title: 'Archive Admin Account?',
      html: `Are you sure you want to archive <strong>${adminName}</strong>?<br><small class="text-gray-500">This account will be moved to the archive and can be restored within 30 days.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#14532d',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, archive it',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      this.deletingAdminId = id;
      
      Swal.fire({
        title: 'Archiving...',
        text: 'Please wait',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      this.adminService.deleteAdmin(id).subscribe({
        next: () => {
          this.deletingAdminId = null;
          Swal.fire({
            icon: 'success',
            title: 'Archived!',
            text: 'Admin account has been moved to the archive.',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadUsers();
        },
        error: (err) => {
          this.deletingAdminId = null;
          Swal.fire({
            icon: 'error',
            title: 'Archive Failed',
            text: err?.error?.message || 'Failed to archive admin account',
            confirmButtonColor: '#14532d'
          });
        }
      });
    }
  }

  ngOnDestroy(): void {
    // Safety: ensure the class is removed if component is destroyed while modal is open
    document.body.classList.remove('modal-open');
  }

  // Close modal on ESC key press for accessibility and consistency
  @HostListener('document:keydown.escape', ['$event'])
  onEsc(event: Event) {
    const ke = event as KeyboardEvent;
    if (this.isAddAdminModalOpen) {
      ke.preventDefault();
      this.closeAddAdminModal();
    }
  }
}