import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService, Category, IncomeTax, IsrBracket } from './config.service';
import { SubscriptionService } from '../features/subscription/subscription.service';
import Swal from 'sweetalert2';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective],
  templateUrl: './config.html',
  styleUrl: './config.css',
})
export class Config implements OnInit {
  private configService = inject(ConfigService);
  private subscriptionService = inject(SubscriptionService);

  // Limits
  maxIncomeCategories = computed(() => this.subscriptionService.currentPlan()?.maxIncomeCategories ?? null);
  maxExpenseCategories = computed(() => this.subscriptionService.currentPlan()?.maxExpenseCategories ?? null);
  currentIncomeCount = computed(() => this.availableCategories().filter(c => c.type === 'INCOME').length);
  currentExpenseCount = computed(() => this.availableCategories().filter(c => c.type === 'EXPENSE').length);

  // Category State
  categoryName = signal('');
  categoryType = signal<'INCOME' | 'EXPENSE'>('INCOME');
  selectedIcon = signal('restaurant');
  selectedColor = signal('#3B82F6');
  editingCategoryId = signal<number | null>(null);

  availableCategories = signal<Category[]>([]);
  incomeCategories = computed(() => this.availableCategories().filter(c => c.type === 'INCOME'));

  isSalarySelected = computed(() => {
    const selected = this.availableCategories().find(c => c.id === this.selectedIncomeCategoryId());
    return selected?.name.toLowerCase().includes('salario') || false;
  });

  allTaxes = signal<IncomeTax[]>([]);

  selectedCategory = computed(() => {
    const id = Number(this.selectedIncomeCategoryId());
    return this.availableCategories().find(c => c.id === id);
  });

  filteredTaxes = computed(() => {
    return this.selectedCategory()?.taxes || [];
  });

  icons = ['restaurant', 'shopping_cart', 'local_gas_station', 'home', 'money', 'credit_card', 'money_bag', 'car_repair', 'flash_on', 'water_drops', 'call', 'android_wifi_3_bar'];
  colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

  // Income Tax State
  editingTaxId = signal<number | null>(null);
  selectedIncomeCategoryId = signal<number | string>('');
  salaryType = signal<'CONTRATO' | 'SERVICIOS_PROFESIONALES' | 'OTROS'>('CONTRATO');
  taxName = signal('Retención ISR');
  taxPercentage = signal(10);
  limitApplicable = signal(false);
  limitValue = signal<number>(0);
  rangeTableRequired = signal(false);

  // ISR Logic
  private readonly isrKeywords = ['ISR', 'RENTA', 'RETENCIÓN', 'RETENCION', 'IMPUESTO SOBRE LA RENTA'];
  showIsrTable = signal(false);

  isIsrTax = computed(() => {
    return this.isIsrTaxItem({
      name: this.taxName(),
      salaryType: this.salaryType()
    } as any) && this.isSalarySelected();
  });

  isIsrTaxItem(tax: IncomeTax): boolean {
    if (!tax.name || tax.salaryType !== 'CONTRATO') return false;
    const name = tax.name.toUpperCase();
    return this.isrKeywords.some(kw => name.includes(kw));
  }


  // ISR Brackets State
  isrBrackets = signal<IsrBracket[]>([]);

  ngOnInit() {
    this.loadCategories();
    this.loadTaxes();
    this.loadBrackets();
  }

  loadCategories() {
    this.configService.getCategories().subscribe(categories => {
      this.availableCategories.set(categories);
    });
  }

  loadTaxes() {
    this.configService.getIncomeTaxes().subscribe(taxes => {
      this.allTaxes.set(taxes);
    });
  }

  loadBrackets() {
    this.configService.getIsrBrackets().subscribe(brackets => {
      this.isrBrackets.set(brackets);
    });
  }

  selectIcon(icon: string) {
    this.selectedIcon.set(icon);
  }

  selectColor(color: string) {
    this.selectedColor.set(color);
  }

  setSalaryType(type: 'CONTRATO' | 'SERVICIOS_PROFESIONALES' | 'OTROS') {
    this.salaryType.set(type);
  }

  saveCategory() {
    if (!this.categoryName().trim()) return;

    const editId = this.editingCategoryId();
    
    // Validate Limits for NEW categories
    if (!editId) {
       if (this.categoryType() === 'INCOME') {
          const max = this.maxIncomeCategories();
          if (max !== null && this.currentIncomeCount() >= max) {
             Swal.fire({ icon: 'error', title: 'Límite alcanzado', text: `Tu plan solo permite hasta ${max} categorías de ingresos.` });
             return;
          }
       } else {
          const max = this.maxExpenseCategories();
          if (max !== null && this.currentExpenseCount() >= max) {
             Swal.fire({ icon: 'error', title: 'Límite alcanzado', text: `Tu plan solo permite hasta ${max} categorías de egresos.` });
             return;
          }
       }
    }

    const catData: Category = {
      name: this.categoryName(),
      icon: this.selectedIcon(),
      color: this.selectedColor(),
      type: this.categoryType()
    };

    const request$ = editId
      ? this.configService.updateCategory(editId, catData)
      : this.configService.createCategory(catData);

    request$.subscribe({
      next: () => {
        this.categoryName.set('');
        this.editingCategoryId.set(null);
        this.loadCategories();
        Swal.fire({
          icon: 'success',
          title: 'Categoría guardada',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error saving category:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al guardar la categoría'
        });
      }
    });
  }

  editCategory(cat: Category) {
    this.editingCategoryId.set(cat.id!);
    this.categoryName.set(cat.name);
    this.categoryType.set(cat.type);
    this.selectedIcon.set(cat.icon);
    this.selectedColor.set(cat.color);
  }

  deleteCategory(id: number | string) {
    if (id == null) return;
    this.configService.deleteCategory(id).subscribe({
      next: () => {
        this.loadCategories();
        Swal.fire({
          icon: 'success',
          title: 'Categoría eliminada',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error deleting category:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar. Puede tener impuestos asociados.'
        });
      }
    });
  }


  addBracket() {
    const nextTramo = this.isrBrackets().length + 1;
    this.isrBrackets.update(prev => [...prev, {
      tramo: nextTramo,
      rangeName: `Tier ${nextTramo}`,
      lowerLimit: 0,
      upperLimit: 0,
      applyPercentage: 0,
      excess: 0,
      fixedFee: 0
    }]);
  }

  saveTaxConfiguration() {
    const taxConfig: IncomeTax = {
      name: this.taxName(),
      percentage: Number(this.taxPercentage()) || 0,
      salaryType: this.salaryType(),
      limitApplicable: this.limitApplicable(),
      limitValue: this.limitApplicable() ? Number(this.limitValue()) || 0 : undefined,
      rangeTableRequired: this.rangeTableRequired(),
      active: true
    };

    const request = this.editingTaxId()
      ? this.configService.updateIncomeTax(this.editingTaxId()!, taxConfig)
      : this.configService.saveIncomeTax(taxConfig);

    request.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Impuesto guardado',
          timer: 1500,
          showConfirmButton: false
        });
        this.resetTaxForm();
        this.loadTaxes();
      },
      error: () => Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al guardar el impuesto'
      })
    });
  }

  saveParameterization() {
    // Ensure all numeric fields are numbers before sending to backend
    const sanitizedBrackets = this.isrBrackets().map(b => ({
      ...b,
      lowerLimit: Number(b.lowerLimit) || 0,
      upperLimit: Number(b.upperLimit) || 0,
      applyPercentage: Number(b.applyPercentage) || 0,
      excess: Number(b.excess) || 0,
      fixedFee: Number(b.fixedFee) || 0
    }));

    this.configService.saveIsrBrackets(sanitizedBrackets).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Tabla guardada',
          timer: 1500,
          showConfirmButton: false
        });
        this.isrBrackets.set(res);
      },
      error: (err) => {
        console.error('Error saving brackets:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al guardar la tabla. Verifique que no haya rangos duplicados.'
        });
      }
    });
  }

  resetTaxForm() {
    this.editingTaxId.set(null);
    this.taxName.set('');
    this.taxPercentage.set(0);
    this.limitApplicable.set(false);
    this.limitValue.set(0);
    this.rangeTableRequired.set(false);
    this.showIsrTable.set(false);
    this.isrBrackets.set([]);
  }

  deleteTax(id: number | string) {
    if (!id) return;
    this.configService.deleteIncomeTax(id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Impuesto eliminado',
          timer: 1500,
          showConfirmButton: false
        });
        this.loadTaxes();
      },
      error: (err) => {
        console.error('Error deleting tax:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar el impuesto'
        });
      }
    });
  }


  editTax(tax: IncomeTax) {
    this.editingTaxId.set(tax.id!);
    this.taxName.set(tax.name);
    this.taxPercentage.set(tax.percentage || 0);
    this.limitApplicable.set(tax.limitApplicable || false);
    this.limitValue.set(tax.limitValue || 0);
    this.rangeTableRequired.set(tax.rangeTableRequired || false);

    if (tax.salaryType === 'CONTRATO' || tax.salaryType === 'SERVICIOS_PROFESIONALES' || tax.salaryType === 'OTROS') {
      this.salaryType.set(tax.salaryType);
    }
    // Brackets are now global, don't override from tax
  }

  toggleTaxAssociation(tax: IncomeTax) {
    const category = this.selectedCategory();
    if (!category?.id || !tax.id) return;

    const isAssociated = this.isTaxAssociated(tax.id);

    const request$ = isAssociated
      ? this.configService.removeTaxFromCategory(category.id, tax.id)
      : this.configService.addTaxToCategory(category.id, tax.id);

    request$.subscribe({
      next: () => {
        this.loadCategories();
        // Clear selection after association as requested
        // this.selectedIncomeCategoryId.set(''); 
        // Wait, if I clear it, the list disappears.
        // The user says "no se limpia". Maybe they mean when they FINISH associating?
        // I'll add a "Finish association" button in HTML, or just show a feedback.
        // Actually, I'll clear it after each association if that's what "no se limpia" means.
        // But usually associations are multiple.
        // I'll just show a small Swal toast.
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Asociación actualizada',
          timer: 1000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error updating tax association:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar la asociación'
        });
      }
    });
  }

  isTaxAssociated(taxId?: number): boolean {
    if (!taxId) return false;
    return this.filteredTaxes().some(t => t.id === taxId);
  }

}
