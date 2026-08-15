import { Batch } from './batch.model';

export type SignupRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SignupRequestCreate {
  full_name: string;
  requested_batch_id: number;
  email: string;
  phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  address?: string;
}

export interface SignupRequestApprove {
  batch_id: number;
  monthly_fee_amount: number;
  admission_date?: string;
}

export interface SignupRequest {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  address: string | null;
  requested_batch: Batch;
  monthly_fee_amount: string | null;
  status: SignupRequestStatus;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface SignupRequestListResponse {
  items: SignupRequest[];
  total: number;
}
