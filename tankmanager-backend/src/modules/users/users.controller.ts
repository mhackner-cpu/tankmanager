import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
} from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /users
   * Get all users in company (admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.companyId);
  }

  /**
   * GET /users/:id
   * Get specific user (admin only)
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user.companyId);
  }

  /**
   * POST /users
   * Create new user (admin only)
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(user.companyId, dto, user.id);
  }

  /**
   * PUT /users/:id
   * Update user (admin only)
   */
  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, user.companyId, dto, user.id);
  }

  /**
   * DELETE /users/:id
   * Delete user (admin only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.delete(id, user.companyId, user.id);
  }

  /**
   * POST /users/:id/change-password
   * Change password (user themselves or admin)
   */
  @Post(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.changePassword(id, user.companyId, dto, user.id);
  }

  /**
   * POST /users/:id/reset-password
   * Reset password (admin only - generates new temp password)
   */
  @Post(':id/reset-password')
  @Roles(UserRole.ADMIN)
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @CurrentUser() user: any,
  ) {
    return this.usersService.resetPassword(
      id,
      user.companyId,
      body.newPassword,
    );
  }
}
