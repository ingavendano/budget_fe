import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfigService, DashboardStats, EmergencyFundDTO, PeriodMetricsDTO } from '../config/config.service';
import { AlertPanelComponent } from './alert-panel/alert-panel.component';
import { CashflowChartComponent } from './cashflow-chart/cashflow-chart.component';
import { FinancialHealthComponent } from './financial-health/financial-health.component';
import { MetricsSummaryComponent } from './metrics-summary/metrics-summary.component';
import { OnboardingBanner } from '../onboarding-banner/onboarding-banner';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AlertPanelComponent, CashflowChartComponent, FinancialHealthComponent, MetricsSummaryComponent, OnboardingBanner],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private configService = inject(ConfigService);

  selectedYear = signal(new Date().getFullYear());
  selectedMonth = signal(new Date().getMonth() + 1);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  
  emergencyFund = signal<EmergencyFundDTO | null>(null);
  netWorthHistory = signal<PeriodMetricsDTO[]>([]);

  hasData = computed(() => {
    const data = this.stats();
    return !!data && data.trends && data.trends.length > 0;
  });

  currentMonth = (() => {
    const m = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date());
    return m.charAt(0).toUpperCase() + m.slice(1);
  })();
  currentYear = new Date().getFullYear();

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.configService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        this.loading.set(false);
      }
    });

    this.configService.getEmergencyFund().subscribe({
      next: (data) => this.emergencyFund.set(data),
      error: (err) => console.error('Error loading emergency fund', err)
    });

    this.configService.getHistoricalNetWorth().subscribe({
      next: (data) => this.netWorthHistory.set(data),
      error: (err) => console.error('Error loading net worth', err)
    });
  }
}



