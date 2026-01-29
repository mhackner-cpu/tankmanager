import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  roles: UserRole[];
}

export interface RegisterDto {
  // Company data
  companyName: string;
  companyEmail?: string;
  companyDomain?: string;

  // Admin user data
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyId: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: UserRole[];
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Company Registration: Creates company + admin user
   */
  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email bereits registriert');
    }

    // Check if company name exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { name: dto.companyName },
    });

    if (existingCompany) {
      throw new BadRequestException('Firmenname bereits vergeben');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create company with admin user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          email: dto.companyEmail,
          domain: dto.companyDomain,
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      // Assign ADMIN role
      await tx.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: UserRole.ADMIN,
        },
      });

      return { company, user };
    });

    // Generate JWT
    const token = this.generateToken(
      result.user.id,
      result.user.email,
      result.company.id,
      [UserRole.ADMIN],
    );

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        roles: [UserRole.ADMIN],
      },
      company: {
        id: result.company.id,
        name: result.company.name,
      },
    };
  }

  /**
   * User Registration for existing company
   */
  async registerUser(dto: RegisterUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email bereits registriert');
    }

    // Verify company exists and is active
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });

    if (!company) {
      throw new BadRequestException('Unternehmen nicht gefunden');
    }

    if (!company.active) {
      throw new BadRequestException('Unternehmen ist deaktiviert');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user with VIEWER role (default for self-registration)
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId: dto.companyId,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      // Assign default VIEWER role
      await tx.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: UserRole.VIEWER,
        },
      });

      return user;
    });

    // Generate JWT
    const token = this.generateToken(result.id, result.email, company.id, [
      UserRole.VIEWER,
    ]);

    return {
      token,
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        roles: [UserRole.VIEWER],
      },
      company: {
        id: company.id,
        name: company.name,
      },
    };
  }

  /**
   * User Login
   */
  async login(dto: LoginDto) {
    // Find user with roles
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: true,
        company: true,
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    // Check if company is active
    if (!user.company.active) {
      throw new UnauthorizedException('Firmenlizenz abgelaufen');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Extract roles
    const roles = user.roles.map((r) => r.role);

    // Generate JWT
    const token = this.generateToken(
      user.id,
      user.email,
      user.companyId,
      roles,
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
      company: {
        id: user.company.id,
        name: user.company.name,
      },
    };
  }

  /**
   * Validate JWT payload (called by JwtStrategy)
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: true,
        company: true,
      },
    });

    if (!user || !user.active || !user.company.active) {
      throw new UnauthorizedException('User nicht aktiv');
    }

    return {
      ...user,
      roles: user.roles.map((r) => r.role),
    };
  }

  /**
   * Create user by admin
   */
  async createUser(companyId: string, dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email bereits registriert');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          companyId,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      // Assign roles
      await Promise.all(
        dto.roles.map((role) =>
          tx.userRoleAssignment.create({
            data: {
              userId: newUser.id,
              role,
            },
          }),
        ),
      );

      return newUser;
    });

    return user;
  }

  /**
   * Generate JWT token
   */
  generateToken(
    userId: string,
    email: string,
    companyId: string,
    roles: UserRole[],
  ): string {
    const payload: JwtPayload = {
      userId,
      email,
      companyId,
      roles,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Forgot Password: Generate reset token and send email
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      // Security: Don't reveal if email exists
      return {
        message: 'Falls die Email existiert, wurde ein Reset-Link gesendet.',
      };
    }

    // Delete old unused tokens
    await this.prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Create new reset token (1 hour expiry)
    const resetToken = await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send email with reset link
    // For now, just log the token (in production, send email)
    console.log(
      `Password reset link: http://localhost:3000/auth/reset-password/${resetToken.token}`,
    );

    return {
      message: 'Falls die Email existiert, wurde ein Reset-Link gesendet.',
    };
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(token: string) {
    const resetToken = await this.prisma.passwordReset.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Ungültiger oder abgelaufener Reset-Token');
    }

    return {
      email: resetToken.user.email,
      firstName: resetToken.user.firstName,
      lastName: resetToken.user.lastName,
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordReset.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            roles: true,
            company: true,
          },
        },
      },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Ungültiger oder abgelaufener Reset-Token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Generate JWT for auto-login
    const roles = resetToken.user.roles.map((r) => r.role);
    const jwtToken = this.generateToken(
      resetToken.user.id,
      resetToken.user.email,
      resetToken.user.companyId,
      roles,
    );

    return {
      token: jwtToken,
      user: {
        id: resetToken.user.id,
        email: resetToken.user.email,
        firstName: resetToken.user.firstName,
        lastName: resetToken.user.lastName,
        roles,
      },
      company: {
        id: resetToken.user.company.id,
        name: resetToken.user.company.name,
      },
    };
  }
}
