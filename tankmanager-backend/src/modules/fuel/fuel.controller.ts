import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { FuelType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';

@Controller('fuel-entries')
@UseGuards(JwtAuthGuard)
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body()
    body: {
      machineId: string;
      dateTime: string;
      userName: string;
      fuelType: FuelType;
      liters: number;
      counterValue?: number;
      note?: string;
    },
  ) {
    return this.fuelService.create(user.companyId, body);
  }

  // letzte Tankung einer Maschine
  @Get('last')
  last(
    @CurrentUser() user: CurrentUserData,
    @Query('machineId') machineId: string,
  ) {
    return this.fuelService.last(user.companyId, machineId);
  }

  // Tankhistorie einer Maschine
  @Get()
  list(
    @CurrentUser() user: CurrentUserData,
    @Query('machineId') machineId: string,
  ) {
    return this.fuelService.list(user.companyId, machineId);
  }
}
