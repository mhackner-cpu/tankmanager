import { z } from 'zod';
import { CounterType, FuelType, MachineStatus } from '@prisma/client';

// Zod Schema für Machine Creation
export const createMachineSchema = z.object({
  ownerId: z.string().uuid('Besitzer muss eine gültige UUID sein'),
  categoryId: z.string().uuid('Kategorie muss eine gültige UUID sein'),

  inventoryNo: z.string().optional(),
  inventoryMiddle: z.string().optional(),

  designation: z
    .string()
    .min(1, 'Bezeichnung ist ein Pflichtfeld')
    .max(200, 'Bezeichnung darf maximal 200 Zeichen lang sein'),

  manufacturer: z.string().max(100).optional(),
  modelType: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  buildYear: z.number().int().min(1900).max(2100).optional(),

  counterType: z.nativeEnum(CounterType, {
    message: 'Ungültiger Zählertyp',
  }),
  counterStartValue: z.number().min(0, 'Startwert muss >= 0 sein'),
  counterCurrent: z.number().min(0).optional(),

  primaryFuelType: z.nativeEnum(FuelType).optional(),
  adBlueRequired: z.boolean().optional(),

  stvzoApproved: z.boolean().optional(),
  licensePlate: z.string().max(50).optional(),

  status: z.nativeEnum(MachineStatus).optional(),

  notes: z.string().max(2000).optional(),

  // Dynamische Felder
  dynamic: z.record(z.string(), z.union([z.string(), z.null()])).optional(),
});

// Zod Schema für Machine Update
export const updateMachineSchema = createMachineSchema.partial();

// TypeScript Types aus den Schemas ableiten
export type CreateMachineDto = z.infer<typeof createMachineSchema>;
export type UpdateMachineDto = z.infer<typeof updateMachineSchema>;
