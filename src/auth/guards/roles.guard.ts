import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUserRole } from '../types/auth-user-role.type';
import type { SafeUser } from '../types/safe-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AuthUserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: SafeUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException();
    }
    const role = user.role;
    if (!required.includes(role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
