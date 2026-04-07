import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { SafeUser } from '../types/safe-user.type';

/** Row shape for JWT validation query (explicit so tooling does not rely on a broken Prisma delegate stub). */
type JwtValidationUserRow = {
  id: string;
  email: string;
  role: string;
  name: string | null;
  deleted_at: Date | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('app.jwt.secret');
    if (!secret?.trim()) {
      throw new Error('JWT_SECRET is missing or empty.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Runs after the JWT signature and expiry are verified.
   * Re-loads the user so revoked soft-deletes and role changes are respected.
   */
  async validate(payload: JwtPayload): Promise<SafeUser> {
    const row: JwtValidationUserRow | null = await (
      this.prisma.user as unknown as {
        findUnique(args: {
          where: { id: string };
          select: Record<string, boolean>;
        }): Promise<JwtValidationUserRow | null>;
      }
    ).findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        deleted_at: true,
      },
    });
    if (!row || row.deleted_at !== null) {
      throw new UnauthorizedException();
    }
    if (row.role !== payload.role) {
      throw new UnauthorizedException();
    }
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      name: row.name,
    };
  }
}
