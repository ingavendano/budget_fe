// src/app/landing/landing.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  planType: 'FREE' | 'PREMIUM' | 'PRO';
  price: number;
  durationDays: number;
  maxIncomeCategories: number | null;
  maxExpenseCategories: number | null;
  features: string[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingPageComponent implements OnInit {
  private http = inject(HttpClient);

  plans = signal<SubscriptionPlan[]>([]);
  isLoadingPlans = signal(true);

  readonly planIcons: Record<string, string> = {
    FREE: 'rocket_launch',
    PRO: 'workspace_premium',
    PREMIUM: 'diamond',
  };

  readonly planOrder: Record<string, number> = {
    FREE: 0,
    PRO: 1,
    PREMIUM: 2,
  };

  ngOnInit() {
    this.http
      .get<SubscriptionPlan[]>(`${environment.apiUrl}/auth/plans`)
      .subscribe({
        next: (data) => {
          const sorted = [...data].sort(
            (a, b) =>
              (this.planOrder[a.planType] ?? 9) - (this.planOrder[b.planType] ?? 9)
          );
          this.plans.set(sorted);
          this.isLoadingPlans.set(false);
        },
        error: () => {
          this.isLoadingPlans.set(false);
        },
      });
  }

  isPro(plan: SubscriptionPlan): boolean {
    return plan.planType === 'PRO';
  }

  formatPrice(price: number, durationDays: number): string {
    if (price === 0) return 'Gratis';
    const period = durationDays >= 365 ? '/año' : '/mes';
    return `$${price.toFixed(2)} MXN${period}`;
  }

  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
