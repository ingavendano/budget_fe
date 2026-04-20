import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfigService, SavingsGoal } from '../../../features/config/config.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-savings-goal-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './savings-goal-form.component.html',
  styleUrl: './savings-goal-form.component.scss'
})
export class SavingsGoalFormComponent implements OnInit {
  private configService = inject(ConfigService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = signal(false);
  loading = signal(false);
  
  // Form signals
  publicId = signal<string | null>(null);
  selectedIcon = signal<string>('🐷');
  name = signal<string>('');
  description = signal<string>('');
  targetAmount = signal<number>(0);
  deadline = signal<string>('');
  monthlyContribution = signal<number>(0);
  contributionDay = signal<number>(1);

  icons = ['🖼️', '🚗', '🏠', '🎓', '💍', '🌍', '💻', '🛡️', '🐷', '🎯', '✈️', '📱', '🎁', '🏗️', '🎸'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.publicId.set(id);
      this.loadGoal(id);
    }
  }

  loadGoal(id: string) {
    this.loading.set(true);
    this.configService.getSavingsGoal(id).subscribe({
      next: goal => {
        this.name.set(goal.name);
        this.description.set(goal.description || '');
        this.targetAmount.set(goal.targetAmount);
        this.deadline.set(goal.deadline || '');
        this.selectedIcon.set(goal.icon);
        this.monthlyContribution.set(goal.monthlyContribution || 0);
        this.contributionDay.set(goal.contributionDay || 1);
        this.loading.set(false);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar la meta', 'error');
        this.router.navigate(['/savings-goals']);
      }
    });
  }

  save() {
    if (!this.name() || this.targetAmount() <= 0) {
      Swal.fire('Atención', 'Nombre y monto meta son obligatorios', 'warning');
      return;
    }

    const goal: SavingsGoal = {
      publicId: this.publicId() || undefined,
      name: this.name(),
      description: this.description(),
      targetAmount: this.targetAmount(),
      currentAmount: 0, // Backend ignores this on update
      deadline: this.deadline() || undefined,
      icon: this.selectedIcon(),
      monthlyContribution: this.monthlyContribution(),
      contributionDay: this.contributionDay()
    };

    const request = this.isEdit() 
      ? this.configService.saveSavingsGoal(goal) // Currently saveSavingsGoal handles both if it uses the same endpoint with ID
      : this.configService.saveSavingsGoal(goal);

    request.subscribe({
      next: () => {
        Swal.fire('¡Éxito!', this.isEdit() ? 'Meta actualizada' : 'Meta creada', 'success');
        this.router.navigate(['/savings-goals']);
      },
      error: () => Swal.fire('Error', 'No se pudo guardar la meta', 'error')
    });
  }
}



