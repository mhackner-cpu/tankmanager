import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators';
import { CurrentUser } from '../auth/decorators';
import { UserRole } from '@prisma/client';

@Controller('invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // Admin erstellt Einladung
  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @CurrentUser() user: any,
    @Body()
    dto: {
      email: string;
      firstName?: string;
      lastName?: string;
      roles: UserRole[];
    },
  ) {
    return this.invitationsService.create(user.companyId, user.id, dto);
  }

  // Alle Einladungen der Company auflisten
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@CurrentUser() user: any) {
    return this.invitationsService.findAll(user.companyId);
  }

  // Einladung widerrufen
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invitationsService.revoke(id, user.companyId);
  }

  // Einladung erneut senden
  @Post(':id/resend')
  @Roles(UserRole.ADMIN)
  resend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invitationsService.resend(id, user.companyId);
  }
}
