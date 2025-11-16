import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateChild } from '@angular/router';
import { RbacAuthService } from '../services/rbac-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: RbacAuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      // Not authenticated, redirect to login
      return this.router.parseUrl('/login');
    }

    // User is authenticated
    return true;
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Reuse the same logic for child routes
    return this.canActivate(childRoute, state);
  }
}