import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoryFieldsService } from './category-fields.service';
import { CategoryFieldType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';

@Controller('category-fields')
@UseGuards(JwtAuthGuard)
export class CategoryFieldsController {
  constructor(private readonly categoryFieldsService: CategoryFieldsService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body()
    body: {
      categoryId: string;
      key: string;
      label: string;
      type: CategoryFieldType;
      required?: boolean;
      optionsJson?: string;
      sortOrder?: number;
    },
  ) {
    return this.categoryFieldsService.create(user.companyId, body);
  }

  @Get()
  findByCategory(
    @CurrentUser() user: CurrentUserData,
    @Query('categoryId') categoryId: string,
  ) {
    return this.categoryFieldsService.findByCategory(
      user.companyId,
      categoryId,
    );
  }

  @Delete()
  delete(@CurrentUser() user: CurrentUserData, @Query('id') id: string) {
    return this.categoryFieldsService.delete(user.companyId, id);
  }
}
