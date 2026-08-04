import { Payment } from './payment.model';

export type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface FeeRecord {
  id: number;
  student_id: number;
  period_month: number;
  period_year: number;
  amount_due: string;
  amount_paid: string;
  due_date: string;
  status: FeeStatus;
  last_paid_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface FeeRecordWithPayments extends FeeRecord {
  payments: Payment[];
}
