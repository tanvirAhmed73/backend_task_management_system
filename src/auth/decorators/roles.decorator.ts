import { SetMetadata } from '@nestjs/common';
import type { AuthUserRole } from '../types/auth-user-role.type';

export const ROLES_KEY = 'roles';

/** Restrict a route to one or more roles (use with `JwtAuthGuard` + `RolesGuard`). */
export const Roles = (...roles: AuthUserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
