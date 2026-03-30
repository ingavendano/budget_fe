import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserService } from '../admin-user.service';

@Component({
  selector: 'app-password-reset-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div class="p-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-2-4A4 4 0 1115.93 8H17a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2h1.07A4 4 0 0112 5z" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Reseteo Masivo de Contraseñas</h1>
              <p class="text-slate-500 dark:text-slate-400">Herramienta administrativa para restablecer el acceso a todos los usuarios locales.</p>
            </div>
          </div>

          <div class="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  Atención: Esta acción afectará a todos los usuarios que no usan Google OAuth. No se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nueva Contraseña</label>
              <input 
                type="text" 
                [(ngModel)]="newPassword" 
                class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                placeholder="Ingresa la nueva contraseña"
              >
            </div>

            <button 
              (click)="onReset()" 
              [disabled]="loading() || !newPassword()"
              class="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
            >
              <span *ngIf="!loading()">Ejecutar Reseteo Masivo</span>
              <span *ngIf="loading()" class="flex items-center gap-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            </button>
          </div>

          <!-- Alert Messages -->
          <div *ngIf="message()" 
            [ngClass]="{'bg-green-100 text-green-700': !error(), 'bg-red-100 text-red-700': error()}"
            class="mt-6 p-4 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <svg *ngIf="!error()" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="error()" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="font-medium">{{ message() }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PasswordResetAdminComponent {
  private adminService = inject(AdminUserService);

  newPassword = signal<string>('demo1234');
  loading = signal<boolean>(false);
  message = signal<string | null>(null);
  error = signal<boolean>(false);

  onReset() {
    if (!confirm('¿Estás seguro de que deseas resetear las contraseñas de TODOS los usuarios locales?')) {
      return;
    }

    this.loading.set(true);
    this.message.set(null);
    this.error.set(false);

    this.adminService.resetAllPasswords(this.newPassword()).subscribe({
      next: (res) => {
        this.message.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.message.set('Error al resetear las contraseñas.');
        this.error.set(true);
        this.loading.set(false);
        console.error(err);
      }
    });
  }
}
