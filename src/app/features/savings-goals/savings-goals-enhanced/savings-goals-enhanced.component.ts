import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Router, RouterModule } from '@angular/router';

interface SavingsGoal {
  id: number;
  publicId: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  monthlyContribution: number;
}

type GoalStatus = 'completed' | 'overdue' | 'at-risk' | 'on-track';

@Component({
  selector: 'app-savings-goals-enhanced',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './savings-goals-enhanced.component.html',
  styleUrl: './savings-goals-enhanced.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsGoalsEnhancedComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  // State
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly goals   = signal<SavingsGoal[]>([]);
  readonly selectedGoalId = signal<number | null>(null);

  // Computed data for each goal
  readonly processedGoals = computed(() => {
    const today = new Date();
    
    return this.goals().map(g => {
      const deadlineDate = new Date(g.deadline);
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const monthsLeft = Math.max(0.1, diffDays / 30.44);

      const progressPercent = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      
      const requiredMonthly = remainingAmount / monthsLeft;
      
      // Proyección basada en aporte histórico
      const monthsToComplete = g.monthlyContribution > 0 ? remainingAmount / g.monthlyContribution : Infinity;
      const projectedDate = new Date(today.getTime() + monthsToComplete * 30.44 * 24 * 60 * 60 * 1000);
      
      const monthsBehind = g.monthlyContribution > 0 ? (projectedDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44) : 0;

      // Determinación de status
      let status: GoalStatus = 'on-track';
      if (g.currentAmount >= g.targetAmount) status = 'completed';
      else if (diffDays < 0) status = 'overdue';
      else if (g.monthlyContribution < requiredMonthly * 0.8 || projectedDate > deadlineDate) status = 'at-risk';

      return {
        ...g,
        deadlineDate,
        diffDays,
        monthsLeft,
        progressPercent,
        remainingAmount,
        requiredMonthly,
        projectedDate: monthsToComplete === Infinity ? null : projectedDate,
        monthsBehind: Math.max(0, monthsBehind),
        status
      };
    });
  });

  readonly selectedGoal = computed(() => {
    const id = this.selectedGoalId();
    if (id === null) return this.processedGoals()[0] || null;
    return this.processedGoals().find(g => g.id === id) || null;
  });

  constructor() {
    this.fetchGoals();
  }

  fetchGoals(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<SavingsGoal[]>(`${environment.apiUrl}/api/savings-goals`).subscribe({
      next: data => {
        this.goals.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las metas de ahorro.');
        this.loading.set(false);
      }
    });
  }

  selectGoal(id: number): void {
    this.selectedGoalId.set(id);
  }

  navigate(route: string): void {
    this.router.navigateByUrl(route);
  }
}
