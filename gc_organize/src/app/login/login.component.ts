import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
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
  emailOrId: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading = false; // Add this line
  public installPrompt: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (localStorage.getItem('justLoggedOut')) {
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
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.installPrompt = e;
    });
  }

  onLogin(): void {
    this.errorMessage = '';
    this.isLoading = true; // Start loading
    // Clear all user-related keys before setting new ones
    localStorage.removeItem('studentId');
    localStorage.removeItem('creatorId');
    localStorage.removeItem('orgName');
    localStorage.removeItem('role');
    localStorage.removeItem('adminId');

    this.authService.login(this.emailOrId, this.password).subscribe(
      (response) => {
        this.isLoading = false; // Stop loading
        if (response.success) {
          this.authService.saveToken(response.token);
          const payload = JSON.parse(atob(response.token.split('.')[1]));
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Logged in successfully!',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });

          if (response.userType === 'student') {
            localStorage.setItem('studentId', payload.id);
            localStorage.setItem('role', 'student');
            // Store additional student information
            if (response.student) {
              localStorage.setItem('studentInfo', JSON.stringify({
                student_id: response.student.id,
                first_name: response.student.first_name,
                last_name: response.student.last_name,
                middle_initial: response.student.middle_initial,
                suffix: response.student.suffix,
                email: response.student.email,
                department: response.student.department,
                program: response.student.program
              }));
            }
            this.router.navigate(['/sidebar/home']);
          } else if (response.userType === 'organization') {
            localStorage.setItem('creatorId', payload.id);
            localStorage.setItem('role', 'organization');
            localStorage.setItem('orgName', response.orgName || payload.org_name || 'Student Organization');
            this.router.navigate(['/sidebar/so-dashboard']);
          } else if (response.userType === 'admin') {
            localStorage.setItem('role', 'osws_admin');
            if (response.adminId) {
              localStorage.setItem('adminId', response.adminId);
            } else if (response.id) {
              localStorage.setItem('adminId', response.id);
            } else {
              localStorage.removeItem('adminId');
            }
            this.router.navigate(['/sidebar/admin-dashboard']);
          } else {
            this.errorMessage = 'Unknown user type.';
          }
        } else {
          this.errorMessage = response.message || 'Login failed.';
        }
      },
      (error) => {
        this.isLoading = false; // Stop loading
        this.errorMessage = 'Invalid email/ID or password';
        console.error('Login error:', error);
      }
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  installApp() {
    if (!this.installPrompt) {
      return;
    }
    
    // Show the install prompt
    this.installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    this.installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the saved prompt since it can't be used again
      this.installPrompt = null;
    });
  }
}
