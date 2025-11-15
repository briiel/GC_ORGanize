import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule, RouterPreloader } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { NotificationBellComponent } from '../notifications/notification-bell.component';

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
  today = new Date();
  currentTime: string = '';

  private timeInterval: any;
  private readonly desktopBreakpoint = 1024; // match Tailwind's lg breakpoint

  constructor(private authService: AuthService, private router: Router, private cdRef: ChangeDetectorRef) {}

  onLogout(): void {
    // Remove all user-related keys
    localStorage.removeItem('studentId');
    localStorage.removeItem('creatorId');
    localStorage.removeItem('orgName');
    localStorage.removeItem('role');
    localStorage.removeItem('adminId');
    localStorage.removeItem('studentInfo');
    localStorage.removeItem('authToken'); 
    localStorage.setItem('justLoggedOut', 'true');
    this.router.navigate(['/login']);
  }
  
  ngOnInit(): void {
    this.role = localStorage.getItem('role');
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    console.log('Role:', this.role);

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
}
