import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateMachineDto,
  UpdateMachineDto,
  createMachineSchema,
  updateMachineSchema,
} from '../../shared/schemas/machine.schema';

// Legacy type aliases für Abwärtskompatibilität
type CreateMachineInput = CreateMachineDto;
type UpdateMachineInput = UpdateMachineDto;

@Injectable()
export class MachinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySerialNumber(companyId: string, serialNumber: string) {
    if (!serialNumber?.trim()) {
      return null;
    }

    console.log(
      '[Backend] Searching for serial number:',
      serialNumber.trim(),
      'in company:',
      companyId,
    );

    const result = await this.prisma.machine.findFirst({
      where: {
        companyId,
        serialNumber: {
          equals: serialNumber.trim(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        inventoryNo: true,
        designation: true,
        serialNumber: true,
      },
    });

    console.log('[Backend] Search result:', result);

    return result;
  }

  async create(companyId: string, userId: string, input: CreateMachineInput) {
    // 0) Validierung mit Zod Schema
    const validationResult = createMachineSchema.safeParse(input);
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw new BadRequestException(`Validierungsfehler: ${errors}`);
    }

    const validatedInput = validationResult.data;

    // 1) Kategorie inkl. Felder laden
    const category = await this.prisma.category.findUnique({
      where: {
        id: validatedInput.categoryId,
        companyId: companyId,
      },
      include: { fields: true },
    });

    if (!category) {
      throw new BadRequestException('Kategorie nicht gefunden.');
    }

    // 2) Inventarnummer generieren oder validieren
    let finalInventoryNo = validatedInput.inventoryNo;
    let finalInventoryMiddle = validatedInput.inventoryMiddle;

    if (category.inventoryPrefix) {
      // Automatische Generierung mit Präfix
      const prefix = category.inventoryPrefix;
      const middle = validatedInput.inventoryMiddle;

      // Höchste Nummer für diese Kategorie finden (unabhängig vom Mittelteil)
      const existingMachines = await this.prisma.machine.findMany({
        where: {
          companyId: companyId,
          categoryId: validatedInput.categoryId,
          inventoryNo: {
            startsWith: `${prefix}-`,
          },
        },
        orderBy: { inventoryNo: 'desc' },
      });

      let nextNumber = 1;
      if (existingMachines.length > 0) {
        // Finde die höchste Nummer aus allen Maschinen dieser Kategorie
        for (const machine of existingMachines) {
          const match = machine.inventoryNo.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num >= nextNumber) {
              nextNumber = num + 1;
            }
          }
        }
      }

      // Format: PREFIX-MIDDLE-XXX oder PREFIX-XXX (wenn kein Middle angegeben)
      if (middle) {
        finalInventoryNo = `${prefix}-${middle}-${nextNumber.toString().padStart(3, '0')}`;
        finalInventoryMiddle = middle;
      } else {
        finalInventoryNo = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
        finalInventoryMiddle = undefined;
      }
    } else if (!validatedInput.inventoryNo?.trim()) {
      throw new BadRequestException('Inventarnummer ist ein Pflichtfeld.');
    }

    // 3) Dynamische Felder validieren (required + options bei SELECT)
    const fieldByKey = new Map(category.fields.map((f) => [f.key, f]));
    const dynamic = validatedInput.dynamic ?? {};

    for (const field of category.fields) {
      const value = dynamic[field.key];

      if (
        field.required &&
        (value === undefined || value === null || String(value).trim() === '')
      ) {
        throw new BadRequestException(`Pflichtfeld fehlt: ${field.label}`);
      }

      if (value && field.type === 'SELECT' && field.optionsJson) {
        try {
          const options = JSON.parse(field.optionsJson) as string[];
          if (!options.includes(String(value))) {
            throw new BadRequestException(
              `Ungültiger Wert für "${field.label}". Erlaubt: ${options.join(', ')}`,
            );
          }
        } catch {
          throw new BadRequestException(
            `optionsJson ist ungültig für Feld: ${field.label}`,
          );
        }
      }
    }

    // 4) Maschine anlegen + dynamic values speichern
    console.log(
      '[Backend CREATE] Input serialNumber:',
      validatedInput.serialNumber,
    );
    const created = await this.prisma.machine.create({
      data: {
        companyId: companyId,
        ownerId: validatedInput.ownerId,
        categoryId: validatedInput.categoryId,
        inventoryNo: finalInventoryNo!,
        inventoryMiddle: finalInventoryMiddle,
        createdBy: userId,

        manufacturer: validatedInput.manufacturer,
        modelType: validatedInput.modelType,
        designation: validatedInput.designation,
        buildYear: validatedInput.buildYear,

        serialNumber: validatedInput.serialNumber,

        counterType: validatedInput.counterType,
        counterStartValue: validatedInput.counterStartValue as any,
        counterCurrent:
          validatedInput.counterCurrent !== undefined
            ? (validatedInput.counterCurrent as any)
            : undefined,

        primaryFuelType: validatedInput.primaryFuelType,
        adBlueRequired: validatedInput.adBlueRequired ?? false,

        stvzoApproved: validatedInput.stvzoApproved ?? false,
        licensePlate: validatedInput.licensePlate,

        notes: validatedInput.notes,

        dynamicValues: {
          create: Object.entries(dynamic)
            .filter(([key]) => fieldByKey.has(key))
            .map(([key, value]) => ({
              fieldId: fieldByKey.get(key)!.id,
              value: value ?? null,
            })),
        },
      },
      include: {
        dynamicValues: { include: { field: true } },
        category: true,
        owner: true,
      },
    });
    console.log(
      '[Backend CREATE] Created machine with serialNumber:',
      created.serialNumber,
    );

    return created;
  }

  async findAll(
    companyId: string,
    search?: string,
    ownerId?: string,
    categoryId?: string,
  ) {
    return this.prisma.machine.findMany({
      where: {
        companyId: companyId,
        ownerId: ownerId || undefined,
        categoryId: categoryId || undefined,
        OR: search
          ? [
              { inventoryNo: { contains: search, mode: 'insensitive' } },
              { designation: { contains: search, mode: 'insensitive' } },
              { manufacturer: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        owner: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { inventoryNo: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const machine = await this.prisma.machine.findFirst({
      where: {
        id: id,
        companyId: companyId,
      },
      include: {
        owner: true,
        category: { include: { fields: { orderBy: { sortOrder: 'asc' } } } },
        dynamicValues: { include: { field: true } },
        files: { orderBy: { uploadedAt: 'desc' } },
        maintenancePlans: { orderBy: { createdAt: 'desc' } },
        creator: { select: { firstName: true, lastName: true } },
      },
    });

    if (!machine) {
      throw new BadRequestException('Maschine nicht gefunden.');
    }

    return machine;
  }

  async update(companyId: string, id: string, input: UpdateMachineInput) {
    // 0) Validierung mit Zod Schema
    const validationResult = updateMachineSchema.safeParse(input);
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw new BadRequestException(`Validierungsfehler: ${errors}`);
    }

    const validatedInput = validationResult.data;
    const machine = await this.findOne(companyId, id);

    // Build update data
    const updateData: any = {};
    if (validatedInput.manufacturer !== undefined)
      updateData.manufacturer = validatedInput.manufacturer;
    if (validatedInput.modelType !== undefined)
      updateData.modelType = validatedInput.modelType;
    if (validatedInput.serialNumber !== undefined)
      updateData.serialNumber = validatedInput.serialNumber;
    if (validatedInput.designation !== undefined)
      updateData.designation = validatedInput.designation;
    if (validatedInput.buildYear !== undefined)
      updateData.buildYear = validatedInput.buildYear;
    if (validatedInput.counterType !== undefined)
      updateData.counterType = validatedInput.counterType;
    if (validatedInput.counterStartValue !== undefined)
      updateData.counterStartValue = validatedInput.counterStartValue as any;
    if (validatedInput.counterCurrent !== undefined)
      updateData.counterCurrent = validatedInput.counterCurrent as any;
    if (validatedInput.primaryFuelType !== undefined)
      updateData.primaryFuelType = validatedInput.primaryFuelType;
    if (validatedInput.adBlueRequired !== undefined)
      updateData.adBlueRequired = validatedInput.adBlueRequired;
    if (validatedInput.stvzoApproved !== undefined)
      updateData.stvzoApproved = validatedInput.stvzoApproved;
    if (validatedInput.licensePlate !== undefined)
      updateData.licensePlate = validatedInput.licensePlate;
    if (validatedInput.notes !== undefined)
      updateData.notes = validatedInput.notes;
    if (validatedInput.status !== undefined)
      updateData.status = validatedInput.status;
    if (validatedInput.ownerId !== undefined)
      updateData.ownerId = validatedInput.ownerId;
    if (validatedInput.categoryId !== undefined)
      updateData.categoryId = validatedInput.categoryId;
    if (validatedInput.inventoryMiddle !== undefined)
      updateData.inventoryMiddle = validatedInput.inventoryMiddle;
    if (validatedInput.inventoryNo !== undefined)
      updateData.inventoryNo = validatedInput.inventoryNo;

    // Falls dynamische Felder dabei sind, validieren
    if (validatedInput.dynamic) {
      const targetCategoryId = validatedInput.categoryId || machine.categoryId;
      const category = await this.prisma.category.findUnique({
        where: { id: targetCategoryId },
        include: { fields: true },
      });

      if (!category) {
        throw new BadRequestException('Kategorie nicht gefunden.');
      }

      for (const field of category.fields) {
        const value = validatedInput.dynamic[field.key];

        if (
          field.required &&
          (value === undefined || value === null || String(value).trim() === '')
        ) {
          throw new BadRequestException(`Pflichtfeld fehlt: ${field.label}`);
        }

        if (value && field.type === 'SELECT' && field.optionsJson) {
          try {
            const options = JSON.parse(field.optionsJson) as string[];
            if (!options.includes(String(value))) {
              throw new BadRequestException(
                `Ungültiger Wert für "${field.label}". Erlaubt: ${options.join(', ')}`,
              );
            }
          } catch {
            throw new BadRequestException(
              `optionsJson ist ungültig für Feld: ${field.label}`,
            );
          }
        }
      }
    }

    const updated = await this.prisma.machine.update({
      where: { id },
      data: updateData,
      include: {
        dynamicValues: { include: { field: true } },
        category: true,
        owner: true,
      },
    });

    // Update dynamic values wenn vorhanden
    if (validatedInput.dynamic) {
      const categoryWithFields = await this.prisma.category.findUnique({
        where: { id: updated.categoryId },
        include: { fields: true },
      });

      if (!categoryWithFields) {
        throw new BadRequestException('Kategorie nicht gefunden.');
      }

      const fieldByKeyForUpdate = new Map(
        categoryWithFields.fields.map((f) => [f.key, f]),
      );

      // Lösche alte Werte
      await this.prisma.machineFieldValue.deleteMany({
        where: {
          machineId: id,
          field: { categoryId: updated.categoryId },
        },
      });

      // Erstelle neue Werte
      await this.prisma.machineFieldValue.createMany({
        data: Object.entries(validatedInput.dynamic)
          .filter(([key]) => fieldByKeyForUpdate.has(key))
          .map(([key, value]) => ({
            machineId: id,
            fieldId: fieldByKeyForUpdate.get(key)!.id,
            value: value ?? null,
          })),
      });
    }

    return this.findOne(companyId, id);
  }

  async updateStatus(companyId: string, id: string, status: string) {
    await this.findOne(companyId, id);

    if (!['ACTIVE', 'INACTIVE', 'LOANED'].includes(status)) {
      throw new BadRequestException('Ungültiger Status.');
    }

    return this.prisma.machine.update({
      where: { id },
      data: { status: status as any },
      include: {
        owner: true,
        category: true,
      },
    });
  }

  async delete(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.machine.delete({ where: { id } });
  }

  async exportAll(companyId: string) {
    // Lade alle Kategorien mit ihren Feldern (nur eigene Company)
    const categories = await this.prisma.category.findMany({
      where: { companyId: companyId },
      include: {
        fields: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });

    // Lade alle Maschinen mit allen Beziehungen (nur eigene Company)
    const machines = await this.prisma.machine.findMany({
      where: { companyId: companyId },
      include: {
        owner: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        dynamicValues: { include: { field: true } },
      },
      orderBy: [{ categoryId: 'asc' }, { inventoryNo: 'asc' }],
    });

    // Erstelle eine Map für schnellen Zugriff auf Kategoriefelder
    const categoryFieldsMap = new Map<string, any[]>();
    categories.forEach((cat) => {
      categoryFieldsMap.set(cat.id, cat.fields);
    });

    // Gruppiere Maschinen nach Kategorien
    const machinesByCategory = new Map<string, any[]>();
    machines.forEach((machine) => {
      const categoryId = machine.categoryId;
      if (!machinesByCategory.has(categoryId)) {
        machinesByCategory.set(categoryId, []);
      }
      machinesByCategory.get(categoryId)!.push(machine);
    });

    // Erstelle Export-Daten gruppiert nach Kategorien
    const exportData = categories.map((category) => {
      const categoryMachines = machinesByCategory.get(category.id) || [];
      const fields = category.fields || [];

      return {
        categoryId: category.id,
        categoryName: category.name,
        hasEngine: category.hasEngine,
        fields: fields.map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
        })),
        machines: categoryMachines.map((machine) => {
          // Erstelle dynamische Felder-Map
          const dynamicFieldsMap = new Map<string, string | null>();
          machine.dynamicValues.forEach((dv: any) => {
            dynamicFieldsMap.set(dv.field.key, dv.value);
          });

          return {
            id: machine.id,
            inventoryNo: machine.inventoryNo,
            inventoryMiddle: machine.inventoryMiddle,
            designation: machine.designation,
            manufacturer: machine.manufacturer,
            modelType: machine.modelType,
            serialNumber: machine.serialNumber,
            buildYear: machine.buildYear,
            description: machine.description,
            status: machine.status,
            stvzoApproved: machine.stvzoApproved,
            licensePlate: machine.licensePlate,
            counterType: machine.counterType,
            counterStartValue: machine.counterStartValue,
            counterCurrent: machine.counterCurrent,
            primaryFuelType: machine.primaryFuelType,
            adBlueRequired: machine.adBlueRequired,
            notes: machine.notes,
            ownerName: machine.owner?.name || '',
            // Dynamische Felder
            dynamicFields: Object.fromEntries(
              fields.map((f) => [f.key, dynamicFieldsMap.get(f.key) || '']),
            ),
          };
        }),
      };
    });

    return exportData;
  }
}
