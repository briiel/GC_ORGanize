import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { RbacAuthService } from '../services/rbac-auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private authService: RbacAuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // If authenticated, redirect to appropriate dashboard based on role
    if (this.authService.isAuthenticated()) {
      const defaultRoute = this.authService.getDefaultRoute();
      return this.router.parseUrl(defaultRoute);
    }
    
    // Not authenticated, allow access to login page
    return true;
  }
}
