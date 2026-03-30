import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfigService, Category, ExpenseEntry, BudgetTemplate } from '../config/config.service';
import { NgxMaskDirective } from 'ngx-mask';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective, RouterModule, CurrencyPipe],
  templateUrl: './budget.html',
  styleUrls: ['./budget.css']
})
export class BudgetComponent implements OnInit {
  private configService = inject(ConfigService);

  // Data signals
  categories = signal<Category[]>([]);
  budgetTemplates = signal<BudgetTemplate[]>([]);
  editId = signal<number | null>(null);

  // Form signals
  selectedCategoryId = signal<string>('');
  amount = signal<string>('');
  description = signal<string>('');
  expenseType = signal<'FIJO' | 'VARIABLE'>('FIJO');
  estimatedDay = signal<string>('');
  paymentDate = signal<string>('');
  publicId = signal<string>('');

  // Computed
  expenseCategories = computed(() => 
    this.categories().filter(c => c.type === 'EXPENSE')
  );

  totalBudget = computed(() => 
    this.budgetTemplates().reduce((sum, e) => sum + Number(e.amount), 0)
  );

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.configService.getCategories().subscribe(cats => this.categories.set(cats));
    this.configService.getBudgetTemplates().subscribe(temps => this.budgetTemplates.set(temps));
  }

  saveTemplate() {
    if (!this.selectedCategoryId() || !this.amount()) {
      Swal.fire('Error', 'Por favor selecciona una categoría y un monto', 'error');
      return;
    }

    const category = this.categories().find(c => c.id === Number(this.selectedCategoryId()));
    if (!category) return;

    const newTemplate: BudgetTemplate = {
      id: this.editId() || undefined,
      publicId: this.publicId() || undefined,
      category: category,
      amount: Number(this.amount()),
      description: this.description() || 'Partida presupuestaria',
      expenseType: this.expenseType(),
      estimatedDay: this.estimatedDay() || undefined
    };

    this.configService.saveBudgetTemplate(newTemplate).subscribe({
      next: () => {
        const isEdit = this.editId() !== null;
        Swal.fire({
          title: isEdit ? '¡Actualizado!' : '¡Partida Guardada!',
          text: isEdit ? 'La partida del presupuesto ha sido actualizada.' : 'La base del presupuesto ha sido actualizada.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.loadData();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar la partida', 'error')
    });
  }

  editTemplate(item: BudgetTemplate) {
    this.editId.set(item.id || null);
    this.selectedCategoryId.set(item.category.id?.toString() || '');
    this.amount.set(item.amount.toString());
    this.description.set(item.description || '');
    this.expenseType.set(item.expenseType);
    this.estimatedDay.set(item.estimatedDay || '');
    this.publicId.set(item.publicId || '');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.resetForm();
  }

  deleteTemplate(id: number | undefined) {
    if (!id) return;
    
    Swal.fire({
      title: '¿Eliminar partida?',
      text: "Esto quitará este gasto de tu plantilla base",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#70787d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.configService.deleteBudgetTemplate(id).subscribe(() => {
          Swal.fire('Eliminado', 'La partida ha sido eliminada.', 'success');
          this.loadData();
        });
      }
    });
  }

  private resetForm() {
    this.selectedCategoryId.set('');
    this.amount.set('');
    this.description.set('');
    this.expenseType.set('FIJO');
    this.paymentDate.set('');
    this.publicId.set('');
    this.editId.set(null);
  }

  importToMonthlyExpenses() {
    if (this.budgetTemplates().length === 0) {
      Swal.fire('Atención', 'No tienes partidas en tu presupuesto base para importar.', 'warning');
      return;
    }

    const today = new Date();
    const minDate = today.toISOString().split('T')[0].substring(0, 7); // YYYY-MM

    Swal.fire({
      title: 'Confirmar e Importar Presupuesto',
      html: `
        <p style="margin-bottom: 20px;">Selecciona el mes en el que deseas cargar esta plantilla de gastos:</p>
        <input type="month" id="importMonth" class="swal2-input" 
               min="${minDate}" 
               value="${minDate}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Importar Ahora',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#004b50',
      preConfirm: () => {
        const month = (document.getElementById('importMonth') as HTMLInputElement).value;
        if (!month) {
          Swal.showValidationMessage('Debes seleccionar un mes');
          return false;
        }
        return month;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // We append "-01" to make it a valid LocalDate string (YYYY-MM-01)
        const targetDate = `${result.value}-01`;
        
        this.configService.importBudgetTemplate(targetDate).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Tu presupuesto ha sido importado al mes seleccionado.', 'success');
          },
          error: () => Swal.fire('Error', 'Hubo un problema al importar la plantilla.', 'error')
        });
      }
    });
  }
}
