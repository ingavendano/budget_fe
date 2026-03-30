import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SubscriptionService } from '../features/subscription/subscription.service';
import { CommonModule } from '@angular/common';
import packageInfo from '../../../package.json';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  authService = inject(AuthService);
  subscriptionService = inject(SubscriptionService);
  appVersion = packageInfo.version;

  get isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  hasFeature(featureId: string): boolean {
    if (this.isAdmin) return true;
    const plan = this.subscriptionService.currentPlan();
    if (!plan) return false;
    return (plan.features || []).includes(featureId);
  }


  logout() {
    this.authService.logout();
  }
}
