import {
  Component,
  OnInit,
  signal,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  SubscriptionService,
  SubscriptionPlan,
  CouponValidation,
  MyPlan,
} from '../subscription.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
})
export class SubscriptionComponent implements OnInit {
  private svc    = inject(SubscriptionService);
  private auth   = inject(AuthService);

  plans       = signal<SubscriptionPlan[]>([]);
  myPlan      = signal<MyPlan | null>(null);
  loading     = signal(true);
  submitting  = signal(false);
  successMsg  = signal<string | null>(null);
  errorMsg    = signal<string | null>(null);

  selectedPlan   = signal<SubscriptionPlan | null>(null);
  couponCode     = signal('');
  couponResult   = signal<CouponValidation | null>(null);
  validatingCoupon = signal(false);

  finalPrice = computed(() => {
    const plan   = this.selectedPlan();
    const coupon = this.couponResult();
    if (!plan) return null;
    if (coupon?.valid && coupon.finalPrice !== undefined) return coupon.finalPrice;
    return plan.price;
  });

  planOrder: Record<string, number> = { FREE: 0, PREMIUM: 1, PRO: 2 };

  sortedPlans = computed(() =>
    [...this.plans()].sort(
      (a, b) => (this.planOrder[a.planType] ?? 99) - (this.planOrder[b.planType] ?? 99)
    )
  );

  ngOnInit(): void {
    this.svc.getPlans().subscribe(p => { this.plans.set(p); this.loading.set(false); });
    this.svc.getMyPlan().subscribe(m => this.myPlan.set(m));
  }

  selectPlan(plan: SubscriptionPlan): void {
    this.selectedPlan.set(plan);
    this.couponCode.set('');
    this.couponResult.set(null);
    this.errorMsg.set(null);
    this.successMsg.set(null);
  }

  onCouponInput(): void {
    this.couponResult.set(null);
  }

  validateCoupon(): void {
    const plan = this.selectedPlan();
    const code = this.couponCode().trim();
    if (!plan || !code) return;

    this.validatingCoupon.set(true);
    this.svc.validateCoupon(code, plan.id).subscribe({
      next: r => { this.couponResult.set(r); this.validatingCoupon.set(false); },
      error: () => { this.validatingCoupon.set(false); },
    });
  }

  confirm(): void {
    const plan = this.selectedPlan();
    if (!plan) return;

    this.submitting.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const coupon = this.couponResult();
    const code = coupon?.valid ? this.couponCode().trim() : undefined;

    this.svc.subscribe(plan.id, code).subscribe({
      next: res => {
        this.submitting.set(false);
        this.successMsg.set(res.message ?? '¡Suscripción activada!');
        this.svc.getMyPlan().subscribe(m => this.myPlan.set(m));
        this.selectedPlan.set(null);
        this.couponCode.set('');
        this.couponResult.set(null);
      },
      error: err => {
        this.submitting.set(false);
        this.errorMsg.set(
          typeof err.error === 'string' ? err.error : 'Error al procesar la suscripción.'
        );
      },
    });
  }

  discountLabel(coupon: CouponValidation): string {
    if (!coupon.valid) return '';
    return coupon.discountType === 'PERCENTAGE'
      ? `-${coupon.discountValue}%`
      : `-$${coupon.discountValue?.toFixed(2)}`;
  }

  planBadge(type: string): string {
    const map: Record<string, string> = { FREE: 'badge--free', PREMIUM: 'badge--premium', PRO: 'badge--pro' };
    return map[type] ?? '';
  }

  isCurrentPlan(plan: SubscriptionPlan): boolean {
    return this.myPlan()?.planType === plan.planType;
  }

  get isAdmin(): boolean {
    return this.auth.getUserRole() === 'ADMIN';
  }
}
