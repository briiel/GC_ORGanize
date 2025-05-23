import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { Router, RouterModule, RouterPreloader } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate, query } from '@angular/animations';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
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
export class SidebarComponent implements OnInit, AfterViewInit {
  isSidebarOpen = false;
  role: string | null = null;

  constructor(private authService: AuthService, private router: Router, private cdRef: ChangeDetectorRef) {}

  onLogout(): void {
    this.authService.logout();
    const role = localStorage.getItem('role');
    localStorage.setItem('justLoggedOut', 'true');
    // Always redirect to /login after logout, regardless of role
    this.router.navigate(['/login']);
  }
  
  ngOnInit(): void {
    this.role = localStorage.getItem('role');
    console.log('Role:', this.role);
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
