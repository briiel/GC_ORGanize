import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-manage-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {
  admins: any[] = [];
  organizations: any[] = [];
  loading = true;
  error: string | null = null;

  // Modal state and form fields
  isAddAdminModalOpen = false;
  newEmail: string = '';
  newPassword: string = '';
  newName: string = '';

  constructor(private adminService: AdminService) {}

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
  }

  closeAddAdminModal() {
    this.isAddAdminModalOpen = false;
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
}