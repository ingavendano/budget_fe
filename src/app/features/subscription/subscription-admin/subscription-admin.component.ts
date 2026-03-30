import {
  Component,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SubscriptionService,
  SubscriptionPlan,
  Coupon,
  AdminUser,
} from '../subscription.service';

type Tab = 'plans' | 'coupons' | 'users';

@Component({
  selector: 'app-subscription-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-admin.component.html',
  styleUrl: './subscription-admin.component.scss',
})
export class SubscriptionAdminComponent implements OnInit {
  private svc = inject(SubscriptionService);

  activeTab = signal<Tab>('plans');

  // Plans
  plans      = signal<SubscriptionPlan[]>([]);
  editingPlan = signal<Partial<SubscriptionPlan> | null>(null);
  isNewPlan  = signal(false);

  // Coupons
  coupons      = signal<Coupon[]>([]);
  editingCoupon = signal<Partial<Coupon> | null>(null);
  isNewCoupon  = signal(false);

  // Users
  users = signal<AdminUser[]>([]);
  editingUser = signal<AdminUser | null>(null);
  userPlanEdit = signal<{ planType: string; planExpiration: string }>({ planType: 'FREE', planExpiration: '' });

  loading = signal(false);
  toast   = signal<{ msg: string; ok: boolean } | null>(null);

  readonly planTypes     = ['FREE', 'PREMIUM', 'PRO'];
  readonly discountTypes = ['PERCENTAGE', 'FIXED'];

  /** All navigable modules in the app — corresponds to sidebar items */
  readonly APP_MODULES = [
    { key: 'Visión General',    icon: 'dashboard',          route: '/overview' },
    { key: 'Ingresos',           icon: 'payments',           route: '/income' },
    { key: 'Egresos',            icon: 'receipt_long',       route: '/expense' },
    { key: 'Presupuesto',        icon: 'assignment_add',     route: '/budget' },
    { key: 'Metas de Ahorro',    icon: 'target',             route: '/savings-goals' },
    { key: 'Control de Deudas',  icon: 'account_balance',    route: '/debts' },
    { key: 'Configuración',      icon: 'settings',           route: '/config' },
    { key: 'Mi Perfil',          icon: 'account_circle',     route: '/profile' },
    { key: 'Suscripción',        icon: 'workspace_premium',  route: '/subscription' },
  ];

  ngOnInit(): void {
    this.loadPlans();
    this.loadCoupons();
    this.loadUsers();
  }

  setTab(t: Tab): void {
    this.activeTab.set(t);
    this.editingPlan.set(null);
    this.editingCoupon.set(null);
    this.editingUser.set(null);
  }

  // ── Plans ───────────────────────────────────────────────────

  loadPlans(): void {
    this.svc.adminGetPlans().subscribe(p => this.plans.set(p));
  }

  newPlan(): void {
    this.editingPlan.set({ 
      name: '', description: '', planType: 'PREMIUM', price: 0, durationDays: 30, 
      maxIncomeCategories: null, maxExpenseCategories: null, active: true, features: [] 
    });
    this.isNewPlan.set(true);
  }

  editPlan(p: SubscriptionPlan): void {
    this.editingPlan.set({ ...p, features: [...p.features] });
    this.isNewPlan.set(false);
  }

  savePlan(): void {
    const p = this.editingPlan();
    if (!p) return;
    const obs = this.isNewPlan()
      ? this.svc.adminCreatePlan(p)
      : this.svc.adminUpdatePlan(p.id!, p);
    obs.subscribe({
      next: () => { this.showToast('Plan guardado.', true); this.editingPlan.set(null); this.loadPlans(); },
      error: () => this.showToast('Error al guardar el plan.', false),
    });
  }

  deactivatePlan(id: number): void {
    this.svc.adminDeletePlan(id).subscribe({
      next: () => { this.showToast('Plan desactivado.', true); this.loadPlans(); },
      error: () => this.showToast('Error.', false),
    });
  }

  /** Check if a module is already in the plan features list */
  isFeatureSelected(plan: Partial<SubscriptionPlan>, key: string): boolean {
    return (plan.features ?? []).includes(key);
  }

  /** Toggle a module on/off in the plan features list */
  toggleFeature(plan: Partial<SubscriptionPlan>, key: string): void {
    const current = plan.features ?? [];
    if (current.includes(key)) {
      plan.features = current.filter(f => f !== key);
    } else {
      plan.features = [...current, key];
    }
  }

  // ── Coupons ─────────────────────────────────────────────────

  loadCoupons(): void {
    this.svc.adminGetCoupons().subscribe(c => this.coupons.set(c));
  }

  newCoupon(): void {
    this.editingCoupon.set({
      code: '', description: '', discountType: 'PERCENTAGE',
      discountValue: 10, maxUses: undefined, active: true, applicablePlan: 'PREMIUM',
    });
    this.isNewCoupon.set(true);
  }

  editCoupon(c: Coupon): void {
    this.editingCoupon.set({ ...c });
    this.isNewCoupon.set(false);
  }

  saveCoupon(): void {
    const c = this.editingCoupon() as Partial<Coupon>;
    if (!c) return;
    const obs = this.isNewCoupon()
      ? this.svc.adminCreateCoupon(c)
      : this.svc.adminUpdateCoupon(c.id!, c);
    obs.subscribe({
      next: () => { this.showToast('Cupón guardado.', true); this.editingCoupon.set(null); this.loadCoupons(); },
      error: () => this.showToast('Error al guardar el cupón.', false),
    });
  }

  deactivateCoupon(id: number): void {
    this.svc.adminDeleteCoupon(id).subscribe({
      next: () => { this.showToast('Cupón desactivado.', true); this.loadCoupons(); },
      error: () => this.showToast('Error.', false),
    });
  }

  // ── Users ────────────────────────────────────────────────────

  loadUsers(): void {
    this.svc.adminGetUsers().subscribe((u: AdminUser[]) => this.users.set(u));
  }

  editUserPlan(u: AdminUser): void {
    this.editingUser.set(u);
    this.userPlanEdit.set({ planType: u.planType, planExpiration: u.planExpiration ?? '' });
  }

  saveUserPlan(): void {
    const u = this.editingUser();
    const edit = this.userPlanEdit();
    if (!u) return;
    this.svc.adminAssignPlan(u.id, edit.planType, edit.planExpiration).subscribe({
      next: () => { this.showToast('Plan actualizado.', true); this.editingUser.set(null); this.loadUsers(); },
      error: () => this.showToast('Error al actualizar el plan.', false),
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  private showToast(msg: string, ok: boolean): void {
    this.toast.set({ msg, ok });
    setTimeout(() => this.toast.set(null), 3000);
  }

  planBadge(type: string): string {
    return { FREE: 'badge--free', PREMIUM: 'badge--premium', PRO: 'badge--pro' }[type] ?? '';
  }

  discountLabel(c: Coupon): string {
    return c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${c.discountValue}`;
  }
}
