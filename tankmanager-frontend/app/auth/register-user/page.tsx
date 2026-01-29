'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import Select from '@/components/Select';
import { saveAuth } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';

interface Company {
  id: string;
  name: string;
}

export default function RegisterUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    companyName: '', // User gibt Unternehmensnamen ein
  });

  // Unternehmen laden für Validierung
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Unternehmen:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validierung
    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (!formData.companyName.trim()) {
      setError('Bitte geben Sie den Unternehmensnamen an');
      return;
    }

    // Unternehmen finden
    const company = companies.find(
      c => c.name.toLowerCase() === formData.companyName.trim().toLowerCase()
    );

    if (!company) {
      setError('Unternehmen nicht gefunden. Bitte überprüfen Sie den Namen oder registrieren Sie ein neues Unternehmen.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          companyId: company.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registrierung fehlgeschlagen');
      }

      const data = await response.json();
      saveAuth(data);
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
            🚜 Benutzer registrieren
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Erstellen Sie Ihren persönlichen Account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Persönliche Daten</h3>

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

          <div className="rounded-md shadow-sm space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Unternehmen</h3>

            <Input
              label="Unternehmensname"
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="z.B. Moosmühle GmbH"
              disabled={loadingCompanies}
            />
            <p className="text-xs text-gray-500">
              Geben Sie den exakten Namen Ihres Unternehmens ein. Falls Ihr Unternehmen noch nicht registriert ist,{' '}
              <Link href="/auth/register" className="text-blue-600 hover:underline">
                registrieren Sie hier ein neues Unternehmen
              </Link>.
            </p>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || loadingCompanies}
              style={{ width: '100%' }}
            >
              {loading ? 'Registriere...' : 'Benutzer registrieren'}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Bereits registriert?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Hier anmelden
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Neues Unternehmen?{' '}
              <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                Unternehmen registrieren
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
