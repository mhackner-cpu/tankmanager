import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OwnersService } from './owners.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';

@Controller('owners')
@UseGuards(JwtAuthGuard)
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { name: string; notes?: string },
  ) {
    return this.ownersService.create(user.companyId, body.name, body.notes);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.ownersService.findAll(user.companyId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { name?: string; notes?: string },
  ) {
    return this.ownersService.update(user.companyId, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.ownersService.delete(user.companyId, id);
  }
}
