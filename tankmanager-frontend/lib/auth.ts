/**
 * Auth Helper Functions
 */

const TOKEN_KEY = 'tankmanager_token';
const USER_KEY = 'tankmanager_user';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  companyId?: string;
  companyName?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  company: {
    id: string;
    name: string;
  };
}

/**
 * Save auth data to localStorage
 */
export function saveAuth(data: AuthResponse) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    // Trigger custom event for Navigation to update
    window.dispatchEvent(new Event('authChange'));
  }
}

/**
 * Get JWT token
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Get current user
 */
export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Check if user has specific role
 */
export function hasRole(role: string): boolean {
  const user = getUser();
  return user?.roles.includes(role) ?? false;
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
  return hasRole('ADMIN');
}

/**
 * Logout (clear auth data)
 */
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Trigger custom event for Navigation to update
    window.dispatchEvent(new Event('authChange'));
    
    window.location.href = '/auth/login';
  }
}

/**
 * Get Authorization header
 */
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
