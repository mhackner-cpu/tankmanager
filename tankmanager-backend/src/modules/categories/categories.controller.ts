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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../shared/schemas/category.schema';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() body: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.companyId, body);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.categoriesService.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.categoriesService.findOne(user.companyId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.companyId, id, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.categoriesService.delete(user.companyId, id);
  }

  @Get(':id/next-inventory-number')
  getNextInventoryNumber(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.categoriesService.getNextInventoryNumber(user.companyId, id);
  }
}
