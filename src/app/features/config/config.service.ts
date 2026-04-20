import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─────────────────────────────────────────────────────────────
// TABLE 1: CATEGORY
// ─────────────────────────────────────────────────────────────
export interface Category {
  id?: number;
  publicId?: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
  taxes?: IncomeTax[];
}

// ─────────────────────────────────────────────────────────────
// TABLE 3: PARAMETERIZATION (isr_bracket)
// ─────────────────────────────────────────────────────────────
export interface IsrBracket {
  id?: number;
  publicId?: string;
  rangeName?: string;       // "Tier 1 - Low", etc.
  tramo: number;
  lowerLimit: number;
  upperLimit?: number;
  applyPercentage: number;
  excess: number;
  fixedFee: number;
}

// ─────────────────────────────────────────────────────────────
// TABLE 2: TAXES (income_tax)
// ─────────────────────────────────────────────────────────────
export interface IncomeTax {
  id?: number;
  publicId?: string;
  name: string;
  percentage?: number;
  limitApplicable: boolean;   // NEW: Limit Applicable toggle
  limitValue?: number;        // NEW: cap value when limitApplicable is true
  rangeTableRequired: boolean;// NEW: Range Table indicator
  salaryType: 'CONTRATO' | 'SERVICIOS_PROFESIONALES' | 'OTROS';
  active: boolean;
}

// ─────────────────────────────────────────────────────────────
// Income entry (unrelated to config, just re-exported here)
// ─────────────────────────────────────────────────────────────
export interface IncomeDeduction {
  name: string;
  amount: number;
}

export interface IncomeEntry {
  id?: number;
  publicId?: string;
  category: Category;
  description: string;
  grossAmount: number;
  totalDeductions: number;
  netAmount: number;
  entryDate?: string;
  deductions: IncomeDeduction[];
}

export interface BudgetTemplate {
  id?: number;
  publicId?: string;
  category: Category;
  description?: string;
  amount: number;
  expenseType: 'FIJO' | 'VARIABLE';
  estimatedDay?: string;
}

export interface ExpenseEntry {
  id?: number;
  publicId?: string;
  category: Category;
  description?: string;
  amount: number;
  expenseType: 'FIJO' | 'VARIABLE';
  entryDate?: string;
  paymentDate?: string;
}

export interface SavingsGoal {
  id?: number;
  publicId?: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  monthlyContribution?: number;
  contributionDay?: number;
  isEmergencyFund?: boolean;
}

export interface SavingsGoalScheduleItem {
  month: string;
  year: number;
  expectedDate: string;
  expectedAmount: number;
  actualAmount: number;
  status: 'PAID' | 'PENDING' | 'LATE';
}

export interface TrendData {
  date: string;
  amount: number;
}

export interface CategorySummary {
  name: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
}

export interface Debt {
  id?: number;
  publicId?: string;
  name: string;
  description?: string;
  totalAmount: number;
  currentBalance: number;
  monthlyInstallment: number;
  interestRate: number;
  minimumPayment: number;
}

export interface UserProfile {
  id?: number;
  email: string;
  name: string;
  imageUrl?: string;
  phoneNumber?: string;
  preferredTheme?: string;
  planType?: 'FREE' | 'PREMIUM' | 'PRO';
  planExpiration?: string;
}

export interface DashboardStats {
  totalIncomes: number;
  totalNetIncomes: number;
  totalExpenses: number;
  netBalance: number;
  trends: TrendData[];
  expensesByCategory: CategorySummary[];
}

export interface EmergencyFundDTO {
  goalId?: number;
  currentAmount: number;
  targetAmount: number;
  avgMonthlyExpenses: number;
  runwayMonths: number;
}

export interface PeriodMetricsDTO {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface AdminDashboardStatsDTO {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByPlan: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private http = inject(HttpClient);
  private readonly BASE = environment.apiUrl;
  private configUrl          = `${this.BASE}/api/config`;
  private incomeUrl          = `${this.BASE}/api/incomes`;
  private expenseUrl         = `${this.BASE}/api/expenses`;
  private savingsGoalUrl     = `${this.BASE}/api/savings-goals`;
  private budgetTemplateUrl  = `${this.BASE}/api/budget-templates`;
  private debtUrl            = `${this.BASE}/api/debts`;
  private userUrl            = `${this.BASE}/api/user`;
  private statsUrl           = `${this.BASE}/api/stats`;

  constructor() {
    // Check for saved theme in localStorage as a fallback/initial boost
    const savedTheme = localStorage.getItem('app-theme') || 'DEFAULT';
    this.applyTheme(savedTheme);
  }

  applyTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }

  // ── TABLE 1: Categories ──────────────────────────────────────
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.configUrl}/categories`);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${this.configUrl}/categories`, category);
  }

  updateCategory(id: number | string, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.configUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.configUrl}/categories/${id}`);
  }

  // ── TABLE 2: Taxes ───────────────────────────────────────────
  getIncomeTaxes(): Observable<IncomeTax[]> {
    return this.http.get<IncomeTax[]>(`${this.configUrl}/income-taxes`);
  }

  saveIncomeTax(incomeTax: IncomeTax): Observable<IncomeTax> {
    return this.http.post<IncomeTax>(`${this.configUrl}/income-taxes`, incomeTax);
  }

  updateIncomeTax(id: number | string, incomeTax: IncomeTax): Observable<IncomeTax> {
    return this.http.put<IncomeTax>(`${this.configUrl}/income-taxes/${id}`, incomeTax);
  }

  deleteIncomeTax(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.configUrl}/income-taxes/${id}`);
  }

  // ── TABLE 3: ISR Brackets (read; saves cascade through Tax) ──
  getBracketsForTax(taxId: number): Observable<IsrBracket[]> {
    return this.http.get<IsrBracket[]>(`${this.configUrl}/income-taxes/${taxId}/brackets`);
  }

  // ── TABLE 4: Tax ↔ Category Association ──────────────────────
  /** Replace all taxes on a category with the given taxId list */
  setTaxesForCategory(categoryId: number, taxIds: number[]): Observable<Category> {
    return this.http.put<Category>(`${this.configUrl}/categories/${categoryId}/taxes`, taxIds);
  }

  /** Associate one tax to a category */
  addTaxToCategory(categoryId: number, taxId: number): Observable<Category> {
    return this.http.post<Category>(
      `${this.configUrl}/categories/${categoryId}/taxes/${taxId}`, {}
    );
  }

  /** Remove one tax from a category */
  removeTaxFromCategory(categoryId: number, taxId: number): Observable<Category> {
    return this.http.delete<Category>(
      `${this.configUrl}/categories/${categoryId}/taxes/${taxId}`
    );
  }

  // ─────────────────────────────────────────────
  // Standalone ISR Brackets
  // ─────────────────────────────────────────────

  getIsrBrackets(): Observable<IsrBracket[]> {
    return this.http.get<IsrBracket[]>(`${this.configUrl}/isr-brackets`);
  }

  saveIsrBrackets(brackets: IsrBracket[]): Observable<IsrBracket[]> {
    return this.http.post<IsrBracket[]>(`${this.configUrl}/isr-brackets`, brackets);
  }

  // ── Income entries ───────────────────────────────────────────
  saveIncome(income: IncomeEntry): Observable<IncomeEntry> {
    return this.http.post<IncomeEntry>(this.incomeUrl, income);
  }

  getIncomes(): Observable<IncomeEntry[]> {
    return this.http.get<IncomeEntry[]>(this.incomeUrl);
  }

  deleteIncome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.incomeUrl}/${id}`);
  }

  // ── Expense entries ───────────────────────────────────────────
  getExpenses(): Observable<ExpenseEntry[]> {
    return this.http.get<ExpenseEntry[]>(this.expenseUrl);
  }

  saveExpense(expense: ExpenseEntry): Observable<ExpenseEntry> {
    return this.http.post<ExpenseEntry>(this.expenseUrl, expense);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.expenseUrl}/${id}`);
  }

  // ── Savings Goals ───────────────────────────────────────────
  getSavingsGoals(): Observable<SavingsGoal[]> {
    return this.http.get<SavingsGoal[]>(this.savingsGoalUrl);
  }

  saveSavingsGoal(goal: SavingsGoal): Observable<SavingsGoal> {
    if (goal.publicId) {
      return this.http.put<SavingsGoal>(`${environment.apiUrl}/api/savings-goals/${goal.publicId}`, goal);
    }
    return this.http.post<SavingsGoal>(`${environment.apiUrl}/api/savings-goals`, goal);
  }

  getSavingsGoal(publicId: string): Observable<SavingsGoal> {
    return this.http.get<SavingsGoal>(`${this.savingsGoalUrl}/${publicId}`);
  }

  getSavingsGoalSchedule(publicId: string): Observable<SavingsGoalScheduleItem[]> {
    return this.http.get<SavingsGoalScheduleItem[]>(`${environment.apiUrl}/api/savings-goals/${publicId}/schedule`);
  }

  depositToGoal(publicId: string, amount: number): Observable<SavingsGoal> {
    return this.http.patch<SavingsGoal>(`${this.savingsGoalUrl}/${publicId}/deposit`, amount);
  }

  deleteSavingsGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.savingsGoalUrl}/${id}`);
  }

  // ── Budget Templates ──────────────────────────────────────────
  getBudgetTemplates(): Observable<BudgetTemplate[]> {
    return this.http.get<BudgetTemplate[]>(this.budgetTemplateUrl);
  }

  saveBudgetTemplate(template: BudgetTemplate): Observable<BudgetTemplate> {
    return this.http.post<BudgetTemplate>(this.budgetTemplateUrl, template);
  }

  deleteBudgetTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.budgetTemplateUrl}/${id}`);
  }

  importBudgetTemplate(monthDate: string): Observable<ExpenseEntry[]> {
    return this.http.post<ExpenseEntry[]>(`${this.budgetTemplateUrl}/import`, { monthDate });
  }

  // ── TABLE 6: Debts ──────────────────────────────────────
  getDebts(): Observable<Debt[]> {
    return this.http.get<Debt[]>(this.debtUrl);
  }

  saveDebt(debt: Debt): Observable<Debt> {
    return this.http.post<Debt>(this.debtUrl, debt);
  }

  recordDebtPayment(publicId: string, amount: number): Observable<Debt> {
    return this.http.post<Debt>(`${this.debtUrl}/${publicId}/payment`, amount);
  }

  deleteDebt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.debtUrl}/${id}`);
  }

  // ── USER PROFILE ─────────────────────────────────────────
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.userUrl}/profile`);
  }

  updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.userUrl}/profile`, profile);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.statsUrl}/dashboard`);
  }

  // ── Export methods ──────────────────────────────────────────
  exportIncomesPdf(): Observable<Blob> {
    return this.http.get(`${this.incomeUrl}/export/pdf`, { responseType: 'blob' });
  }

  exportIncomesExcel(): Observable<Blob> {
    return this.http.get(`${this.incomeUrl}/export/excel`, { responseType: 'blob' });
  }

  exportExpensesPdf(): Observable<Blob> {
    return this.http.get(`${this.expenseUrl}/export/pdf`, { responseType: 'blob' });
  }

  exportExpensesExcel(): Observable<Blob> {
    return this.http.get(`${this.expenseUrl}/export/excel`, { responseType: 'blob' });
  }

  // ── WEALTH MANAGEMENT ──────────────────────────────────────────
  getEmergencyFund(): Observable<EmergencyFundDTO> {
    return this.http.get<EmergencyFundDTO>(`${this.BASE}/api/dashboard/emergency-fund`);
  }

  getHistoricalNetWorth(): Observable<PeriodMetricsDTO[]> {
    return this.http.get<PeriodMetricsDTO[]>(`${this.BASE}/api/dashboard/net-worth/historical`);
  }

  getAdminStats(): Observable<AdminDashboardStatsDTO> {
    return this.http.get<AdminDashboardStatsDTO>(`${this.userUrl}/admin/stats`);
  }
}


