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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        if (response.success) {
          this.authService.saveToken(response.token); // Save the token
          const role = this.authService.getUserRole();
          if (role) {
            localStorage.setItem('role', role); // Save the role in localStorage
            console.log('User role:', role); // Debug log
            if (role === 'Participant') {
              this.router.navigate(['/sidebar/home']); // Redirect for Participant
            } else if (role === 'StudentOrganization') {
              this.router.navigate(['/sidebar/so-dashboard']); // Redirect for StudentOrganization
            }
          }
        }
      },
      (error) => {
        this.errorMessage = 'Invalid email or password';
        console.error('Login error:', error);
      }
    );
  }
}
