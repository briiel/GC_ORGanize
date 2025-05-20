import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const token = this.authService.getToken();
    const role = this.authService.getUserRole();

    if (!token || !role) {
      // Not authenticated, redirect to login
      return this.router.parseUrl('/login');
    }

    // Optionally, check route data for allowed roles
    const allowedRoles = route.data['roles'] as string[] | undefined;
    if (allowedRoles && !allowedRoles.includes(role)) {
      // Role not allowed for this route, redirect accordingly
      if (role === 'student') {
        return this.router.parseUrl('/sidebar/home');
      } else if (role === 'organization') {
        return this.router.parseUrl('/sidebar/so-dashboard');
      } else {
        return this.router.parseUrl('/login');
      }
    }

    // Authenticated and authorized
    return true;
  }
}