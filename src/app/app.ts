import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  authService = inject(AuthService);
  router = inject(Router);
  protected readonly title = signal('budget_fe');

  isMainLayout(): boolean {
    return this.authService.isAuthenticated() && this.router.url !== '/welcome' && this.router.url !== '/login';
  }
}
