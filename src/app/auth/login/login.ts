import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  error = signal('');
  isLoading = signal(false);

  constructor() {
    // If already authenticated, go to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/overview']);
    }
  }

  handleLogin() {
    this.isLoading.set(true);
    this.error.set('');
    
    this.authService.login({ email: this.email(), password: this.password() }).subscribe({
      next: () => {
        // Redirection handled by AuthService
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Credenciales inválidas. Por favor intente de nuevo.');
      }
    });
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:8080/oauth2/authorize/google?redirect_uri=http://localhost:4200/login';
  }
}
