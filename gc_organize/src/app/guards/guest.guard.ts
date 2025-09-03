import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const token = this.auth.getToken();
    let role = this.auth.getUserRole();
    if (role === 'admin') role = 'osws_admin';

    // If authenticated, redirect to appropriate dashboard
    if (token && role) {
      if (role === 'student') {
        return this.router.parseUrl('/sidebar/home');
      }
      if (role === 'organization') {
        return this.router.parseUrl('/sidebar/so-dashboard');
      }
      if (role === 'osws_admin') {
        return this.router.parseUrl('/sidebar/admin-dashboard');
      }
      return this.router.parseUrl('/sidebar/home');
    }
    // Not authenticated, allow access
    return true;
  }
}
