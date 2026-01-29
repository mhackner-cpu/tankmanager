import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Controller('companies')
export class CompaniesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.company.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
