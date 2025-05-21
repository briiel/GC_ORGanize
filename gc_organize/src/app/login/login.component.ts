import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  showPassword = false;
  emailOrId: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    this.errorMessage = '';
    this.authService.login(this.emailOrId, this.password).subscribe(
      (response) => {
        if (response.success) {
          this.authService.saveToken(response.token);
          const payload = JSON.parse(atob(response.token.split('.')[1]));
          if (response.userType === 'student') {
            localStorage.setItem('studentId', payload.id);
            localStorage.setItem('role', 'student');
            this.router.navigate(['/sidebar/home']);
          } else if (response.userType === 'organization') {
            localStorage.setItem('creatorId', payload.id);
            localStorage.setItem('role', 'organization');
            this.router.navigate(['/sidebar/so-dashboard']);
          } else {
            this.errorMessage = 'Unknown user type.';
          }
        } else {
          this.errorMessage = response.message || 'Login failed.';
        }
      },
      (error) => {
        this.errorMessage = 'Invalid email/ID or password';
        console.error('Login error:', error);
      }
    );
  }
}
