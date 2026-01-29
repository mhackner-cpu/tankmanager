import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  createCategorySchema,
  updateCategorySchema,
} from '../../shared/schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, input: CreateCategoryDto) {
    // 0) Validierung mit Zod Schema
    const validationResult = createCategorySchema.safeParse(input);
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw new BadRequestException(`Validierungsfehler: ${errors}`);
    }

    const validatedInput = validationResult.data;

    // Validate unique prefix
    if (validatedInput.inventoryPrefix) {
      const existing = await this.prisma.category.findFirst({
        where: {
          companyId,
          inventoryPrefix: validatedInput.inventoryPrefix.trim().toUpperCase(),
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Präfix "${validatedInput.inventoryPrefix}" wird bereits von Kategorie "${existing.name}" verwendet`,
        );
      }
    }

    return this.prisma.category.create({
      data: {
        companyId,
        name: validatedInput.name,
        hasEngine: validatedInput.hasEngine ?? true,
        inventoryPrefix: validatedInput.inventoryPrefix
          ? validatedInput.inventoryPrefix.trim().toUpperCase()
          : null,
        inventoryMiddleHint: validatedInput.inventoryMiddleHint?.trim() || null,
      },
    });
  }

  findAll(companyId: string) {
    return this.prisma.category.findMany({
      where: { companyId: companyId },
      orderBy: { name: 'asc' },
    });
  }

  findOne(companyId: string, id: string) {
    return this.prisma.category.findFirst({
      where: {
        id: id,
        companyId: companyId,
      },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async update(companyId: string, id: string, input: UpdateCategoryDto) {
    // 0) Validierung mit Zod Schema
    const validationResult = updateCategorySchema.safeParse(input);
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw new BadRequestException(`Validierungsfehler: ${errors}`);
    }

    const validatedInput = validationResult.data;

    // Validate unique prefix if changing it
    if (validatedInput.inventoryPrefix !== undefined) {
      const normalized = validatedInput.inventoryPrefix
        ? validatedInput.inventoryPrefix.trim().toUpperCase()
        : undefined;
      if (normalized) {
        const existing = await this.prisma.category.findFirst({
          where: {
            companyId,
            inventoryPrefix: normalized,
            id: { not: id },
          },
        });
        if (existing) {
          throw new BadRequestException(
            `Präfix "${normalized}" wird bereits von Kategorie "${existing.name}" verwendet`,
          );
        }
      }
      validatedInput.inventoryPrefix = normalized;
    }

    return this.prisma.category.update({
      where: {
        id: id,
        companyId: companyId,
      },
      data: {
        name: validatedInput.name,
        inventoryPrefix: validatedInput.inventoryPrefix,
        inventoryMiddleHint: validatedInput.inventoryMiddleHint,
        hasEngine: validatedInput.hasEngine,
        // fields wird separat gehandhabt, nicht direkt updaten
      },
    });
  }

  delete(companyId: string, id: string) {
    return this.prisma.category.delete({
      where: {
        id: id,
        companyId: companyId,
      },
    });
  }

  async getNextInventoryNumber(
    companyId: string,
    categoryId: string,
  ): Promise<number> {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        companyId: companyId,
      },
    });

    if (!category || !category.inventoryPrefix) {
      return 1;
    }

    // Finde alle Maschinen dieser Kategorie mit dem Präfix
    const machines = await this.prisma.machine.findMany({
      where: {
        companyId: companyId,
        categoryId,
        inventoryNo: {
          startsWith: `${category.inventoryPrefix}-`,
        },
      },
      select: { inventoryNo: true },
    });

    let maxNumber = 0;
    for (const machine of machines) {
      const match = machine.inventoryNo.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    return maxNumber + 1;
  }
}
