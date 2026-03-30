import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfigService, Debt } from '../config/config.service';
import { NgxMaskDirective } from 'ngx-mask';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-debt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './debt.html',
  styleUrls: ['./debt.css']
})
export class DebtComponent implements OnInit {
  private configService = inject(ConfigService);

  // Data signals
  debts = signal<Debt[]>([]);
  showForm = signal<boolean>(false);
  editId = signal<number | null>(null);

  // Form signals
  name = signal<string>('');
  description = signal<string>('');
  totalAmount = signal<string>('');
  monthlyInstallment = signal<string>('');
  interestRate = signal<string>('0');
  minimumPayment = signal<string>('0');

  // Strategy signal
  strategy = signal<'NONE' | 'SNOWBALL' | 'AVALANCHE'>('SNOWBALL');

  // Summary computed signals
  totalPendingDebt = computed(() => 
    this.debts().reduce((sum, d) => sum + Number(d.currentBalance), 0)
  );

  totalMonthlyInstallments = computed(() => 
    this.debts().reduce((sum, d) => sum + Number(d.monthlyInstallment), 0)
  );

  activeDebtsCount = computed(() => 
    this.debts().filter(d => Number(d.currentBalance) > 0).length
  );

  sortedDebts = computed(() => {
    const strategy = this.strategy();
    const debts = [...this.debts()];

    if (strategy === 'SNOWBALL') {
      return debts.sort((a, b) => Number(a.currentBalance) - Number(b.currentBalance));
    } else if (strategy === 'AVALANCHE') {
      return debts.sort((a, b) => Number(b.interestRate) - Number(a.interestRate));
    }

    return debts;
  });

  nextTarget = computed(() => {
    const active = this.sortedDebts().filter(d => Number(d.currentBalance) > 0);
    return active.length > 0 ? active[0] : null;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.configService.getDebts().subscribe(debts => this.debts.set(debts));
  }

  saveDebt() {
    const nameVal = this.name().trim();
    
    // Audit Validation Point 5
    if (nameVal.length < 3) {
      Swal.fire('Error', 'El nombre de la deuda debe tener al menos 3 caracteres', 'error');
      return;
    }

    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!namePattern.test(nameVal)) {
      Swal.fire('Error', 'El nombre de la deuda solo debe contener letras', 'error');
      return;
    }

    if (!this.totalAmount() || !this.monthlyInstallment()) {
      Swal.fire('Error', 'Por favor completa los campos obligatorios', 'error');
      return;
    }

    const newDebt: Debt = {
      id: this.editId() || undefined,
      name: nameVal,
      description: this.description(),
      totalAmount: Number(this.totalAmount()),
      currentBalance: this.editId() ? this.debts().find(d => d.id === this.editId())?.currentBalance || Number(this.totalAmount()) : Number(this.totalAmount()),
      monthlyInstallment: Number(this.monthlyInstallment()),
      interestRate: Number(this.interestRate()),
      minimumPayment: Number(this.minimumPayment()) || Number(this.monthlyInstallment())
    };

    this.configService.saveDebt(newDebt).subscribe({
      next: () => {
        const isEdit = this.editId() !== null;
        Swal.fire({
          title: isEdit ? '¡Actualizado!' : '¡Deuda Registrada!',
          text: isEdit ? 'La información de la deuda ha sido actualizada.' : 'Tu nueva deuda ha sido registrada correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.loadData();
      },
      error: () => Swal.fire('Error', 'No se pudo registrar la deuda', 'error')
    });
  }

  recordPayment(debt: Debt) {
    Swal.fire({
      title: `Registrar Abono - ${debt.name}`,
      input: 'number',
      inputLabel: 'Monto del pago',
      inputPlaceholder: '0.00',
      showCancelButton: true,
      confirmButtonText: 'Registrar',
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
        this.configService.recordDebtPayment(debt.publicId!, Number(result.value)).subscribe(() => {
          Swal.fire('¡Abono registrado!', 'Tu saldo pendiente ha sido actualizado.', 'success');
          this.loadData();
        });
      }
    });
  }

  editDebt(debt: Debt) {
    this.editId.set(debt.id || null);
    this.name.set(debt.name);
    this.description.set(debt.description || '');
    this.totalAmount.set(debt.totalAmount.toString());
    this.monthlyInstallment.set(debt.monthlyInstallment.toString());
    this.interestRate.set(debt.interestRate?.toString() || '0');
    this.minimumPayment.set(debt.minimumPayment?.toString() || debt.monthlyInstallment.toString());
    this.showForm.set(true);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteDebt(id: number | undefined) {
    if (!id) return;

    Swal.fire({
      title: '¿Eliminar deuda?',
      text: "Se perderá el registro de saldo de esta deuda",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#70787d',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Conservar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.configService.deleteDebt(id).subscribe(() => {
          Swal.fire('Eliminado', 'El registro ha sido eliminado.', 'success');
          this.loadData();
        });
      }
    });
  }

  getProgress(debt: Debt): number {
    if (debt.totalAmount <= 0) return 0;
    const paid = debt.totalAmount - debt.currentBalance;
    const progress = (paid / debt.totalAmount) * 100;
    return Math.min(Math.round(progress), 100);
  }

  getPaidAmount(debt: Debt): number {
    return debt.totalAmount - debt.currentBalance;
  }

  resetForm() {
    this.name.set('');
    this.description.set('');
    this.totalAmount.set('');
    this.monthlyInstallment.set('');
    this.interestRate.set('0');
    this.minimumPayment.set('0');
    this.editId.set(null);
    this.showForm.set(false);
  }
}
