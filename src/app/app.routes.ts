import { Routes } from '@angular/router';
import { Config } from './config/config';
import { Income } from './income/income';
import { ExpenseComponent } from './expense/expense';
import { DashboardComponent } from './dashboard/dashboard';
import { BudgetComponent } from './budget/budget';
import { SavingsGoalsEnhancedComponent } from './features/savings-goals/savings-goals-enhanced/savings-goals-enhanced.component';
import { SavingsGoalFormComponent } from './features/savings-goals/savings-goal-form/savings-goal-form.component';
import { SavingsDepositComponent } from './features/savings-goals/savings-deposit/savings-deposit.component';
import { DebtComponent } from './debt/debt';
import { ProfileComponent } from './profile/profile';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { LandingPageComponent } from './landing/landing';
import { authGuard } from './auth/auth.guard';
import { planGuard } from './auth/plan.guard';
import { SubscriptionComponent } from './features/subscription/subscription/subscription.component';
import { SubscriptionAdminComponent } from './features/subscription/subscription-admin/subscription-admin.component';
import { PasswordResetAdminComponent } from './features/admin/password-reset-admin/password-reset-admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'welcome', component: LandingPageComponent },
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { 
    path: 'overview', 
    component: DashboardComponent,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'config', 
    component: Config,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'income', 
    component: Income,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'expense', 
    component: ExpenseComponent,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'budget', 
    component: BudgetComponent,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'savings-goals', 
    component: SavingsGoalsEnhancedComponent,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'savings-goals/new', 
    component: SavingsGoalFormComponent,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'savings-goals/:id/edit', 
    component: SavingsGoalFormComponent,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'savings-goals/:id/deposit', 
    component: SavingsDepositComponent,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'debts', 
    component: DebtComponent,
    canActivate: [authGuard, planGuard] 
  },
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'subscription', 
    component: SubscriptionComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'admin/subscriptions', 
    component: SubscriptionAdminComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'admin/password-reset', 
    component: PasswordResetAdminComponent,
    canActivate: [authGuard] 
  },
];


