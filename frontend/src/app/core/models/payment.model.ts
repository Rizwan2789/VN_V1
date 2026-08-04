export interface Payment {
  id: number;
  fee_record_id: number;
  amount: string;
  payment_date: string;
  payment_method: string | null;
  transaction_notes: string | null;
  receipt_number: string;
  created_at: string;
}

export interface PaymentCreate {
  amount: number;
  payment_date?: string;
  payment_method?: string;
  transaction_notes?: string;
}
