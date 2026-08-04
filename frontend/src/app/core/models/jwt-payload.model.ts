import { UserRole } from './user.model';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  student_id?: number;
  exp: number;
}
