export type UserRole = 'coordinator' | 'student' | 'admin';

export interface AuthUser {
  role: UserRole;
  fullName: string;
  studentId: number | null;
}

export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  coordinator: '/coordinator/dashboard',
  student: '/student/portal',
  admin: '/admin/dashboard',
};
