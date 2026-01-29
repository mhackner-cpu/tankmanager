// Temporary hardcoded for deployment testing
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tankmanager-production.up.railway.app';

if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is missing. Set it in .env.local or Vercel environment variables');
}

// Bessere Error-Klasse mit strukturierten Daten
export class ApiError extends Error {
  constructor(
    public status: number,
    public method: string,
    public path: string,
    public body?: unknown
  ) {
    super(`${method} ${path} failed: ${status}`);
    this.name = 'ApiError';
  }
  
  // Extrahiert Fehlermeldung aus Backend-Response
  getUserMessage(): string {
    if (this.status === 401) return 'Nicht autorisiert. Bitte erneut anmelden.';
    if (this.status === 403) return 'Zugriff verweigert.';
    if (this.status === 404) return 'Ressource nicht gefunden.';
    if (this.status === 422) return 'Validierungsfehler: ' + this.extractValidationErrors();
    if (this.status >= 500) return 'Serverfehler. Bitte später erneut versuchen.';
    return this.message;
  }
  
  private extractValidationErrors(): string {
    if (typeof this.body === 'object' && this.body && 'message' in this.body) {
      return String(this.body.message);
    }
    return 'Ungültige Daten';
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tankmanager_token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${baseUrl}${path}`, { 
      cache: 'no-store',
      headers 
    });
    
    if (!res.ok) {
      const text = await res.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        // Text bleibt als string
      }
      throw new ApiError(res.status, 'GET', path, body);
    }
    
    // Handle empty responses
    const text = await res.text();
    if (!text || text.trim() === '') {
      return null as T;
    }
    
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(`GET ${path} failed: ${error}`);
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tankmanager_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const text = await res.text();
      let responseBody: unknown = text;
      try {
        responseBody = JSON.parse(text);
      } catch {
        // Text bleibt als string
      }
      throw new ApiError(res.status, 'POST', path, responseBody);
    }
    
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(`POST ${path} failed: ${error}`);
  }
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tankmanager_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const text = await res.text();
      let responseBody: unknown = text;
      try {
        responseBody = JSON.parse(text);
      } catch {
        // Text bleibt als string
      }
      throw new ApiError(res.status, 'PATCH', path, responseBody);
    }
    
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(`PATCH ${path} failed: ${error}`);
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tankmanager_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!res.ok) {
      const text = await res.text();
      let responseBody: unknown = text;
      try {
        responseBody = JSON.parse(text);
      } catch {
        // Text bleibt als string
      }
      throw new ApiError(res.status, 'DELETE', path, responseBody);
    }
    
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(`DELETE ${path} failed: ${error}`);
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tankmanager_token') : null;
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      let responseBody: unknown = text;
      try {
        responseBody = JSON.parse(text);
      } catch {
        // Text bleibt als string
      }
      throw new ApiError(res.status, options?.method || 'GET', path, responseBody);
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }

    return res as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(`${options?.method || 'GET'} ${path} failed: ${error}`);
  }
}
