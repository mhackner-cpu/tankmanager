import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FuelType } from '@prisma/client';

type CreateFuelEntryInput = {
  machineId: string;
  dateTime: string;
  userName: string;
  fuelType: FuelType;
  liters: number;
  counterValue?: number;
  note?: string;
};

@Injectable()
export class FuelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, input: CreateFuelEntryInput) {
    // 1) Maschine laden mit Company-Check
    const machine = await this.prisma.machine.findFirst({
      where: {
        id: input.machineId,
        companyId: companyId,
      },
    });

    if (!machine) {
      throw new BadRequestException('Maschine nicht gefunden.');
    }

    // 2) Liter prüfen (hart blockierend)
    if (input.liters <= 0) {
      throw new BadRequestException('Getankte Liter müssen größer als 0 sein.');
    }

    if (
      (input.fuelType === 'DIESEL' || input.fuelType === 'GASOLINE') &&
      input.liters > 2000
    ) {
      throw new BadRequestException('Unplausible Menge Kraftstoff (> 2000 L).');
    }

    // 3) Zählerlogik
    if (machine.counterType !== 'NONE') {
      if (input.counterValue === undefined || input.counterValue === null) {
        throw new BadRequestException(
          'Zählerstand ist für diese Maschine erforderlich.',
        );
      }

      // letzte Tankung holen
      const lastEntry = await this.prisma.fuelEntry.findFirst({
        where: { machineId: machine.id },
        orderBy: { dateTime: 'desc' },
      });

      if (
        lastEntry?.counterValue !== null &&
        lastEntry?.counterValue !== undefined &&
        input.counterValue < Number(lastEntry.counterValue)
      ) {
        throw new BadRequestException(
          `Zählerstand kleiner als bei letzter Tankung (letzter: ${lastEntry.counterValue}).`,
        );
      }
    }

    // 4) Tankung speichern
    return this.prisma.fuelEntry.create({
      data: {
        machineId: machine.id,
        dateTime: new Date(input.dateTime),
        userName: input.userName,
        fuelType: input.fuelType,
        liters: input.liters as any,
        counterValue:
          input.counterValue !== undefined
            ? (input.counterValue as any)
            : undefined,
        note: input.note,
      },
    });
  }

  async last(companyId: string, machineId: string) {
    // Prüfe ob Maschine zur Company gehört
    const machine = await this.prisma.machine.findFirst({
      where: {
        id: machineId,
        companyId: companyId,
      },
    });

    if (!machine) {
      return null;
    }

    return this.prisma.fuelEntry.findFirst({
      where: { machineId },
      orderBy: { dateTime: 'desc' },
    });
  }

  async list(companyId: string, machineId: string) {
    // Prüfe ob Maschine zur Company gehört
    const machine = await this.prisma.machine.findFirst({
      where: {
        id: machineId,
        companyId: companyId,
      },
    });

    if (!machine) {
      return [];
    }

    return this.prisma.fuelEntry.findMany({
      where: { machineId },
      orderBy: { dateTime: 'desc' },
      take: 200,
    });
  }
}
