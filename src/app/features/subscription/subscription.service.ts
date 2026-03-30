import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  planType: 'FREE' | 'PREMIUM' | 'PRO';
  price: number;
  durationDays: number;
  maxIncomeCategories: number | null;
  maxExpenseCategories: number | null;
  active: boolean;
  features: string[];
}

export interface Coupon {
  id?: number;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string;
  active: boolean;
  applicablePlan: 'FREE' | 'PREMIUM' | 'PRO';
}

export interface CouponValidation {
  valid: boolean;
  message: string;
  code?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  finalPrice?: number;
  applicablePlan?: string;
  expiresAt?: string;
}

export interface MyPlan {
  planType: 'FREE' | 'PREMIUM' | 'PRO' | null;
  planExpiration: string | null;
  features?: string[];
  maxIncomeCategories?: number | null;
  maxExpenseCategories?: number | null;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  planType: 'FREE' | 'PREMIUM' | 'PRO';
  planExpiration: string | null;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/api/subscriptions`;
  private readonly ADMIN = `${environment.apiUrl}/api/admin/subscriptions`;

  currentPlan = signal<MyPlan | null>(null);

  // ── User endpoints ───────────────────────────────────────────

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.BASE}/plans`);
  }

  /** Load plan from backend and update signal */
  loadMyPlan(): Observable<MyPlan> {
    return this.http.get<MyPlan>(`${this.BASE}/my-plan`).pipe(
      tap(plan => this.currentPlan.set(plan))
    );
  }

  /** For backwards compatibility and direct fetches */
  getMyPlan(): Observable<MyPlan> {
    return this.http.get<MyPlan>(`${this.BASE}/my-plan`);
  }

  validateCoupon(code: string, planId: number): Observable<CouponValidation> {
    return this.http.get<CouponValidation>(
      `${this.BASE}/validate-coupon?code=${encodeURIComponent(code)}&planId=${planId}`
    );
  }

  subscribe(planId: number, couponCode?: string): Observable<any> {
    return this.http.post<any>(`${this.BASE}/subscribe`, { planId, couponCode: couponCode ?? null }).pipe(
      tap(response => {
        // Optimistically reload the plan after subscription
        this.loadMyPlan().subscribe();
      })
    );
  }

  // ── Admin: Plans ─────────────────────────────────────────────

  adminGetPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.ADMIN}/plans`);
  }

  adminCreatePlan(plan: Partial<SubscriptionPlan>): Observable<SubscriptionPlan> {
    return this.http.post<SubscriptionPlan>(`${this.ADMIN}/plans`, plan);
  }

  adminUpdatePlan(id: number, plan: Partial<SubscriptionPlan>): Observable<SubscriptionPlan> {
    return this.http.put<SubscriptionPlan>(`${this.ADMIN}/plans/${id}`, plan);
  }

  adminDeletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ADMIN}/plans/${id}`);
  }

  // ── Admin: Coupons ───────────────────────────────────────────

  adminGetCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(`${this.ADMIN}/coupons`);
  }

  adminCreateCoupon(coupon: Partial<Coupon>): Observable<Coupon> {
    return this.http.post<Coupon>(`${this.ADMIN}/coupons`, coupon);
  }

  adminUpdateCoupon(id: number, coupon: Partial<Coupon>): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.ADMIN}/coupons/${id}`, coupon);
  }

  adminDeleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ADMIN}/coupons/${id}`);
  }

  // ── Admin: Users ─────────────────────────────────────────────

  adminGetUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.ADMIN}/users`);
  }

  adminAssignPlan(userId: number, planType: string, planExpiration?: string): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.ADMIN}/users/${userId}/plan`, {
      planType,
      planExpiration: planExpiration ?? ''
    });
  }
}
