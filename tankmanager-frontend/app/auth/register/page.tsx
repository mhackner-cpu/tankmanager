'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { saveAuth } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Company Data
    companyName: '',
    companyEmail: '',
    companyDomain: '',
    
    // Admin User Data
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          companyEmail: formData.companyEmail,
          companyDomain: formData.companyDomain,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registrierung fehlgeschlagen');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Unternehmen registrieren
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Erstellen Sie Ihren TankManager Account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          {/* Company Information */}
          <div className="rounded-md shadow-sm space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Unternehmensdaten</h3>
            
            <Input
              label="Firmenname *"
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="z.B. Moosmühle GmbH"
            />

            <Input
              label="Firmen-Email"
              type="email"
              value={formData.companyEmail}
              onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
              placeholder="info@moosmuehle.com"
            />

            <Input
              label="Domain (optional)"
              type="text"
              value={formData.companyDomain}
              onChange={(e) => setFormData({ ...formData, companyDomain: e.target.value })}
              placeholder="moosmuehle.com"
            />
          </div>

          {/* Admin User */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium text-gray-900">Administrator-Account</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Vorname *"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Max"
              />

              <Input
                label="Nachname *"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Mustermann"
              />
            </div>

            <Input
              label="Email *"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="max@moosmuehle.com"
            />

            <Input
              label="Passwort *"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mindestens 6 Zeichen"
            />

            <Input
              label="Passwort bestätigen *"
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
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Wird registriert...' : 'Unternehmen registrieren'}
            </Button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Bereits registriert?{' '}
              <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Jetzt anmelden
              </a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
