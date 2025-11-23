import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule, RouterPreloader, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RbacAuthService } from '../services/rbac-auth.service';
import { RouterOutlet } from '@angular/router';
import { routeAnimations } from '../route-animations';
import { NotificationBellComponent } from '../notifications/notification-bell.component';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, FormsModule, NotificationBellComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  animations: [routeAnimations]
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  isSidebarOpen = false;
  isMobile = false;
  role: string | null = null;
  userRoles: string[] = [];
  availablePanels: { role: string; label: string; route: string }[] = [];
  today = new Date();
  currentTime: string = '';
  isUserManagementOpen = false; // For OSWS admin user management dropdown
  isRequestsOpen = false; // For combined Certificate Requests + Attendance Records dropdown

  private timeInterval: any;
  private readonly desktopBreakpoint = 1024; // match Tailwind's lg breakpoint
  // Controls whether route animations should run. Disabled briefly during panel switches
  animateRoutes = true;
  // When true, the panel content will show a short fade-out (used when switching panels)
  panelFading = false;

  constructor(private authService: RbacAuthService, private router: Router, private cdRef: ChangeDetectorRef) {}

  async onLogout(): Promise<void> {
    const result = await Swal.fire({
      title: 'Confirm logout',
      text: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      // Close sidebar immediately for smoother transition
      this.isSidebarOpen = false;
      
      // Small delay to allow sidebar close animation, then logout
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }, 150);
    }
  }
  
  ngOnInit(): void {
    // Get all roles from JWT token
    this.userRoles = this.authService.getUserRoles();
    
    // Build list of available panels based on user's roles
    this.buildAvailablePanels();
    
    // Detect current panel based on route
    this.detectCurrentPanel();
    
    // Subscribe to route changes to update current panel and re-enable animations
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Re-enable route animations and remove fading state once navigation completes
      this.animateRoutes = true;
      this.panelFading = false;
      this.detectCurrentPanel();
    });
    
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    

  // Set initial sidebar state based on viewport width
  this.syncSidebarWithViewport();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  updateTime() {
    const now = new Date();
  // Always use 12-hour format
  this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  // Keep 'today' in sync so the date updates after midnight without reload
  this.today = now;
  }

  toggleSidebar() {
  this.isSidebarOpen = !this.isSidebarOpen;
  this.toggleBodyScrollLock();
  }

  closeIfMobile() {
    if (window.innerWidth < this.desktopBreakpoint) {
      this.isSidebarOpen = false;
      this.toggleBodyScrollLock();
    }
  }

  // Keep sidebar behavior responsive on resize
  @HostListener('window:resize')
  onResize() {
    this.syncSidebarWithViewport();
  }

  // Close on Esc key (handy on desktop too)
  @HostListener('window:keydown.escape')
  onEsc() {
    if (this.isSidebarOpen && window.innerWidth < this.desktopBreakpoint) {
      this.isSidebarOpen = false;
      this.toggleBodyScrollLock();
    }
  }

  private syncSidebarWithViewport() {
    const isDesktop = window.innerWidth >= this.desktopBreakpoint;
  this.isMobile = !isDesktop;
    // Open by default on desktop, closed by default on mobile
    this.isSidebarOpen = isDesktop;
  this.toggleBodyScrollLock();
  }

  prepareRoute(outlet: RouterOutlet) {
    if (!this.animateRoutes) {
      return null;
    }
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }

  private toggleBodyScrollLock() {
    const body = document.body;
    if (window.innerWidth < this.desktopBreakpoint && this.isSidebarOpen) {
      body.classList.add('sidebar-open');
    } else {
      body.classList.remove('sidebar-open');
    }
  }

  private detectCurrentPanel(): void {
    const url = this.router.url;
    if (url.includes('/student-dashboard')) {
      this.role = 'student';
    } else if (url.includes('/org-panel')) {
      this.role = 'organization';
    } else if (url.includes('/osws-admin')) {
      this.role = 'osws_admin';
    } else {
      // Fallback to primary role if route doesn't match
      const primaryRole = this.authService.getPrimaryRole();
      if (primaryRole === 'Student') {
        this.role = 'student';
      } else if (primaryRole === 'OrgOfficer') {
        this.role = 'organization';
      } else if (primaryRole === 'OSWSAdmin') {
        this.role = 'osws_admin';
      }
    }
    // Auto-open dropdowns if their child routes are active (Requests only for organization)
    this.isRequestsOpen = this.role === 'organization' && (url.includes('certificate-requests') || url.includes('attendance-records'));
    this.isUserManagementOpen = url.includes('manage-users') || url.includes('role-requests');
  }

  private buildAvailablePanels(): void {
    this.availablePanels = [];
    
    if (this.userRoles.includes('Student')) {
      this.availablePanels.push({
        role: 'student',
        label: 'Student Panel',
        route: '/student-dashboard/home'
      });
    }
    
    if (this.userRoles.includes('OrgOfficer')) {
      this.availablePanels.push({
        role: 'organization',
        label: 'Organization Panel',
        route: '/org-panel/dashboard'
      });
    }
    
    if (this.userRoles.includes('OSWSAdmin')) {
      this.availablePanels.push({
        role: 'osws_admin',
        label: 'OSWS Panel',
        route: '/osws-admin/dashboard'
      });
    }
  }

  hasMultiplePanels(): boolean {
    return this.availablePanels.length > 1;
  }

  getCurrentPanelLabel(): string {
    const panel = this.availablePanels.find(p => p.role === this.role);
    return panel ? panel.label : '';
  }

  switchPanel(targetRole: string): void {
    const panel = this.availablePanels.find(p => p.role === targetRole);
    if (panel) {
      this.role = panel.role;
      // Start cross-fade: disable route animations while we fade out the panel,
      // then navigate when fade-out completes. NavigationEnd handler will clear fading.
      this.animateRoutes = false;
      this.panelFading = true;
      const FADE_MS = 320; // must match CSS transition duration
      setTimeout(() => {
        this.router.navigate([panel.route]);
      }, FADE_MS);
      this.closeIfMobile();
    }
  }

  toggleUserManagement(): void {
    this.isUserManagementOpen = !this.isUserManagementOpen;
  }

  toggleRequests(): void {
    this.isRequestsOpen = !this.isRequestsOpen;
  }
}
