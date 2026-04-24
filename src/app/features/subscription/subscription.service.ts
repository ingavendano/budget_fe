import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

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
  remainingDays?: number | null;
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
  private authService = inject(AuthService);
  private readonly BASE = `${environment.apiUrl}/subscriptions`;
  private readonly ADMIN = `${environment.apiUrl}/admin/subscriptions`;
  
  currentPlan = computed<MyPlan | null>(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    return {
      planType: user.planType as any,
      planExpiration: user.planExpiration?.toString() || null,
      remainingDays: user.remainingDays,
      features: user.features || [],
    };
  });

  // ── User endpoints ───────────────────────────────────────────

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.BASE}/plans`);
  }

  /** Load plan from backend via auth profile */
  loadMyPlan(): Observable<MyPlan> {
    return this.authService.fetchProfile().pipe(
      map(user => ({
        planType: user.planType as any,
        planExpiration: user.planExpiration?.toString() || null,
        remainingDays: user.remainingDays
      }))
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



