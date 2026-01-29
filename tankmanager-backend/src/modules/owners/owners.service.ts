import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, name: string, notes?: string) {
    try {
      return await this.prisma.owner.create({
        data: {
          companyId,
          name,
          notes,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Ein Betrieb mit diesem Namen existiert bereits.',
        );
      }
      throw error;
    }
  }

  findAll(companyId: string) {
    return this.prisma.owner.findMany({
      where: { companyId: companyId },
      orderBy: { name: 'asc' },
    });
  }

  update(
    companyId: string,
    id: string,
    data: { name?: string; notes?: string },
  ) {
    return this.prisma.owner.update({
      where: {
        id: id,
        companyId: companyId,
      },
      data,
    });
  }

  delete(companyId: string, id: string) {
    return this.prisma.owner.delete({
      where: {
        id: id,
        companyId: companyId,
      },
    });
  }
}
