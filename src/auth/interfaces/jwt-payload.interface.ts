import type { AuthUserRole } from '../types/auth-user-role.type';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AuthUserRole;
}
