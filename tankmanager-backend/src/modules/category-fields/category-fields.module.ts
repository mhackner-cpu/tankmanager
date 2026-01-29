import { Module } from '@nestjs/common';
import { CategoryFieldsController } from './category-fields.controller';
import { CategoryFieldsService } from './category-fields.service';

@Module({
  controllers: [CategoryFieldsController],
  providers: [CategoryFieldsService],
})
export class CategoryFieldsModule {}
