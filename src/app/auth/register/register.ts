import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { NgxMaskDirective } from 'ngx-mask';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxMaskDirective],
  templateUrl: './register.html',
  styleUrl: '../login/login.css' // Reusing login styles for consistency
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = signal('');
  email = signal('');
  phoneNumber = signal('');
  password = signal('');
  error = signal('');
  isLoading = signal(false);

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/overview']);
    }
  }

  handleRegister() {
    if (!this.name() || !this.email() || !this.password()) {
      this.error.set('Todos los campos son requeridos');
      return;
    }
    
    if (this.password().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    
    const userData = {
      name: this.name(),
      email: this.email(),
      phoneNumber: this.phoneNumber(),
      password: this.password()
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.isLoading.set(false);
        Swal.fire({
          title: '¡Registro Exitoso!',
          text: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
          icon: 'success',
          confirmButtonColor: '#004b50'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error || 'Ocurrió un error al registrar el usuario.');
      }
    });
  }
}
