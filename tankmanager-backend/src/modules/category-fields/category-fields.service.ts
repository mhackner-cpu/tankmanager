import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CategoryFieldType } from '@prisma/client';

@Injectable()
export class CategoryFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    data: {
      categoryId: string;
      key: string;
      label: string;
      type: CategoryFieldType;
      required?: boolean;
      optionsJson?: string;
      sortOrder?: number;
    },
  ) {
    // Prüfe ob die Kategorie zur Company gehört
    const category = await this.prisma.category.findFirst({
      where: {
        id: data.categoryId,
        companyId: companyId,
      },
    });

    if (!category) {
      throw new BadRequestException('Kategorie nicht gefunden.');
    }

    return this.prisma.categoryField.create({
      data: {
        categoryId: data.categoryId,
        key: data.key,
        label: data.label,
        type: data.type,
        required: data.required ?? false,
        optionsJson: data.optionsJson,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async findByCategory(companyId: string, categoryId: string) {
    // Prüfe ob die Kategorie zur Company gehört
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        companyId: companyId,
      },
    });

    if (!category) {
      return [];
    }

    return this.prisma.categoryField.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async delete(companyId: string, id: string) {
    // Prüfe ob das Feld in Verwendung ist
    const field = await this.prisma.categoryField.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!field) {
      throw new BadRequestException('Feld nicht gefunden.');
    }

    // Prüfe ob die Kategorie zur Company gehört
    if (field.category.companyId !== companyId) {
      throw new BadRequestException('Feld nicht gefunden.');
    }

    // Zähle wie viele Maschinen dieses Feld verwenden
    const usageCount = await this.prisma.machineFieldValue.count({
      where: { fieldId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        `Löschen nicht möglich: Feld wird von ${usageCount} Maschine(n) verwendet.`,
      );
    }

    return this.prisma.categoryField.delete({
      where: { id },
    });
  }
}
