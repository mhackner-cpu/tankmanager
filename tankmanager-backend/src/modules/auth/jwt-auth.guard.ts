import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 * Protects routes - requires valid JWT token
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
