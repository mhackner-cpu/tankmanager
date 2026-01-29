import { z } from 'zod';

// Schema für benutzerdefinierte Felder
export const categoryFieldSchema = z.object({
  key: z.string()
    .min(1, 'Feldschlüssel ist erforderlich')
    .regex(/^[a-z_]+$/, 'Feldschlüssel darf nur Kleinbuchstaben und _ enthalten'),
  label: z.string().min(1, 'Feldbezeichnung ist erforderlich').max(100),
  type: z.enum(['TEXT', 'NUMBER', 'DATE', 'SELECT', 'TEXTAREA']),
  required: z.boolean().default(false),
  optionsJson: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

// Schema für Category Creation
export const createCategorySchema = z.object({
  name: z.string()
    .min(1, 'Name ist ein Pflichtfeld')
    .max(100, 'Name darf maximal 100 Zeichen lang sein'),
  
  inventoryPrefix: z.string()
    .min(1, 'Inventar-Präfix ist ein Pflichtfeld')
    .max(10, 'Präfix darf maximal 10 Zeichen lang sein')
    .regex(/^[A-Z0-9]+$/, 'Präfix darf nur Großbuchstaben und Zahlen enthalten'),
  
  inventoryMiddleHint: z.string().max(100).optional(),
  
  hasEngine: z.boolean().default(false),
  
  fields: z.array(categoryFieldSchema).optional().default([]),
});

// Schema für Category Update
export const updateCategorySchema = createCategorySchema.partial();

// TypeScript Types
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CategoryFieldDto = z.infer<typeof categoryFieldSchema>;
