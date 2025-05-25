import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, RouterPreloader } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate, query } from '@angular/animations';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, FormsModule],
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
  role: string | null = null;
  today = new Date();
  currentTime: string = '';

  private timeInterval: any;

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
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }
}
