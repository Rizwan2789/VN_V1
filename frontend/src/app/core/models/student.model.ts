import { Batch } from './batch.model';
import { FeeStatus } from './fee-record.model';

export interface StudentListItem {
  id: number;
  roll_no: string;
  full_name: string;
  batch: Batch;
  monthly_fee_amount: string;
  current_status: FeeStatus | null;
  is_active: boolean;
}

export interface StudentListResponse {
  items: StudentListItem[];
  total: number;
}

export interface Student {
  id: number;
  user_id: number;
  roll_no: string;
  full_name: string;
  email: string | null;
  batch: Batch;
  phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  address: string | null;
  monthly_fee_amount: string;
  admission_date: string;
  is_active: boolean;
}

export interface StudentCreate {
  full_name: string;
  batch_id: number;
  email?: string;
  phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  address?: string;
  monthly_fee_amount: number;
}

export interface StudentUpdate {
  full_name: string;
  batch_id: number;
  email?: string;
  phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  address?: string;
  monthly_fee_amount: number;
}

export interface StudentCreatedResponse {
  student: Student;
  temporary_password: string;
}
