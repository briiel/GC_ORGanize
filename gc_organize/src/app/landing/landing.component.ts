import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MetricsService } from '../services/metrics.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  currentYear = new Date().getFullYear();
  mobileMenuOpen = false;
  totalVisits: number | null = null;
  showBackToTop = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  constructor(private metrics: MetricsService) {}

  ngOnInit(): void {
    // Only increment once per browser (use localStorage flag)
    const flagKey = 'gc_org_visited';
    const already = localStorage.getItem(flagKey);
    if (!already) {
      this.metrics.incrementVisit().subscribe({
        next: (res) => {
          this.totalVisits = res?.total ?? null;
          localStorage.setItem(flagKey, '1');
        },
        error: () => {
          // ignore errors silently; will try get below
        }
      });
    }
    // Always try to read current total to display
    this.metrics.getVisits().subscribe({
      next: (res) => (this.totalVisits = res?.total ?? null),
      error: () => (this.totalVisits = null)
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const y = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showBackToTop = y > 240;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Manually scroll to a section id without triggering router navigation
  scrollTo(id: string, ev?: Event): void {
    if (ev) ev.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
