'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { API_BASE_URL } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Fehler beim Senden des Reset-Links');
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Passwort vergessen
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Geben Sie Ihre Email-Adresse ein, um einen Reset-Link zu erhalten
          </p>
        </div>

        {success ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <Alert
              type="success"
              message="Ein Passwort-Reset-Link wurde an Ihre Email-Adresse gesendet. Bitte überprüfen Sie Ihr Postfach."
            />
            <div className="mt-6 text-center">
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Zurück zum Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert type="error" message={error} onClose={() => setError('')} />
            )}

            <div className="rounded-md shadow-sm">
              <Input
                label="Email-Adresse"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max@moosmuehle.com"
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
              </Button>
            </div>

            <div className="text-center">
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Zurück zum Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
