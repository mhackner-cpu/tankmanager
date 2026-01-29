'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import { getToken, getUser, isAuthenticated } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';

export default function PasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);

    try {
      const user = getUser();
      if (!user) return;

      const response = await fetch(`${API_BASE_URL}/users/${user.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Fehler beim Ändern des Passworts');
        setLoading(false);
        return;
      }

      setSuccess('Passwort erfolgreich geändert!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setLoading(false);
    } catch (err) {
      setError('Netzwerkfehler');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Passwort ändern</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Aktuelles Passwort"
              type="password"
              required
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            />

            <Input
              label="Neues Passwort"
              type="password"
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Mindestens 6 Zeichen"
            />

            <Input
              label="Neues Passwort bestätigen"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Passwort wiederholen"
            />

            <div className="flex gap-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Ändert...' : 'Passwort ändern'}
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
