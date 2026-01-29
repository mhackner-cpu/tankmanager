import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MachinesService } from './machines.service';
import { CounterType, FuelType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';

@Controller('machines')
@UseGuards(JwtAuthGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body()
    body: {
      ownerId: string;
      categoryId: string;
      inventoryNo?: string;
      inventoryMiddle?: string;
      designation: string;

      manufacturer?: string;
      modelType?: string;
      buildYear?: number;

      counterType: CounterType;
      counterStartValue: number;
      counterCurrent?: number;

      primaryFuelType?: FuelType;
      adBlueRequired?: boolean;

      stvzoApproved?: boolean;
      licensePlate?: string;

      notes?: string;

      dynamic?: Record<string, string | null>;
    },
  ) {
    return this.machinesService.create(user.companyId, user.id, body);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('search') search?: string,
    @Query('ownerId') ownerId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.machinesService.findAll(
      user.companyId,
      search,
      ownerId,
      categoryId,
    );
  }

  @Get('export/all')
  exportAll(@CurrentUser() user: CurrentUserData) {
    return this.machinesService.exportAll(user.companyId);
  }

  @Get('check-serial/:serialNumber')
  checkSerialNumber(
    @CurrentUser() user: CurrentUserData,
    @Param('serialNumber') serialNumber: string,
  ) {
    return this.machinesService.findBySerialNumber(
      user.companyId,
      serialNumber,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.machinesService.findOne(user.companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.machinesService.update(user.companyId, id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.machinesService.updateStatus(user.companyId, id, status);
  }

  @Delete(':id')
  delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.machinesService.delete(user.companyId, id);
  }
}
