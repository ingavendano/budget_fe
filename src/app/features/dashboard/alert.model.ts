export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export type AlertCategory =
  | 'overspending'
  | 'negative_balance'
  | 'debt_due'
  | 'budget_exceeded'
  | 'goal_reached'
  | 'goal_at_risk'
  | 'unusual_expense'
  | 'savings_low';

export interface FinancialAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  actionLabel: string;
  actionRoute?: string;
  metadata?: Record<string, unknown>;
  generatedAt: Date;
}
