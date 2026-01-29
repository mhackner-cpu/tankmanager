'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { saveAuth } from '@/lib/auth';

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
  });

  // Einladung laden
  useEffect(() => {
    if (!token) return;

    fetch(`http://localhost:3005/auth/invite/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.message || data.error) {
          setError(data.message || data.error);
          setLoading(false);
          return;
        }
        setInvitation(data);
        // Vorausgefüllte Daten
        if (data.firstName) setFormData(prev => ({ ...prev, firstName: data.firstName }));
        if (data.lastName) setFormData(prev => ({ ...prev, lastName: data.lastName }));
        setLoading(false);
      })
      .catch(() => {
        setError('Fehler beim Laden der Einladung');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`http://localhost:3005/auth/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registrierung fehlgeschlagen');
        setSubmitting(false);
        return;
      }

      // JWT Token speichern und einloggen
      saveAuth(data);
      router.push('/');
    } catch (err) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Lade Einladung...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Einladung ungültig
            </h2>
          </div>
          <Alert type="error" message={error} />
          <div className="text-center">
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Zurück zum Login
            </Link>
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
            Willkommen bei {invitation.company.name}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sie wurden zu TankManager eingeladen
          </p>
          <p className="mt-1 text-center text-sm text-gray-500">
            Email: {invitation.email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <Input
              label="Vorname"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Max"
            />

            <Input
              label="Nachname"
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Mustermann"
            />

            <Input
              label="Passwort"
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
              value={formData.passwordConfirm}
              onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
              placeholder="Passwort wiederholen"
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'Registriere...' : 'Account erstellen'}
            </Button>
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Bereits registriert? Zum Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
