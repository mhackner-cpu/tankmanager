import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  active?: boolean;
  roles?: UserRole[];
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all users in company
   */
  async findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      include: {
        roles: {
          orderBy: { assignedAt: 'asc' },
        },
      },
      orderBy: [{ active: 'desc' }, { lastName: 'asc' }],
    });
  }

  /**
   * Get user by ID
   */
  async findOne(userId: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId, // Security: Only access users in same company
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    return user;
  }

  /**
   * Create user (admin only)
   */
  async create(companyId: string, dto: CreateUserDto, adminUserId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email bereits registriert');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      // Assign roles
      if (dto.roles && dto.roles.length > 0) {
        await Promise.all(
          dto.roles.map((role) =>
            tx.userRoleAssignment.create({
              data: {
                userId: user.id,
                role,
                assignedBy: adminUserId,
              },
            }),
          ),
        );
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: { roles: true },
      });
    });
  }

  /**
   * Update user (admin only)
   */
  async update(
    userId: string,
    companyId: string,
    dto: UpdateUserDto,
    adminUserId: string,
  ) {
    await this.findOne(userId, companyId);

    return this.prisma.$transaction(async (tx) => {
      // Update basic info
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          active: dto.active,
        },
      });

      // Update roles if provided
      if (dto.roles) {
        // Delete old roles
        await tx.userRoleAssignment.deleteMany({
          where: { userId },
        });

        // Create new roles
        await Promise.all(
          dto.roles.map((role) =>
            tx.userRoleAssignment.create({
              data: {
                userId,
                role,
                assignedBy: adminUserId,
              },
            }),
          ),
        );
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });
    });
  }

  /**
   * Delete user (admin only)
   */
  async delete(userId: string, companyId: string, currentUserId: string) {
    await this.findOne(userId, companyId);

    // Prevent self-deletion
    if (userId === currentUserId) {
      throw new BadRequestException('Sie können sich nicht selbst löschen');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Benutzer gelöscht' };
  }

  /**
   * Change password (user themselves or admin)
   */
  async changePassword(
    userId: string,
    companyId: string,
    dto: ChangePasswordDto,
    currentUserId: string,
  ) {
    await this.findOne(userId, companyId);

    // If changing own password, verify current password
    if (userId === currentUserId) {
      const fullUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      const isValid = await bcrypt.compare(
        dto.currentPassword,
        fullUser!.passwordHash,
      );

      if (!isValid) {
        throw new BadRequestException('Aktuelles Passwort falsch');
      }
    }
    // Else: admin changing password, no verification needed

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Passwort geändert' };
  }

  /**
   * Reset password (admin only - sets new password without verification)
   */
  async resetPassword(userId: string, companyId: string, newPassword: string) {
    await this.findOne(userId, companyId);

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Passwort zurückgesetzt', tempPassword: newPassword };
  }
}
