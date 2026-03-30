import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface FinancialHealthData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  budgetLimit: number;
  totalDebtMonthly: number;
}

interface Indicator {
  label: string;
  value: string;
  percentage: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

@Component({
  selector: 'app-financial-health',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './financial-health.component.html',
  styleUrl: './financial-health.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialHealthComponent {
  private http = inject(HttpClient);

  // Inputs
  readonly year  = input<number>(new Date().getFullYear());
  readonly month = input<number>(new Date().getMonth() + 1);

  // State
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly data    = signal<FinancialHealthData | null>(null);

  // Computed Indicators
  readonly indicators = computed<Indicator[]>(() => {
    const d = this.data();
    if (!d) return [];

    const results: Indicator[] = [];

    // 1. Tasa de ahorro (netBalance / totalIncome)
    const savingsRate = d.totalIncome > 0 ? d.netBalance / d.totalIncome : 0;
    const savingsStatus = savingsRate >= 0.20 ? 'good'
                        : savingsRate >= 0    ? 'warning'
                        : 'critical';
    results.push({
      label: 'Tasa de ahorro',
      value: (savingsRate * 100).toFixed(1) + '%',
      percentage: Math.max(0, Math.min(100, savingsRate * 100)),
      status: savingsStatus,
      description: 'Meta recomendada: 20%'
    });

    // 2. Presupuesto ejecutado (totalExpenses / budgetLimit)
    const budgetPct = d.budgetLimit > 0 ? (d.totalExpenses / d.budgetLimit) * 100 : 0;
    const budgetStatus = budgetPct >= 100 ? 'critical'
                       : budgetPct >= 85  ? 'warning'
                       : 'good';
    results.push({
      label: 'Presupuesto ejecutado',
      value: budgetPct.toFixed(1) + '%',
      percentage: Math.min(100, budgetPct),
      status: budgetStatus,
      description: d.budgetLimit > 0 ? `Límite: $${d.budgetLimit.toLocaleString()}` : 'Sin presupuesto'
    });

    // 3. Carga de deuda (totalDebtMonthly / totalIncome)
    const debtRatio = d.totalIncome > 0 ? (d.totalDebtMonthly / d.totalIncome) * 100 : 0;
    const debtStatus = debtRatio >= 50 ? 'critical'
                     : debtRatio >= 30 ? 'warning'
                     : 'good';
    results.push({
      label: 'Carga de deuda',
      value: debtRatio.toFixed(1) + '%',
      percentage: Math.min(100, debtRatio),
      status: debtStatus,
      description: 'Meta recomendada: < 30%'
    });

    return results;
  });

  readonly globalScore = computed(() => {
    const inds = this.indicators();
    if (inds.length === 0) return 0;
    
    let score = 0;
    inds.forEach(i => {
      if (i.status === 'good') score += 33.3;
      else if (i.status === 'warning') score += 16.6;
    });
    return Math.round(score);
  });

  readonly healthLabel = computed(() => {
    const score = this.globalScore();
    if (score >= 80) return { text: 'Saludable', class: 'good' };
    if (score >= 50) return { text: 'Aceptable', class: 'warning' };
    if (score >= 20) return { text: 'En riesgo', class: 'critical' };
    return { text: 'Crítico', class: 'critical' };
  });

  constructor() {
    effect(() => {
      this.fetchData(this.year(), this.month());
    });
  }

  public fetchData(year: number, month: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<FinancialHealthData>(`${environment.apiUrl}/api/dashboard/health?year=${year}&month=${month}`)
      .subscribe({
        next: d => {
          this.data.set(d);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Error al cargar salud financiera.');
          this.loading.set(false);
        },
      });
  }
}
