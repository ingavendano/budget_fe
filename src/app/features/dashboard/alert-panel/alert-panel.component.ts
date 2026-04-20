import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertService } from '../alert.service';
import { FinancialAlert, AlertSeverity } from '../alert.model';
import { SubscriptionService } from '../../subscription/subscription.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-alert-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-panel.component.html',
  styleUrl: './alert-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertPanelComponent implements OnInit {
  private router = inject(Router);
  public readonly alertService = inject(AlertService);
  public readonly subscriptionService = inject(SubscriptionService);

  upsellAlerts = signal<FinancialAlert[]>([]);

  readonly year  = input<number>(new Date().getFullYear());
  readonly month = input<number>(new Date().getMonth() + 1);

  ngOnInit(): void {
    this.alertService.loadAlerts(this.year(), this.month());
    this.checkUpsells();
  }

  checkUpsells(): void {
    const currentFeatures = this.subscriptionService.currentPlan()?.features || [];
    const missingSavings = !currentFeatures.includes('Metas de Ahorro');
    const missingDebts = !currentFeatures.includes('Control de Deudas');

    if (!missingSavings && !missingDebts) return;

    this.subscriptionService.getPlans().subscribe(plans => {
      const alerts: FinancialAlert[] = [];
      const now = new Date();

      if (missingSavings) {
        const validPlans = plans.filter(p => p.features?.includes('Metas de Ahorro') && p.active).map(p => p.name).join(', ');
        if (validPlans) {
          alerts.push({
            id: 'upsell-savings',
            severity: 'info',
            category: 'savings_low',
            title: 'Desbloquea Metas de Ahorro',
            description: `La función de Metas de Ahorro solo está disponible en: ${validPlans}. ¡Mejora tu plan para empezar a ahorrar!`,
            actionLabel: 'Ver Planes',
            actionRoute: '/subscription',
            generatedAt: now
          });
        }
      }

      if (missingDebts) {
        const validPlans = plans.filter(p => p.features?.includes('Control de Deudas') && p.active).map(p => p.name).join(', ');
        if (validPlans) {
          alerts.push({
            id: 'upsell-debts',
            severity: 'info',
            category: 'debt_due',
            title: 'Desbloquea Control de Deudas',
            description: `La función de Control de Deudas solo está disponible en: ${validPlans}. ¡Mejora tu plan para liquidarlas más rápido!`,
            actionLabel: 'Ver Planes',
            actionRoute: '/subscription',
            generatedAt: now
          });
        }
      }

      this.upsellAlerts.set(alerts);
    });
  }

  navigateTo(route: string | undefined): void {
    if (route) this.router.navigateByUrl(route);
  }

  severityClass(severity: AlertSeverity): string {
    return `alert--${severity}`;
  }

  trackById(_: number, alert: FinancialAlert): string {
    return alert.id;
  }
}


