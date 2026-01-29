'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';

type Role = {
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
};

type Permission = {
  resource: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
};

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Neue Rolle erstellen
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = getUser();
    if (!user?.roles.includes('ADMIN')) {
      router.push('/');
      return;
    }

    loadRoles();
  }, [router]);

  async function loadRoles() {
    setLoading(true);
    setError('');
    
    // Vorerst nur die 5 System-Rollen anzeigen
    const systemRoles: Role[] = [
      {
        name: 'ADMIN',
        displayName: 'Administrator',
        description: 'Vollzugriff auf alle Funktionen und Einstellungen',
        isSystem: true,
      },
      {
        name: 'MANAGEMENT',
        displayName: 'Verwaltung',
        description: 'Verwaltung von Betrieben, Kategorien und Mitarbeitern',
        isSystem: true,
      },
      {
        name: 'MECHANIC',
        displayName: 'Mechaniker',
        description: 'Wartung und Reparatur von Maschinen und Geräten',
        isSystem: true,
      },
      {
        name: 'DRIVER',
        displayName: 'Fahrer',
        description: 'Tankvorgänge erfassen und Maschinen bedienen',
        isSystem: true,
      },
      {
        name: 'VIEWER',
        displayName: 'Betrachter',
        description: 'Nur Lesezugriff auf Daten',
        isSystem: true,
      },
    ];

    setRoles(systemRoles);
    setLoading(false);
  }

  function loadPermissionsForRole(roleName: string) {
    setSelectedRole(roleName);
    
    // Standard-Berechtigungen für jede Rolle
    const resources = ['machines', 'owners', 'categories', 'users', 'fuel', 'maintenance'];
    
    const defaultPermissions: Permission[] = resources.map(resource => {
      let actions = { view: false, create: false, edit: false, delete: false };
      
      // ADMIN hat alle Rechte
      if (roleName === 'ADMIN') {
        actions = { view: true, create: true, edit: true, delete: true };
      }
      // MANAGEMENT hat fast alle Rechte
      else if (roleName === 'MANAGEMENT') {
        actions = { view: true, create: true, edit: true, delete: resource !== 'users' };
      }
      // MECHANIC kann alles sehen und bearbeiten außer Löschen
      else if (roleName === 'MECHANIC') {
        actions = { view: true, create: true, edit: true, delete: false };
      }
      // DRIVER kann Tankvorgänge erfassen und Maschinen sehen
      else if (roleName === 'DRIVER') {
        if (resource === 'fuel') {
          actions = { view: true, create: true, edit: true, delete: false };
        } else if (resource === 'machines' || resource === 'owners') {
          actions = { view: true, create: false, edit: false, delete: false };
        }
      }
      // VIEWER hat nur Lesezugriff
      else if (roleName === 'VIEWER') {
        actions = { view: true, create: false, edit: false, delete: false };
      }
      
      return { resource, actions };
    });
    
    setPermissions(defaultPermissions);
  }

  function handlePermissionChange(resource: string, action: keyof Permission['actions']) {
    setPermissions(prev => 
      prev.map(p => {
        if (p.resource === resource) {
          return {
            ...p,
            actions: {
              ...p.actions,
              [action]: !p.actions[action],
            },
          };
        }
        return p;
      })
    );
  }

  async function handleCreateRole() {
    if (!newRoleDisplayName.trim()) {
      setError('Anzeigename ist erforderlich');
      return;
    }

    setError('');
    setSuccess('');

    // Systemname automatisch aus Anzeigename generieren
    const generatedName = newRoleDisplayName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Prüfen ob Name bereits existiert
    if (roles.some(r => r.name === generatedName)) {
      setError('Eine Rolle mit diesem Namen existiert bereits');
      return;
    }

    // Neue Rolle hinzufügen (vorerst nur lokal, später Backend)
    const newRole: Role = {
      name: generatedName,
      displayName: newRoleDisplayName.trim(),
      description: newRoleDescription.trim(),
      isSystem: false,
    };

    setRoles([...roles, newRole]);
    setSuccess('Rolle erfolgreich erstellt');
    setShowCreateForm(false);
    setNewRoleName('');
    setNewRoleDisplayName('');
    setNewRoleDescription('');
  }

  async function handleSavePermissions() {
    if (!selectedRole) return;

    setError('');
    setSuccess('');

    // TODO: Backend-Aufruf zum Speichern der Berechtigungen
    console.log('Saving permissions for', selectedRole, permissions);
    
    setSuccess('Berechtigungen erfolgreich gespeichert');
  }

  async function handleDeleteRole(roleName: string) {
    if (!confirm(`Rolle "${roles.find(r => r.name === roleName)?.displayName}" wirklich löschen?`)) {
      return;
    }

    setError('');
    setSuccess('');

    // TODO: Backend-Aufruf zum Löschen der Rolle
    console.log('Deleting role', roleName);

    // Rolle aus Liste entfernen
    setRoles(roles.filter(r => r.name !== roleName));
    setSelectedRole(null);
    setPermissions([]);
    setSuccess('Rolle erfolgreich gelöscht');
  }

  const resourceLabels: Record<string, string> = {
    machines: 'Maschinen & Geräte',
    owners: 'Betriebe',
    categories: 'Kategorien',
    users: 'Benutzer',
    fuel: 'Tankvorgänge',
    maintenance: 'Wartung',
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">🔐 Rollen-Verwaltung</h1>
      <p className="text-gray-600 mb-8">Rollen erstellen und Berechtigungen verwalten</p>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rollen-Liste */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Rollen</h2>
              <Button 
                variant="primary" 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="text-sm"
              >
                + Neue Rolle
              </Button>
            </div>

            {showCreateForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded border">
                <h3 className="font-semibold mb-3">Neue Rolle erstellen</h3>
                <Input
                  label="Anzeigename"
                  value={newRoleDisplayName}
                  onChange={(e) => setNewRoleDisplayName(e.target.value)}
                  placeholder="z.B. Projektleiter"
                  className="mb-3"
                />
                <Input
                  label="Beschreibung"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Beschreibung der Rolle"
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleCreateRole}>
                    Erstellen
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewRoleName('');
                      setNewRoleDisplayName('');
                      setNewRoleDescription('');
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.name}
                  onClick={() => loadPermissionsForRole(role.name)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedRole === role.name
                      ? 'bg-blue-100 border-blue-500 border-2'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-semibold">{role.displayName}</div>
                    {role.isSystem && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Berechtigungen-Matrix */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  Berechtigungen für {roles.find(r => r.name === selectedRole)?.displayName}
                </h2>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => handleDeleteRole(selectedRole)}>
                    Löschen
                  </Button>
                  <Button variant="primary" onClick={handleSavePermissions}>
                    Speichern
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Ressource</th>
                      <th className="text-center py-3 px-4 font-semibold">Ansehen</th>
                      <th className="text-center py-3 px-4 font-semibold">Erstellen</th>
                      <th className="text-center py-3 px-4 font-semibold">Bearbeiten</th>
                      <th className="text-center py-3 px-4 font-semibold">Löschen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm) => {
                      return (
                        <tr key={perm.resource} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {resourceLabels[perm.resource] || perm.resource}
                          </td>
                          <td className="text-center py-3 px-4">
                            <input
                              type="checkbox"
                              checked={perm.actions.view}
                              onChange={() => handlePermissionChange(perm.resource, 'view')}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </td>
                          <td className="text-center py-3 px-4">
                            <input
                              type="checkbox"
                              checked={perm.actions.create}
                              onChange={() => handlePermissionChange(perm.resource, 'create')}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </td>
                          <td className="text-center py-3 px-4">
                            <input
                              type="checkbox"
                              checked={perm.actions.edit}
                              onChange={() => handlePermissionChange(perm.resource, 'edit')}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </td>
                          <td className="text-center py-3 px-4">
                            <input
                              type="checkbox"
                              checked={perm.actions.delete}
                              onChange={() => handlePermissionChange(perm.resource, 'delete')}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="danger" onClick={() => handleDeleteRole(selectedRole)}>
                  Rolle löschen
                </Button>
                <Button variant="primary" onClick={handleSavePermissions}>
                  Berechtigungen speichern
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <p className="text-lg">Wählen Sie eine Rolle aus, um die Berechtigungen anzuzeigen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
