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

interface PeriodMetrics {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

interface DashboardMetrics {
  current: PeriodMetrics;
  previous: PeriodMetrics;
}

interface MetricCard {
  label: string;
  value: number;
  previousValue: number;
  type: 'income' | 'expense' | 'balance';
  icon: string;
}

@Component({
  selector: 'app-metrics-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-summary.component.html',
  styleUrl: './metrics-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsSummaryComponent {
  private http = inject(HttpClient);

  // Inputs
  readonly year  = input<number>(new Date().getFullYear());
  readonly month = input<number>(new Date().getMonth() + 1);

  // State
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly metrics = signal<DashboardMetrics | null>(null);

  readonly cards = computed(() => {
    const m = this.metrics();
    if (!m) return [];

    return [
      {
        label: 'INGRESOS (NETO)',
        value: m.current.totalIncome,
        previousValue: m.previous.totalIncome,
        type: 'income' as const,
        icon: 'arrow_upward'
      },
      {
        label: 'EGRESOS',
        value: m.current.totalExpenses,
        previousValue: m.previous.totalExpenses,
        type: 'expense' as const,
        icon: 'arrow_downward'
      },
      {
        label: 'BALANCE NETO',
        value: m.current.netBalance,
        previousValue: m.previous.netBalance,
        type: 'balance' as const,
        icon: 'account_balance_wallet'
      }
    ];
  });

  constructor() {
    effect(() => {
      this.fetchMetrics(this.year(), this.month());
    });
  }

  fetchMetrics(year: number, month: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<DashboardMetrics>(`${environment.apiUrl}/dashboard/metrics?year=${year}&month=${month}`)
      .subscribe({
        next: data => {
          this.metrics.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar las métricas.');
          this.loading.set(false);
        },
      });
  }

  getDelta(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }

  getDeltaClass(delta: number | null, type: 'income' | 'expense' | 'balance', current: number): string {
    if (delta === null) return 'delta--neutral';

    if (type === 'income') {
      return delta >= 0 ? 'delta--good' : 'delta--bad';
    } else if (type === 'expense') {
      // For expenses, higher is bad
      return delta <= 0 ? 'delta--good' : 'delta--bad';
    } else {
      // For balance, depends on the current value sign
      return current >= 0 ? 'delta--good' : 'delta--bad';
    }
  }

  getDeltaIcon(delta: number | null): string {
    if (delta === null || delta === 0) return 'trending_flat';
    return delta > 0 ? 'trending_up' : 'trending_down';
  }
}


