import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHashingService {
  constructor(private readonly config: ConfigService) {}

  private get saltRounds(): number {
    const r = this.config.get<number>('app.password.bcryptRounds');
    return typeof r === 'number' && Number.isFinite(r) ? r : 12;
  }

  // plainPassword is the password that the user enters
  async hash(plainPassword: string): Promise<string> {
    const plain = plainPassword?.trim();
    if (!plain) {
      throw new Error('Password is required for hashing');
    }
    return bcrypt.hash(plain, this.saltRounds);
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    const plain = plainPassword?.trim();
    if (!plain || !passwordHash?.trim()) {
      return false;
    }
    try {
      return await bcrypt.compare(plain, passwordHash);
    } catch {
      return false;
    }
  }
}
