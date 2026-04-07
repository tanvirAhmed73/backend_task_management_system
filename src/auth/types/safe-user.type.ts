import type { AuthUserRole } from './auth-user-role.type';

/** User fields safe to return from APIs (no password hash). */
export interface SafeUser {
  id: string;
  email: string;
  role: AuthUserRole;
  name: string | null;
}
