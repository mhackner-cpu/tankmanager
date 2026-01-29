import { z } from 'zod';

/**
 * Validiert Daten mit einem Zod-Schema und gibt benutzerfreundliche Fehlermeldungen zurück
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Konvertiere Zod-Fehler in ein benutzerfreundliches Format
  const errors: Record<string, string> = {};
  
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path || 'general'] = issue.message;
  }
  
  return { success: false, errors };
}

/**
 * Zeigt Validierungsfehler in der Console und optional als Alert
 */
export function showValidationErrors(errors: Record<string, string>, showAlert = false) {
  const errorMessages = Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n');
  
  console.error('[Validation Error]', errors);
  
  if (showAlert) {
    alert('Validierungsfehler:\n\n' + errorMessages);
  }
  
  return errorMessages;
}

/**
 * Extrahiert den ersten Fehler für ein spezifisches Feld
 */
export function getFirstError(errors: Record<string, string>, field: string): string | undefined {
  return errors[field];
}
