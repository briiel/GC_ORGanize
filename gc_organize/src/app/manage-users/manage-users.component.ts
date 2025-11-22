import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';

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
        this.admins = res.data?.admins || [];
        this.organizations = res.data?.organizations || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users';
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
    const newAdmin = {
      email: this.newEmail,
      password: this.newPassword,
      name: this.newName
    };
    this.adminService.addAdmin(newAdmin).subscribe({
      next: () => {
        this.closeAddAdminModal();
        this.loadUsers();
      },
      error: () => {
        // Optionally show error message
      }
    });
  }

  deleteAdmin(id: number) {
    if (confirm('Are you sure you want to delete this admin?')) {
      this.adminService.deleteAdmin(id).subscribe({
        next: () => this.loadUsers(),
        error: () => {
          // Optionally show error message
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