import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.errorMessage = '';
    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        if (response.success && response.userType === 'admin') {
          this.authService.saveToken(response.token);
          localStorage.setItem('role', 'osws_admin'); // Use a unique role
          this.router.navigate(['/sidebar/admin-dashboard']);
        } else {
          this.errorMessage = 'You are not authorized as an OSWS Admin.';
        }
      },
      (error) => {
        this.errorMessage = 'Invalid email or password';
      }
    );
  }
}
