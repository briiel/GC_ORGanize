import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RbacAuthService } from '../services/rbac-auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  showPassword = false;
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading = false;
  public installPrompt: any;
  capsLockOn = false;
  justLoggedOut = false;

  constructor(
    private authService: RbacAuthService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    // If already authenticated, redirect to appropriate dashboard
    if (this.authService.isAuthenticated()) {
      const defaultRoute = this.authService.getDefaultRoute();
      this.router.navigate([defaultRoute]);
      return;
    }

    // Check for logout message and set animation flag
    if (localStorage.getItem('justLoggedOut')) {
      this.justLoggedOut = true;
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Logged out successfully!',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
      localStorage.removeItem('justLoggedOut');
    }

    // Check if the app can be installed (PWA)
    window.addEventListener('beforeinstallprompt', (e: any) => {
      // Only prevent default if we're actually showing an install button
      // Otherwise, don't call preventDefault() to avoid console warnings
      this.installPrompt = e;
    });
  }

  onLogin(): void {
    this.errorMessage = '';
    this.isLoading = true;

    let username = this.email.trim();
    const password = this.password.trim();

    if (!username || !password) {
      this.isLoading = false;
      this.errorMessage = 'Please enter both your username and password.';
      return;
    }

    // If user entered full email, extract username; otherwise append domain
    let email: string;
    if (username.includes('@')) {
      // User typed full email, use as is
      email = username;
      // Validate it's a Gordon College email
      if (!email.includes('@gordoncollege.edu')) {
        this.isLoading = false;
        this.errorMessage = 'Please use your Gordon College email address.';
        return;
      }
    } else {
      // Append the domain
      email = username + '@gordoncollege.edu.ph';
    }


    this.authService.login(email, password).subscribe({
      next: (response) => {
        
        this.isLoading = false;
        
        // Support both envelope-shaped and unwrapped responses.
        const loginSucceeded = !!(
          response && (
            response.success === true ||
            response.token ||
            (response as any).user ||
            (response as any).data?.token ||
            (response as any).data?.user
          )
        );

        if (loginSucceeded) {
          // Verify token was saved
          const token = this.authService.getToken();
          const decoded = this.authService.getDecodedToken();
          
          
          // Get default route based on user's primary role
          const defaultRoute = this.authService.getDefaultRoute();
          
          
          // Show success message
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Logged in successfully!',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true
          });

          // Navigate to appropriate dashboard
          setTimeout(() => {
            this.router.navigate([defaultRoute]).then(
              (success) => {},
              (error) => console.error('Navigation error:', error)
            );
          }, 500);
        } else {
          this.errorMessage = response.message || 'Login failed.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.status === 403) {
          this.errorMessage = 'Your account has been deactivated. Please contact the administrator.';
        } else {
          this.errorMessage = error.error?.message || 'An error occurred during login. Please try again.';
        }
        
        console.error('Login error:', error);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onPasswordKeyEvent(event: KeyboardEvent) {
    try {
      if (typeof event.getModifierState === 'function') {
        this.capsLockOn = event.getModifierState('CapsLock');
      }
    } catch {
      this.capsLockOn = false;
    }
  }

  installApp() {
    if (!this.installPrompt) {
      return;
    }
    
    this.installPrompt.prompt();
    
    this.installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        
      } else {
        
      }
      this.installPrompt = null;
    });
  }
}
