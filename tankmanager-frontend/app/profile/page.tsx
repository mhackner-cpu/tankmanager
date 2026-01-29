'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { getToken, getUser, isAuthenticated, saveAuth } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = getUser();
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const user = getUser();
      if (!user) return;

      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Fehler beim Aktualisieren');
        setLoading(false);
        return;
      }

      // Update local storage
      const currentAuth = {
        token: getToken() || '',
        user: {
          ...user,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        },
        company: {
          id: user.companyId || '',
          name: user.companyName || '',
        },
      };
      saveAuth(currentAuth);

      setSuccess('Profil erfolgreich aktualisiert!');
      setLoading(false);
    } catch (err) {
      setError('Netzwerkfehler');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profil bearbeiten</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Vorname"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />

            <Input
              label="Nachname"
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />

            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <div className="flex gap-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Speichert...' : 'Änderungen speichern'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/')}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </div>
      </div>
  );
}
