import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UserRole } from '@prisma/client';

interface CreateInvitationDto {
  email: string;
  firstName?: string;
  lastName?: string;
  roles: UserRole[];
}

interface AcceptInvitationDto {
  firstName: string;
  lastName: string;
  password: string;
}

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  // Admin erstellt Einladung
  async create(
    companyId: string,
    adminUserId: string,
    dto: CreateInvitationDto,
  ) {
    // Prüfen ob Email schon existiert
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Ein Benutzer mit dieser Email existiert bereits',
      );
    }

    // Prüfen ob bereits eine offene Einladung existiert
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: dto.email,
        companyId,
        used: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'Für diese Email existiert bereits eine offene Einladung',
      );
    }

    // Einladung mit Ablaufdatum in 7 Tagen erstellen
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.invitation.create({
      data: {
        companyId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roles: JSON.stringify(dto.roles),
        expiresAt,
        invitedBy: adminUserId,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    return invitation;
  }

  // Alle Einladungen einer Company auflisten
  async findAll(companyId: string) {
    return this.prisma.invitation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  // Einladung anhand Token finden
  async findByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Einladung nicht gefunden');
    }

    if (invitation.used) {
      throw new BadRequestException('Diese Einladung wurde bereits verwendet');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Diese Einladung ist abgelaufen');
    }

    return invitation;
  }

  // Einladung annehmen und User erstellen
  async accept(token: string, dto: AcceptInvitationDto) {
    const invitation = await this.findByToken(token);

    // Prüfen ob Email bereits existiert
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Ein Benutzer mit dieser Email existiert bereits',
      );
    }

    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // User erstellen und Einladung als verwendet markieren in Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // User erstellen
      const user = await tx.user.create({
        data: {
          companyId: invitation.companyId,
          email: invitation.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          active: true,
        },
      });

      // Rollen zuweisen
      const roles = JSON.parse(invitation.roles) as UserRole[];
      await Promise.all(
        roles.map((role) =>
          tx.userRoleAssignment.create({
            data: {
              userId: user.id,
              role,
              assignedBy: invitation.invitedBy,
            },
          }),
        ),
      );

      // Einladung als verwendet markieren
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });

      // User mit Rollen zurückgeben
      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          roles: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    return result;
  }

  // Einladung widerrufen (nur wenn noch nicht verwendet)
  async revoke(invitationId: string, companyId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        companyId,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Einladung nicht gefunden');
    }

    if (invitation.used) {
      throw new BadRequestException('Diese Einladung wurde bereits verwendet');
    }

    await this.prisma.invitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Einladung widerrufen' };
  }

  // Einladung erneut senden (neues Token)
  async resend(invitationId: string, companyId: string) {
    const oldInvitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        companyId,
      },
    });

    if (!oldInvitation) {
      throw new NotFoundException('Einladung nicht gefunden');
    }

    if (oldInvitation.used) {
      throw new BadRequestException('Diese Einladung wurde bereits verwendet');
    }

    // Neues Ablaufdatum in 7 Tagen
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Alte Einladung löschen und neue erstellen
    await this.prisma.invitation.delete({
      where: { id: invitationId },
    });

    const newInvitation = await this.prisma.invitation.create({
      data: {
        companyId: oldInvitation.companyId,
        email: oldInvitation.email,
        firstName: oldInvitation.firstName,
        lastName: oldInvitation.lastName,
        roles: oldInvitation.roles,
        expiresAt,
        invitedBy: oldInvitation.invitedBy,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    return newInvitation;
  }
}
