import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PasswordHashingService } from '../auth/password-hashing.service';
import type { SafeUser } from '../auth/types/safe-user.type';
import { EmailJobsService } from '../mail/email-jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordHashingService,
    private readonly emailJobs: EmailJobsService,
  ) {}

  async createByAdmin(
    dto: CreateUserDto,
    invitedBy: { email: string; name: string | null },
  ): Promise<SafeUser> {
    const password_hash = await this.passwords.hash(dto.password);
    const role = dto.role ?? 'USER';

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password_hash,
          name: dto.name ?? null,
          role,
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
        },
      });
      void this.emailJobs.enqueueWelcomeCredentials({
        toEmail: user.email,
        recipientName: user.name,
        loginEmail: user.email,
        temporaryPassword: dto.password,
        invitedByName: invitedBy.name,
        invitedByEmail: invitedBy.email,
      });
      return {
        id: user.id,
        email: user.email,
        role: user.role as SafeUser['role'],
        name: user.name,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('A user with this email already exists');
      }
      throw e;
    }
  }

  /** Active users only; for admin assignee pickers and similar. */
  async findAllActiveForAdmin(): Promise<SafeUser[]> {
    const rows = await this.prisma.user.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role as SafeUser['role'],
      name: u.name,
    }));
  }
}
