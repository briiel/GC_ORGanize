import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RbacAuthService } from '../services/rbac-auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  
  // Role flags
  isStudent = false;
  isOrgOfficer = false;
  isAdmin = false;

  // User info
  userName = '';
  userEmail = '';
  userOrganization: any = null;

  // UI state
  isMobileMenuOpen = false;
  isUserMenuOpen = false;

  constructor(
    private authService: RbacAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  /**
   * Load user information from auth service
   */
  loadUserInfo(): void {
    this.isStudent = this.authService.isStudent();
    this.isOrgOfficer = this.authService.isOrgOfficer();
    this.isAdmin = this.authService.isAdmin();

    this.userName = this.authService.getUserFullName();
    this.userEmail = this.authService.getUserEmail() || '';
    this.userOrganization = this.authService.getUserOrganization();
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Toggle user dropdown menu
   */
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  /**
   * Close menus when clicking outside
   */
  closeMenus(): void {
    this.isMobileMenuOpen = false;
    this.isUserMenuOpen = false;
  }

  /**
   * Navigate to a route and close menus
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeMenus();
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
    this.closeMenus();
  }

  /**
   * Get current role badges
   */
  get roleBadges(): string[] {
    const badges: string[] = [];
    if (this.isAdmin) badges.push('Admin');
    if (this.isOrgOfficer) badges.push('Officer');
    if (this.isStudent) badges.push('Student');
    return badges;
  }

  /**
   * Get badge color class
   */
  getBadgeClass(role: string): string {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Officer':
        return 'bg-blue-100 text-blue-800';
      case 'Student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
