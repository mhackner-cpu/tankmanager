'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import { getToken, isAdmin, isAuthenticated } from '@/lib/auth';

interface Invitation {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string;
  token: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
  company: {
    name: string;
  };
}

const ROLE_LABELS = {
  ADMIN: 'Administrator',
  DRIVER: 'Fahrer',
  MECHANIC: 'Mechaniker',
  MANAGEMENT: 'Verwaltung',
  VIEWER: 'Betrachter',
};

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roles: [] as string[],
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (!isAdmin()) {
      router.push('/');
      return;
    }

    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const response = await fetch('http://localhost:3005/invitations', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Einladungen', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.roles.length === 0) {
      setError('Bitte wählen Sie mindestens eine Rolle aus');
      return;
    }

    try {
      const response = await fetch('http://localhost:3005/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Fehler beim Erstellen der Einladung');
        return;
      }

      setSuccess('Einladung erfolgreich erstellt!');
      setFormData({ email: '', firstName: '', lastName: '', roles: [] });
      setShowForm(false);
      loadInvitations();
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Einladung widerrufen?')) return;

    try {
      const response = await fetch(`http://localhost:3005/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        setSuccess('Einladung widerrufen');
        loadInvitations();
      }
    } catch (err) {
      setError('Fehler beim Widerrufen');
    }
  };

  const handleResend = async (invitationId: string) => {
    try {
      const response = await fetch(`http://localhost:3005/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        setSuccess('Einladung wurde erneuert');
        loadInvitations();
      }
    } catch (err) {
      setError('Fehler beim Erneuern');
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth/invite/${token}`;
    navigator.clipboard.writeText(link);
    setSuccess('Einladungslink in Zwischenablage kopiert!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Mitarbeiter einladen</h1>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Abbrechen' : '+ Neue Einladung'}
          </Button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Neue Einladung erstellen</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="mitarbeiter@moosmuehle.com"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Vorname (optional)"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Max"
                />

                <Input
                  label="Nachname (optional)"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Mustermann"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rollen auswählen *
                </label>
                <div className="space-y-2">
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="mr-2"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" variant="primary">
                Einladung erstellen
              </Button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rollen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Läuft ab</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Keine Einladungen vorhanden
                  </td>
                </tr>
              ) : (
                invitations.map((invitation) => {
                  const roles = JSON.parse(invitation.roles);
                  const expired = isExpired(invitation.expiresAt);

                  return (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 text-sm">{invitation.email}</td>
                      <td className="px-6 py-4 text-sm">
                        {invitation.firstName || invitation.lastName
                          ? `${invitation.firstName || ''} ${invitation.lastName || ''}`.trim()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {roles.map((r: string) => ROLE_LABELS[r as keyof typeof ROLE_LABELS]).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {invitation.used ? (
                          <span className="text-green-600">✓ Verwendet</span>
                        ) : expired ? (
                          <span className="text-red-600">⏱ Abgelaufen</span>
                        ) : (
                          <span className="text-blue-600">⏳ Offen</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">{formatDate(invitation.expiresAt)}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {!invitation.used && !expired && (
                          <>
                            <button
                              onClick={() => copyInviteLink(invitation.token)}
                              className="text-blue-600 hover:underline"
                            >
                              Link kopieren
                            </button>
                            <button
                              onClick={() => handleResend(invitation.id)}
                              className="text-green-600 hover:underline"
                            >
                              Erneuern
                            </button>
                            <button
                              onClick={() => handleRevoke(invitation.id)}
                              className="text-red-600 hover:underline"
                            >
                              Widerrufen
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
  );
}
