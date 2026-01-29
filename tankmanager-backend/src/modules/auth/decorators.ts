import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.guard';

/**
 * @Roles() Decorator
 * Usage: @Roles(UserRole.ADMIN, UserRole.MANAGEMENT)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * @CurrentUser() Decorator
 * Gets current authenticated user from request
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
