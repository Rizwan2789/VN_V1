import { UserRole } from './user.model';

export type PasswordResetRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PasswordResetRequest {
  id: number;
  user_id: number;
  full_name: string;
  login_id: string;
  email: string | null;
  requested_role: UserRole;
  status: PasswordResetRequestStatus;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface PasswordResetRequestListResponse {
  items: PasswordResetRequest[];
  total: number;
}
