import { Routes } from '@angular/router';
import { Config } from './features/config/config';
import { Income } from './features/income/income';
import { ExpenseComponent } from './features/expense/expense';
import { DashboardComponent } from './features/dashboard/dashboard';
import { BudgetComponent } from './features/budget/budget';
import { SavingsGoalsEnhancedComponent } from './features/savings-goals/savings-goals-enhanced/savings-goals-enhanced.component';
import { SavingsGoalFormComponent } from './features/savings-goals/savings-goal-form/savings-goal-form.component';
import { SavingsDepositComponent } from './features/savings-goals/savings-deposit/savings-deposit.component';
import { DebtComponent } from './features/debt/debt';
import { ProfileComponent } from './features/profile/profile';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { LandingPageComponent } from './features/landing/landing';
import { authGuard } from './core/auth/auth.guard';
import { planGuard } from './core/auth/plan.guard';
import { adminGuard } from './core/auth/admin.guard';
import { SubscriptionComponent } from './features/subscription/subscription/subscription.component';
import { SubscriptionAdminComponent } from './features/subscription/subscription-admin/subscription-admin.component';
import { PasswordResetAdminComponent } from './features/admin/password-reset-admin/password-reset-admin.component';
import { UserStatsComponent } from './features/admin/user-stats/user-stats';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: {
      title: 'Iniciar Sesión — Nemía',
      description: 'Accede a tu cuenta de Nemía para continuar gestionando tu salud financiera.'
    }
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: {
      title: 'Regístrate — Nemía',
      description: 'Crea una cuenta gratuita y toma el control total sobre tus finanzas personales y planeación.'
    }
  },
  {
    path: 'welcome',
    component: LandingPageComponent,
    data: {
      title: 'Nemía — Vive tus finanzas',
      description: 'Gestiona, proyecta y audita tu patrimonio con una interfaz diseñada para la excelencia.'
    }
  },
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
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/password-reset',
    component: PasswordResetAdminComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/stats',
    component: UserStatsComponent,
    canActivate: [authGuard, adminGuard]
  },
];



