import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule, RouterPreloader, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RbacAuthService } from '../services/rbac-auth.service';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { NotificationBellComponent } from '../notifications/notification-bell.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, FormsModule, NotificationBellComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        query(':enter, :leave', [
          style({
            position: 'absolute',
            width: '100%',
            opacity: 0,
            transform: 'translateY(16px)'
          })
        ], { optional: true }),
        query(':enter', [
          animate('350ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
        ], { optional: true })
      ])
    ])
  ]
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

  private timeInterval: any;
  private readonly desktopBreakpoint = 1024; // match Tailwind's lg breakpoint

  constructor(private authService: RbacAuthService, private router: Router, private cdRef: ChangeDetectorRef) {}

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  ngOnInit(): void {
    // Get all roles from JWT token
    this.userRoles = this.authService.getUserRoles();
    
    // Build list of available panels based on user's roles
    this.buildAvailablePanels();
    
    // Detect current panel based on route
    this.detectCurrentPanel();
    
    // Subscribe to route changes to update current panel
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.detectCurrentPanel();
    });
    
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    console.log('User Roles:', this.userRoles);
    console.log('Sidebar Role:', this.role);
    console.log('Available Panels:', this.availablePanels);

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
      this.router.navigate([panel.route]);
      this.closeIfMobile();
    }
  }

  toggleUserManagement(): void {
    this.isUserManagementOpen = !this.isUserManagementOpen;
  }
}
