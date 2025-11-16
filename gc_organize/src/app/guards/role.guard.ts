/**
 * Role Guard
 * Protects routes based on user roles
 */

import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router,
  UrlTree 
} from '@angular/router';
import { Observable } from 'rxjs';
import { RbacAuthService } from '../services/rbac-auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: RbacAuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.warn('User not authenticated. Redirecting to login.');
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Get expected role(s) from route data
    const expectedRole = route.data['expectedRole'];
    
    // If no specific role is required, just check authentication
    if (!expectedRole) {
      return true;
    }

    // Support both single role (string) or multiple roles (array)
    const expectedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];

    // Check if user has any of the required roles
    const hasRequiredRole = this.authService.hasAnyRole(expectedRoles);

    if (hasRequiredRole) {
      return true;
    }

    // User doesn't have required role
    console.warn(
      `Access denied. Required role(s): ${expectedRoles.join(', ')}. ` +
      `User roles: ${this.authService.getUserRoles().join(', ')}`
    );

    // Redirect to appropriate dashboard based on user's actual roles
    const defaultRoute = this.authService.getDefaultRoute();
    return this.router.createUrlTree([defaultRoute]);
  }
}
