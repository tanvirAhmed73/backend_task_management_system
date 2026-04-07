import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PasswordHashingService } from './password-hashing.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const secret = config.get<string>('app.jwt.secret');
        if (!secret?.trim()) {
          throw new Error(
            'JWT_SECRET is missing or empty. Set it in the environment (e.g. .env).',
          );
        }
        const expiresIn = config.get<string>('app.jwt.accessExpiresIn');
        const signOptions: SignOptions = {
          expiresIn: (expiresIn ?? '15m') as SignOptions['expiresIn'],
        };
        return {
          secret,
          signOptions,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    PasswordHashingService,
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    JwtModule,
    PassportModule,
    PasswordHashingService,
    AuthService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
