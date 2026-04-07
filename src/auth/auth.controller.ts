import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthRoles } from './decorators/auth-roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthUserViewDto, LoginResponseDto } from './dto/login-response.dto';
import type { SafeUser } from './types/safe-user.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Obtain JWT access token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(dto);
  }

  /**
   * Stateless API: no server session. Clients delete the stored JWT after this call.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Signal logout (client discards JWT)',
    description:
      'No body and no server-side session. Remove the token on the client (and revoke refresh tokens if you add them later).',
  })
  @ApiNoContentResponse({ description: 'Acknowledged' })
  logout(): void {
    return;
  }

  @Get('me')
  @AuthRoles('ADMIN', 'USER')
  @ApiOperation({ summary: 'Current user from JWT (any authenticated role)' })
  @ApiResponse({ status: 200, type: AuthUserViewDto })
  me(@CurrentUser() user: SafeUser): AuthUserViewDto {
    return user;
  }
}
