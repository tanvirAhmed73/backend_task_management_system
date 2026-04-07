import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import type { AuthUserRole } from '../types/auth-user-role.type';
import { Roles } from './roles.decorator';

/**
 * JWT auth + role check + OpenAPI bearer + 401/403 responses.
 * Use on controllers/handlers that need `JwtAuthGuard` and `RolesGuard`.
 */
export function AuthRoles(...roles: AuthUserRole[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(...roles),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' }),
    ApiForbiddenResponse({ description: 'Insufficient role for this action' }),
  );
}
