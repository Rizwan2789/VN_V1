export type UserRole = 'coordinator' | 'student';

export interface AuthUser {
  role: UserRole;
  fullName: string;
  studentId: number | null;
}
