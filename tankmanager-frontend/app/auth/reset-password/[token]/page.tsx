'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { saveAuth } from '@/lib/auth';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch(`http://localhost:3005/auth/reset-password/${params.token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ungültiger oder abgelaufener Token');
      }

      setTokenValid(true);
      setEmail(data.email);
    } catch (err: any) {
      setError(err.message || 'Token konnte nicht verifiziert werden');
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3005/auth/reset-password/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Fehler beim Zurücksetzen des Passworts');
      }

      // Auto-login nach erfolgreichem Reset
      saveAuth(data);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">Token wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <Alert type="error" message={error || 'Ungültiger oder abgelaufener Reset-Link'} />
            <div className="mt-6 text-center">
              <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Neuen Reset-Link anfordern
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Neues Passwort setzen
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Für {email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <Input
              label="Neues Passwort"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mindestens 6 Zeichen"
            />

            <Input
              label="Passwort bestätigen"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Passwort wiederholen"
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Wird gespeichert...' : 'Passwort zurücksetzen'}
            </Button>
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Zurück zum Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
