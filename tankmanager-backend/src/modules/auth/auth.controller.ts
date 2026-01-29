import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { InvitationsService } from '../invitations/invitations.service';
import type { RegisterDto, LoginDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private invitationsService: InvitationsService,
  ) {}

  /**
   * POST /auth/register
   * Register new company with admin user
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * GET /auth/invite/:token
   * Validate invitation token and get details (public)
   */
  @Get('invite/:token')
  async getInvitation(@Param('token') token: string) {
    return this.invitationsService.findByToken(token);
  }

  /**
   * POST /auth/invite/:token/accept
   * Accept invitation and create user account (public)
   */
  @Post('invite/:token/accept')
  async acceptInvitation(
    @Param('token') token: string,
    @Body() dto: { firstName: string; lastName: string; password: string },
  ) {
    const user = await this.invitationsService.accept(token, dto);

    if (!user) {
      throw new Error('User creation failed');
    }

    // JWT Token generieren für direkten Login
    const roles = user.roles.map((r) => r.role);
    const token_jwt = await this.authService.generateToken(
      user.id,
      user.email,
      user.companyId,
      roles,
    );

    return {
      token: token_jwt,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        companyName: user.company?.name || '',
        roles,
      },
    };
  }

  /**
   * POST /auth/login
   * User login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/forgot-password
   * Request password reset (public)
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: { email: string }) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * GET /auth/reset-password/:token
   * Verify password reset token (public)
   */
  @Get('reset-password/:token')
  async verifyResetToken(@Param('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  /**
   * POST /auth/reset-password/:token
   * Reset password with token (public)
   */
  @Post('reset-password/:token')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('token') token: string,
    @Body() dto: { password: string },
  ) {
    return this.authService.resetPassword(token, dto.password);
  }
}
