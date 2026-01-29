import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    InvitationsModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'tankmanager-secret-change-in-production',
      signOptions: { expiresIn: '7d' }, // Token 7 Tage gültig
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
