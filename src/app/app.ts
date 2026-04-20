import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar';
import { AuthService } from './core/auth/auth.service';
import { SeoService } from './core/seo.service';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  seoService = inject(SeoService);
  protected readonly title = signal('budget_fe');

  ngOnInit() {
    this.seoService.init();
  }

  isMainLayout(): boolean {
    return this.authService.isAuthenticated() && this.router.url !== '/welcome' && this.router.url !== '/login' && this.router.url !== '/register';
  }
}

