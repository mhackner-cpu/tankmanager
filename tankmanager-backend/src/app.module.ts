import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { OwnersModule } from './modules/owners/owners.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CategoryFieldsModule } from './modules/category-fields/category-fields.module';
import { MachinesModule } from './modules/machines/machines.module';
import { FuelModule } from './modules/fuel/fuel.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    InvitationsModule,
    CompaniesModule,
    OwnersModule,
    CategoriesModule,
    CategoryFieldsModule,
    MachinesModule,
    FuelModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
