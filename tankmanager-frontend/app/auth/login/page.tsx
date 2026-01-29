'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { saveAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3005/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login fehlgeschlagen');
      }

      // Save auth data
      saveAuth(data);

      // Redirect to dashboard
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🚜</div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Willkommen zurück
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Melden Sie sich bei Ihrem TankManager Account an
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert type="error" message={error} onClose={() => setError('')} />
            )}

            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="max@moosmuehle.com"
              />

              <Input
                label="Passwort"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Ihr Passwort"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird angemeldet...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                    </svg>
                    Anmelden
                  </>
                )}
              </button>
            </div>

            <div className="text-center space-y-3 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                  Passwort vergessen?
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Noch kein Unternehmen registriert?{' '}
                <Link href="/auth/register" className="font-medium text-green-600 hover:text-green-500 hover:underline transition-colors">
                  Unternehmen registrieren
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
