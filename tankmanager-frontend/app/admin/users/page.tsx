'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import Select from '@/components/Select';
import { getToken, isAdmin, isAuthenticated, getUser } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (!isAdmin()) {
      router.push('/');
      return;
    }

    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Fehler beim Laden der Benutzer');
      }
    } catch (err) {
      setError('Netzwerkfehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoles = (userId: string, currentRoles: string[]) => {
    setEditingUserId(userId);
    setEditingRoles(currentRoles);
    setError('');
    setSuccess('');
  };

  const handleSaveRoles = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ roles: editingRoles }),
      });

      if (response.ok) {
        setSuccess('Rollen erfolgreich aktualisiert');
        setEditingUserId(null);
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.message || 'Fehler beim Aktualisieren der Rollen');
      }
    } catch (err) {
      setError('Netzwerkfehler beim Aktualisieren');
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (!confirm(`Möchten Sie diesen Benutzer wirklich ${currentActive ? 'deaktivieren' : 'aktivieren'}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (response.ok) {
        setSuccess(`Benutzer erfolgreich ${currentActive ? 'deaktiviert' : 'aktiviert'}`);
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.message || 'Fehler beim Ändern des Status');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Passwort-Reset-Link an ${userEmail} senden?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        setSuccess('Passwort-Reset-Link wurde per E-Mail verschickt');
      } else {
        const data = await response.json();
        setError(data.message || 'Fehler beim Senden des Reset-Links');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Benutzer ${userEmail} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        setSuccess('Benutzer erfolgreich gelöscht');
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.message || 'Fehler beim Löschen des Benutzers');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    }
  };

  const toggleRole = (role: string) => {
    if (editingRoles.includes(role)) {
      setEditingRoles(editingRoles.filter(r => r !== role));
    } else {
      setEditingRoles([...editingRoles, role]);
    }
  };

  const currentUser = getUser();

  if (loading) {
    return (
      <main style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Benutzer verwalten</h1>
        <p>Lade Benutzer...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Benutzer verwalten</h1>
        <p style={{ color: '#666' }}>Alle Benutzer Ihres Unternehmens</p>
      </div>

      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" message={success} onClose={() => setSuccess('')} />}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Name</th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>E-Mail</th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Rollen</th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Status</th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Erstellt am</th>
              <th style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: 12 }}>
                  {user.firstName} {user.lastName}
                  {user.id === currentUser?.id && <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>(Sie)</span>}
                </td>
                <td style={{ padding: 12 }}>{user.email}</td>
                <td style={{ padding: 12 }}>
                  {editingUserId === user.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['USER', 'MECHANIC', 'MANAGEMENT', 'ADMIN'].map(role => (
                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editingRoles.includes(role)}
                            onChange={() => toggleRole(role)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: 14 }}>{role}</span>
                        </label>
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <Button size="sm" onClick={() => handleSaveRoles(user.id)}>Speichern</Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingUserId(null)}>Abbrechen</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {user.roles.map(role => (
                        <span
                          key={role}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: role === 'ADMIN' ? '#fee' : role === 'MANAGEMENT' ? '#fef3c7' : '#e0f2fe',
                            color: role === 'ADMIN' ? '#991b1b' : role === 'MANAGEMENT' ? '#78350f' : '#075985',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: 12 }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      backgroundColor: user.isActive ? '#d1fae5' : '#fee2e2',
                      color: user.isActive ? '#065f46' : '#991b1b',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {user.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td style={{ padding: 12, fontSize: 14, color: '#666' }}>
                  {new Date(user.createdAt).toLocaleDateString('de-DE')}
                </td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {editingUserId !== user.id && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditRoles(user.id, user.roles)}
                        >
                          Rollen
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                        >
                          {user.isActive ? 'Deaktivieren' : 'Aktivieren'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleResetPassword(user.id, user.email)}
                        >
                          Passwort Reset
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                          >
                            Löschen
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          Keine Benutzer gefunden
        </div>
      )}
    </main>
  );
}
