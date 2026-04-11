import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfigService, Category, IncomeTax, IsrBracket, IncomeEntry } from '../config/config.service';
import { AuthService } from '../auth/auth.service';
import Swal from 'sweetalert2';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective, RouterModule],
  templateUrl: './income.html',
  styleUrl: './income.css',
})
export class Income implements OnInit {
  private configService = inject(ConfigService);
  private authService = inject(AuthService);

  public currentUser = this.authService.currentUser;

  // State
  availableCategories = signal<Category[]>([]);
  incomeCategories = computed(() => this.availableCategories().filter(c => c.type === 'INCOME'));
  allTaxes = signal<IncomeTax[]>([]);
  isrBrackets = signal<IsrBracket[]>([]);
  incomes = signal<IncomeEntry[]>([]);

  // Selection and Input
  selectedCategoryId = signal<number | string | null>(null);
  description = signal<string>('');
  amount = signal<number>(0);
  entryDate = signal<string>('');
  publicId = signal<string>('');

  // Summary Metrics
  monthlyBudget = 0.00; // As per Stitch design or user preference
  totalMonthlyIncome = computed(() => {
    return this.incomes().reduce((acc, curr) => acc + curr.grossAmount, 0);
  });
  totalMonthlyNetIncome = computed(() => {
    return this.incomes().reduce((acc, curr) => acc + curr.netAmount, 0);
  });
  budgetPercentage = computed(() => {
    if (this.monthlyBudget === 0) return 0;
    return Math.min(100, (this.totalMonthlyIncome() / this.monthlyBudget) * 100);
  });

  // Helper for selected category
  selectedCategory = computed(() => {
    const id = this.selectedCategoryId();
    return this.incomeCategories().find(c => c.id == id) || null;
  });

  // Calculations for current selection
  currentBreakdown = computed(() => {
    const cat = this.selectedCategory();
    if (!cat) return null;

    const currentAmount = this.amount();
    const catTaxes = cat.taxes || [];
    const deductions: { name: string; amount: number; isIsr: boolean }[] = [];
    let otherTaxesTotal = 0;

    // 1. Other taxes (ISSS, fixed percentage, etc.)
    catTaxes.forEach(tax => {
      if (tax.rangeTableRequired) return; // Skip ISR for first pass

      const percentage = tax.percentage || 0;
      let taxAmount = 0;

      if (tax.name.toUpperCase().includes('ISSS')) {
        const taxableBase = Math.min(currentAmount, 1000);
        taxAmount = taxableBase * (percentage / 100);
      } else {
        taxAmount = currentAmount * (percentage / 100);
      }

      otherTaxesTotal += taxAmount;

      deductions.push({ name: tax.name, amount: taxAmount, isIsr: false });
    });

    // 2. ISR (Renta) - Standalone global table consultation
    const isrTax = catTaxes.find(t => t.rangeTableRequired);
    let isrAmount = 0;

    if (isrTax) {
      const baseIsr = currentAmount - otherTaxesTotal;
      const bracket = this.isrBrackets().find(b =>
        baseIsr >= b.lowerLimit && (!b.upperLimit || baseIsr <= b.upperLimit)
      );

      if (bracket) {
        isrAmount = (baseIsr - (bracket.excess || 0)) * (bracket.applyPercentage / 100) + bracket.fixedFee;
        deductions.push({ name: isrTax.name, amount: isrAmount, isIsr: true });
      }
    }

    const totalDeductions = otherTaxesTotal + isrAmount;
    const net = currentAmount - totalDeductions;

    return {
      gross: currentAmount,
      deductions,
      totalDeductions,
      net
    };
  });


  ngOnInit() {
    this.configService.getCategories().subscribe(res => this.availableCategories.set(res));
    this.configService.getIncomeTaxes().subscribe(res => this.allTaxes.set(res));
    this.configService.getIsrBrackets().subscribe(res => this.isrBrackets.set(res));
    this.loadIncomes();
  }

  loadIncomes() {
    this.configService.getIncomes().subscribe(res => this.incomes.set(res));
  }

  deleteIncome(id: number | undefined) {
    if (!id) return;
    Swal.fire({
      title: '¿Eliminar ingreso?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#004253',
      cancelButtonColor: '#ba1a1a',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.configService.deleteIncome(id).subscribe(() => {
          this.loadIncomes();
          Swal.fire({
            title: 'Eliminado',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        });
      }
    });
  }

  saveIncome() {
    const breakdown = this.currentBreakdown();
    const category = this.selectedCategory();
    if (!breakdown || !category) return;

    this.configService.saveIncome({
      category: category,
      description: this.description(),
      grossAmount: Number(this.amount()) || 0,
      totalDeductions: Number(breakdown.totalDeductions) || 0,
      netAmount: Number(breakdown.net) || 0,
      entryDate: this.entryDate() || undefined,
      publicId: this.publicId() || undefined,
      deductions: breakdown.deductions.map(d => ({ name: d.name, amount: Number(d.amount) || 0 }))
    }).subscribe(() => {
      Swal.fire({
        icon: 'success',
        title: 'Ingreso guardado',
        timer: 1500,
        showConfirmButton: false
      });
      this.description.set('');
      this.amount.set(0);
      this.selectedCategoryId.set(null);
      this.loadIncomes();
    });
  }

  printHistory() {
    window.print();
  }

  exportToPdf() {
    this.configService.exportIncomesPdf().subscribe(blob => {
      this.downloadFile(blob, 'ingresos.pdf');
    });
  }

  exportToExcel() {
    this.configService.exportIncomesExcel().subscribe(blob => {
      this.downloadFile(blob, 'ingresos.xlsx');
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
