import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
