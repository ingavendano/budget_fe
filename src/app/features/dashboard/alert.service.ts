import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { FinancialAlert } from './alert.model';
import { SubscriptionService } from '../subscription/subscription.service';
import { environment } from '../../../environments/environment';

interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  budgetLimit: number;
  expensesByCategory: { category: string; amount: number; previousAmount: number }[];
}

interface DebtPayment {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number; // Corrected field name
  deadline: string;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private http = inject(HttpClient);
  private subscriptionService = inject(SubscriptionService);

  private readonly API = `${environment.apiUrl}/api`;
  private readonly OVERSPEND_THRESHOLD = 0.20;
  private readonly SAVINGS_RATE_TARGET  = 0.20;
  private readonly DEBT_WARNING_DAYS    = 7;

  private _alerts = signal<FinancialAlert[]>([]);
  private _loading = signal(false);
  private _error   = signal<string | null>(null);

  readonly alerts  = this._alerts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error   = this._error.asReadonly();

  readonly criticalAlerts = computed(() =>
    this._alerts().filter(a => a.severity === 'critical')
  );

  readonly alertCount = computed(() => this._alerts().length);
  readonly criticalCount = computed(() => this.criticalAlerts().length);

  loadAlerts(year: number, month: number): void {
    this._loading.set(true);
    this._error.set(null);

    forkJoin({
      summary: this.http.get<MonthlySummary>(
        `${this.API}/stats/summary?year=${year}&month=${month}`
      ),
      debts: this.http.get<DebtPayment[]>(`${this.API}/debts/upcoming`),
      goals: this.http.get<SavingsGoal[]>(`${this.API}/savings-goals`),
    })
      .pipe(map(({ summary, debts, goals }) =>
        this.buildAlerts(summary, debts, goals)
      ))
      .subscribe({
        next: alerts => {
          this._alerts.set(alerts);
          this._loading.set(false);
        },
        error: err => {
          this._error.set('No se pudieron cargar las alertas.');
          this._loading.set(false);
          console.error('[AlertService]', err);
        },
      });
  }

  private buildAlerts(
    summary: MonthlySummary,
    debts: DebtPayment[],
    goals: SavingsGoal[]
  ): FinancialAlert[] {
    const alerts: FinancialAlert[] = [];
    const now = new Date();

    if (summary.netBalance < 0) {
      alerts.push(this.make({
        id: 'negative-balance',
        severity: 'critical',
        category: 'negative_balance',
        title: 'Balance negativo proyectado',
        description: `Cerrarás el mes con ${this.fmt(summary.netBalance)}. Revisa tus egresos variables.`,
        actionLabel: 'Analizar egresos',
        actionRoute: '/expense',
      }));
    }

    for (const cat of summary.expensesByCategory) {
      if (cat.previousAmount > 0) {
        const increase = (cat.amount - cat.previousAmount) / cat.previousAmount;
        if (increase >= this.OVERSPEND_THRESHOLD) {
          alerts.push(this.make({
            id: `overspend-${cat.category}`,
            severity: increase >= 0.40 ? 'critical' : 'warning',
            category: 'overspending',
            title: `${cat.category} +${Math.round(increase * 100)}% ↗`,
            description: `Gastaste ${this.fmt(cat.amount)} vs ${this.fmt(cat.previousAmount)} el mes pasado.`,
            actionLabel: 'Ver categoría',
            actionRoute: '/expense',
            metadata: { category: cat.category, increase },
          }));
        }
      }
    }

    if (summary.budgetLimit > 0) {
      const pct = summary.totalExpenses / summary.budgetLimit;
      if (pct >= 1) {
        alerts.push(this.make({
          id: 'budget-exceeded',
          severity: 'critical',
          category: 'budget_exceeded',
          title: 'Presupuesto mensual superado',
          description: `Llevas ${this.fmt(summary.totalExpenses)} de ${this.fmt(summary.budgetLimit)} límite.`,
          actionLabel: 'Ver presupuesto',
          actionRoute: '/budget',
        }));
      } else if (pct >= 0.85) {
        alerts.push(this.make({
          id: 'budget-warning',
          severity: 'warning',
          category: 'budget_exceeded',
          title: `Presupuesto al ${Math.round(pct * 100)}%`,
          description: `Solo te quedan ${this.fmt(summary.budgetLimit - summary.totalExpenses)} disponibles.`,
          actionLabel: 'Ver presupuesto',
          actionRoute: '/budget',
        }));
      }
    }

    const currentFeatures = this.subscriptionService.currentPlan()?.features || [];
    const hasSavings = currentFeatures.includes('Metas de Ahorro');
    const hasDebts = currentFeatures.includes('Control de Deudas');

    if (hasSavings && summary.totalIncome > 0) {
      const savingsRate = summary.netBalance / summary.totalIncome;
      if (savingsRate < this.SAVINGS_RATE_TARGET && savingsRate >= 0) {
        alerts.push(this.make({
          id: 'savings-low',
          severity: 'warning',
          category: 'savings_low',
          title: `Tasa de ahorro baja (${Math.round(savingsRate * 100)}%)`,
          description: `La meta es ahorrar al menos el 20% del ingreso. Llevas ${Math.round(savingsRate * 100)}%.`,
          actionLabel: 'Ver metas',
          actionRoute: '/savings-goals',
        }));
      }
    }

    if (hasDebts) {
      const upcoming = debts.filter(d => {
        const due = new Date(d.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
        return diffDays >= 0 && diffDays <= this.DEBT_WARNING_DAYS;
      });

      if (upcoming.length > 0) {
        const names = upcoming.map(d => `${d.name}: ${this.fmt(d.amount)}`).join(', ');
        alerts.push(this.make({
          id: 'debt-due',
          severity: upcoming.length >= 2 ? 'warning' : 'info',
          category: 'debt_due',
          title: `${upcoming.length} cuota${upcoming.length > 1 ? 's' : ''} próxima${upcoming.length > 1 ? 's' : ''} a vencer`,
          description: names,
          actionLabel: 'Ver deudas',
          actionRoute: '/debts',
          metadata: { upcoming },
        }));
      }
    }

    if (hasSavings) {
      for (const g of goals.filter(g => g.currentAmount >= g.targetAmount)) {
        alerts.push(this.make({
          id: `goal-reached-${g.id}`,
          severity: 'success',
          category: 'goal_reached',
          title: `Meta "${g.name}" alcanzada`,
          description: `Completaste el 100% de tu objetivo de ${this.fmt(g.targetAmount)}.`,
          actionLabel: 'Crear nueva meta',
          actionRoute: '/savings-goals',
        }));
      }

      const atRisk = goals.filter(g => {
        const daysLeft = Math.ceil((new Date(g.deadline).getTime() - now.getTime()) / 86_400_000);
        const progress = g.currentAmount / g.targetAmount;
        return daysLeft <= 30 && daysLeft > 0 && progress < 0.8 && g.currentAmount < g.targetAmount;
      });

      for (const g of atRisk) {
        const progress = Math.round((g.currentAmount / g.targetAmount) * 100);
        alerts.push(this.make({
          id: `goal-risk-${g.id}`,
          severity: 'warning',
          category: 'goal_at_risk',
          title: `Meta "${g.name}" en riesgo`,
          description: `Solo llevas ${progress}% y el plazo vence pronto.`,
          actionLabel: 'Ver meta',
          actionRoute: '/savings-goals',
          metadata: { goalId: g.id },
        }));
      }
    }

    const order: Record<string, number> = { critical: 0, warning: 1, info: 2, success: 3 };
    return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
  }

  private make(data: Omit<FinancialAlert, 'generatedAt'>): FinancialAlert {
    return { ...data, generatedAt: new Date() };
  }

  private fmt(amount: number): string {
    return new Intl.NumberFormat('es-SV', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
