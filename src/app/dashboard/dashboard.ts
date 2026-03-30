import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfigService, DashboardStats } from '../config/config.service';
import { AlertPanelComponent } from '../features/dashboard/alert-panel/alert-panel.component';
import { CashflowChartComponent } from '../features/dashboard/cashflow-chart/cashflow-chart.component';
import { FinancialHealthComponent } from '../features/dashboard/financial-health/financial-health.component';
import { MetricsSummaryComponent } from '../features/dashboard/metrics-summary/metrics-summary.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AlertPanelComponent, CashflowChartComponent, FinancialHealthComponent, MetricsSummaryComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private configService = inject(ConfigService);
  
  selectedYear  = signal(new Date().getFullYear());
  selectedMonth = signal(new Date().getMonth() + 1);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  
  hasData = computed(() => {
    const data = this.stats();
    return !!data && data.trends && data.trends.length > 0;
  });
  
  currentMonth = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date());
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
  }
}
