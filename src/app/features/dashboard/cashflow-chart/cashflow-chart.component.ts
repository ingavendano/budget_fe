import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DailyPoint {
  date: string;       // 'YYYY-MM-DD'
  income: number;     // acumulado hasta ese día
  expense: number;    // acumulado hasta ese día
}

@Component({
  selector: 'app-cashflow-chart',
  standalone: true,
  templateUrl: './cashflow-chart.component.html',
  styleUrl: './cashflow-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashflowChartComponent implements AfterViewInit, OnDestroy {
  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  private http = inject(HttpClient);
  private chart: Chart | null = null;

  // Inputs
  readonly year  = input<number>(new Date().getFullYear());
  readonly month = input<number>(new Date().getMonth() + 1);

  // Estado interno (Public for debug)
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly data    = signal<DailyPoint[]>([]);

  // Labels formateados
  readonly labels = computed(() => {
    const points = this.data();
    console.log('[CashflowChart] Computing labels for', points.length, 'points');
    return points.map(d => {
      const date = new Date(d.date + 'T00:00:00');
      return date.getDate() === 1
        ? date.toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })
        : String(date.getDate());
    });
  });

  private isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  constructor() {
    console.log('[CashflowChart] Constructor');
    
    // Fetch data when year/month change
    effect(() => {
      this.fetchData(this.year(), this.month());
    });

    // Reactively initialize and update chart when canvas and data are ready
    effect(() => {
      const canvasEl = this.canvas()?.nativeElement;
      const points = this.data();
      const isLoading = this.loading();

      if (canvasEl && points.length > 0 && !isLoading) {
        console.log('[CashflowChart] Canvas and data ready. Initializing/Updating...');
        if (!this.chart) {
          this.initChart(canvasEl);
        }
        this.updateChart(points);
      }
    });
  }

  ngAfterViewInit(): void {
    console.log('[CashflowChart] ngAfterViewInit');
    (window as any).debugChartComponent = this;
  }

  ngOnDestroy(): void {
    console.log('[CashflowChart] ngOnDestroy');
    this.chart?.destroy();
  }

  public fetchData(year: number, month: number): void {
    console.log('[CashflowChart] Fetching data for', year, month);
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.loading.set(true);
    this.error.set(null);

    const url = `${environment.apiUrl}/api/dashboard/cashflow?year=${year}&month=${month}`;
    console.log('[CashflowChart] Requesting URL:', url);

    this.http.get<DailyPoint[]>(url).subscribe({
      next: points => {
        console.log('[CashflowChart] Received points:', points.length);
        this.data.set(points);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[CashflowChart] Fetch error:', err);
        this.error.set('No se pudo cargar la gráfica.');
        this.loading.set(false);
      },
    });
  }

  private initChart(canvas: HTMLCanvasElement): void {
    console.log('[CashflowChart] Initializing Chart.js instance');

    const textColor  = this.isDark ? '#9c9a92' : '#73726c';
    const gridColor  = this.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Ingresos',
            data: [],
            borderColor: '#1D9E75',
            backgroundColor: 'rgba(29,158,117,0.08)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Egresos',
            data: [],
            borderColor: '#E24B4A',
            backgroundColor: 'rgba(226,75,74,0.06)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 750 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              font: { size: 12 },
              boxWidth: 12,
              padding: 16,
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const val = ctx.parsed.y || 0;
                return ` ${ctx.dataset.label}: ${new Intl.NumberFormat('es-SV', {
                  style: 'currency',
                  currency: 'USD',
                }).format(val)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 }, maxTicksLimit: 8 },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 11 },
              callback: v => '$' + Number(v).toLocaleString('es-SV'),
            },
          },
        },
      },
    });
  }

  private updateChart(points: DailyPoint[]): void {
    if (!this.chart) {
      console.warn('[CashflowChart] Cannot update: chart is null');
      return;
    }
    
    console.log('[CashflowChart] Updating chart with', points.length, 'points');
    this.chart.data.labels        = this.labels();
    this.chart.data.datasets[0].data = points.map(p => p.income);
    this.chart.data.datasets[1].data = points.map(p => p.expense);
    this.chart.update('none'); // Update without animation for immediate feedback in debug
    console.log('[CashflowChart] Chart update signal sent');
  }
}


