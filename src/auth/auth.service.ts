import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { PasswordHashingService } from './password-hashing.service';
import type { SafeUser } from './types/safe-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordHashingService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Loads an active (non-deleted) user and verifies the password.
   * Same error path for unknown email and bad password (no user enumeration).
   */
  async validateUser(
    email: string,
    plainPassword: string,
  ): Promise<SafeUser | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deleted_at: null,
      },
    });
    if (!user) {
      return null;
    }
    const ok = await this.passwords.verify(plainPassword, user.password_hash);
    if (!ok) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; user: SafeUser }> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token, user };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
      select: { id: true, password_hash: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const ok = await this.passwords.verify(currentPassword, user.password_hash);
    if (!ok) {
      throw new BadRequestException('Current password is incorrect');
    }
    const password_hash = await this.passwords.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });
  }
}
