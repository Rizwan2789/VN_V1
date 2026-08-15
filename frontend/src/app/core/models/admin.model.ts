import { UserRole } from './user.model';

export interface AdminUserListItem {
  id: number;
  login_id: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AdminUserListResponse {
  items: AdminUserListItem[];
  total: number;
}

export interface AdminDashboardCounts {
  coordinator_count: number;
  student_count: number;
  pending_signup_count: number;
  pending_reset_count: number;
}
