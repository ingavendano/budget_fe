import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService, UserProfile } from '../config/config.service';
import { NgxMaskDirective } from 'ngx-mask';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  private configService = inject(ConfigService);

  // Data signals
  profile = signal<UserProfile | null>(null);
  
  // Form signals
  name = signal<string>('');
  phoneNumber = signal<string>('');
  preferredTheme = signal<string>('LIGHT');

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.configService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.name.set(data.name || '');
        this.phoneNumber.set(data.phoneNumber || '');
        this.preferredTheme.set(data.preferredTheme || 'DEFAULT');
        this.configService.applyTheme(this.preferredTheme());
      },
      error: () => Swal.fire('Error', 'No se pudo cargar el perfil', 'error')
    });
  }

  updateProfile() {
    if (!this.profile()) return;

    const updatedProfile: UserProfile = {
      ...this.profile()!,
      name: this.name(),
      phoneNumber: this.phoneNumber(),
      preferredTheme: this.preferredTheme()
    };

    this.configService.updateProfile(updatedProfile).subscribe({
      next: (data) => {
        this.profile.set(data);
        Swal.fire({
          title: '¡Perfil Actualizado!',
          text: 'Tus datos generales han sido guardados.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: () => Swal.fire('Error', 'No se pudo actualizar el perfil', 'error')
    });
  }

  setTheme(theme: string) {
    this.preferredTheme.set(theme);
    this.configService.applyTheme(theme);
  }

  getDaysRemaining(): number {
    const expiration = this.profile()?.planExpiration;
    if (!expiration) return 0;
    
    const expDate = new Date(expiration);
    const today = new Date();
    const diff = expDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }
}
