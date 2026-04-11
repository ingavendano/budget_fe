import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfigService, Category, ExpenseEntry } from '../config/config.service';
import { AuthService } from '../auth/auth.service';
import { NgxMaskDirective } from 'ngx-mask';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective, RouterModule],
  templateUrl: './expense.html',
  styleUrls: ['./expense.css']
})
export class ExpenseComponent implements OnInit {
  private configService = inject(ConfigService);
  private authService = inject(AuthService);

  public currentUser = this.authService.currentUser;

  // Data signals
  categories = signal<Category[]>([]);
  expenses = signal<ExpenseEntry[]>([]);
  editId = signal<number | null>(null);

  // Form signals
  selectedCategoryId = signal<string>('');
  amount = signal<string>('');
  description = signal<string>('');
  expenseType = signal<'FIJO' | 'VARIABLE'>('VARIABLE');
  paymentDate = signal<string>('');
  entryDate = signal<string>('');
  publicId = signal<string>('');

  // Computed
  expenseCategories = computed(() => 
    this.categories().filter(c => c.type === 'EXPENSE')
  );

  totalMonthlyExpenses = computed(() => 
    this.expenses().reduce((sum, e) => sum + Number(e.amount), 0)
  );

  monthlyBudget = 20000; // Hardcoded from design for now
  budgetPercentage = computed(() => 
    Math.min(Math.round((this.totalMonthlyExpenses() / this.monthlyBudget) * 100), 100)
  );

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.configService.getCategories().subscribe(cats => this.categories.set(cats));
    this.configService.getExpenses().subscribe(exps => this.expenses.set(exps));
  }

  saveExpense() {
    if (!this.selectedCategoryId() || !this.amount()) {
      Swal.fire('Error', 'Por favor selecciona una categoría y un monto', 'error');
      return;
    }

    const category = this.categories().find(c => c.id === Number(this.selectedCategoryId()));
    if (!category) return;

    const newExpense: ExpenseEntry = {
      id: this.editId() || undefined,
      publicId: this.publicId() || undefined,
      category: category,
      amount: Number(this.amount()),
      description: this.description() || 'Gasto registrado',
      expenseType: this.expenseType(),
      paymentDate: this.paymentDate() || undefined,
      entryDate: this.entryDate() || undefined
    };

    this.configService.saveExpense(newExpense).subscribe({
      next: () => {
        const isEdit = this.editId() !== null;
        Swal.fire({
          title: isEdit ? '¡Actualizado!' : '¡Guardado!',
          text: isEdit ? 'El gasto ha sido actualizado correctamente.' : 'El gasto ha sido registrado exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.loadData();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar el gasto', 'error')
    });
  }

  editExpense(exp: ExpenseEntry) {
    this.editId.set(exp.id || null);
    this.selectedCategoryId.set(exp.category.id?.toString() || '');
    this.amount.set(exp.amount.toString());
    this.description.set(exp.description || '');
    this.expenseType.set(exp.expenseType);
    this.paymentDate.set(exp.paymentDate || '');
    this.entryDate.set(exp.entryDate || '');
    this.publicId.set(exp.publicId || '');
    
    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.resetForm();
  }

  deleteExpense(id: number | undefined) {
    if (!id) return;
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#70787d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.configService.deleteExpense(id).subscribe(() => {
          Swal.fire('Eliminado', 'El gasto ha sido eliminado.', 'success');
          this.loadData();
        });
      }
    });
  }

  private resetForm() {
    this.selectedCategoryId.set('');
    this.amount.set('');
    this.description.set('');
    this.expenseType.set('VARIABLE');
    this.paymentDate.set('');
    this.entryDate.set('');
    this.publicId.set('');
    this.editId.set(null);
  }

  printHistory() {
    window.print();
  }

  exportToPdf() {
    this.configService.exportExpensesPdf().subscribe(blob => {
      this.downloadFile(blob, 'egresos.pdf');
    });
  }

  exportToExcel() {
    this.configService.exportExpensesExcel().subscribe(blob => {
      this.downloadFile(blob, 'egresos.xlsx');
    });
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }
}
