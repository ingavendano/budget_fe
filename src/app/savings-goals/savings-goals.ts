import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfigService, SavingsGoal } from '../config/config.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-savings-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './savings-goals.html',
  styleUrls: ['./savings-goals.css']
})
export class SavingsGoalsComponent implements OnInit {
  private configService = inject(ConfigService);

  // Data signals
  goals = signal<SavingsGoal[]>([]);
  showForm = signal<boolean>(false);

  // Form signals
  selectedIcon = signal<string>('🐷');
  name = signal<string>('');
  description = signal<string>('');
  targetAmount = signal<string>('');
  deadline = signal<string>('');

  // Icon options based on image
  icons = ['🖼️', '🚗', '🏠', '🎓', '💍', '🌍', '💻', '🛡️', '🐷', '🎯', '✈️', '📱', '🎁', '🏗️', '🎸'];

  // Summary computed signals
  totalSaved = computed(() => 
    this.goals().reduce((sum, g) => sum + Number(g.currentAmount), 0)
  );

  totalGoalAmount = computed(() => 
    this.goals().reduce((sum, g) => sum + Number(g.targetAmount), 0)
  );

  goalsReached = computed(() => 
    this.goals().filter(g => Number(g.currentAmount) >= Number(g.targetAmount)).length
  );

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.configService.getSavingsGoals().subscribe(goals => this.goals.set(goals));
  }

  saveGoal() {
    if (!this.name() || !this.targetAmount()) {
      Swal.fire('Error', 'Por favor ingresa un nombre y un monto meta', 'error');
      return;
    }

    const newGoal: SavingsGoal = {
      name: this.name(),
      description: this.description(),
      targetAmount: Number(this.targetAmount()),
      currentAmount: 0,
      deadline: this.deadline() || undefined,
      icon: this.selectedIcon()
    };

    this.configService.saveSavingsGoal(newGoal).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Meta Creada!',
          text: 'Tu nuevo objetivo de ahorro ha sido registrado.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.loadData();
      },
      error: () => Swal.fire('Error', 'No se pudo crear la meta', 'error')
    });
  }

  deposit(goal: SavingsGoal) {
    Swal.fire({
      title: `Abonar a ${goal.name}`,
      input: 'number',
      inputLabel: 'Monto a ahorrar',
      inputPlaceholder: '0.00',
      showCancelButton: true,
      confirmButtonText: 'Abonar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#004b50',
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) {
          return 'Por favor ingresa un monto válido';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.configService.depositToGoal(goal.publicId!, Number(result.value)).subscribe(() => {
          Swal.fire('¡Abono exitoso!', 'Tus ahorros han crecido.', 'success');
          this.loadData();
        });
      }
    });
  }

  deleteGoal(id: number | undefined) {
    if (!id) return;

    Swal.fire({
      title: '¿Eliminar meta?',
      text: "Se perderá el registro de progreso de esta meta",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#70787d',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Conservar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.configService.deleteSavingsGoal(id).subscribe(() => {
          Swal.fire('Eliminada', 'La meta ha sido eliminada.', 'success');
          this.loadData();
        });
      }
    });
  }

  getProgress(goal: SavingsGoal): number {
    if (goal.targetAmount <= 0) return 0;
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(Math.round(progress), 100);
  }

  getMissingAmount(goal: SavingsGoal): number {
    return Math.max(goal.targetAmount - goal.currentAmount, 0);
  }

  private resetForm() {
    this.name.set('');
    this.description.set('');
    this.targetAmount.set('');
    this.deadline.set('');
    this.selectedIcon.set('🐷');
    this.showForm.set(false);
  }
}
