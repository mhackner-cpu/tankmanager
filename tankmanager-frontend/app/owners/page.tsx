'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { isAuthenticated, getUser, hasRole } from '@/lib/auth';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import colors from '@/lib/colors';

type Owner = { id: string; name: string; notes?: string };

export default function OwnersPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const user = getUser();
  const canDelete = user && (hasRole('ADMIN') || hasRole('MANAGEMENT'));

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadOwners();
  }, [router]);

  async function loadOwners() {
    setLoading(true);
    try {
      const data = await apiGet<Owner[]>("/owners");
      setOwners(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden der Betriebe");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Betriebsname erforderlich");
      return;
    }

    setSubmitting(true);
    try {
      await apiPost("/owners", {
        name: formName,
        notes: formNotes || undefined,
      });
      setSuccess("Betrieb angelegt ✅");
      setFormName("");
      setFormNotes("");
      setShowForm(false);
      loadOwners();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Anlegen");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!canDelete) {
      setError('Keine Berechtigung zum Löschen');
      return;
    }
    if (!confirm("Betrieb wirklich löschen?")) return;

    setDeleting(id);
    try {
      await apiDelete(`/owners/${id}`);
      setSuccess("Betrieb gelöscht ✅");
      loadOwners();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Löschen");
    } finally {
      setDeleting(null);
    }
  }

  function handleEdit(owner: Owner) {
    setEditingId(owner.id);
    setEditName(owner.name);
    setEditNotes(owner.notes || '');
  }

  async function handleSave() {
    if (!editName.trim()) {
      setError('Bitte einen Namen angeben');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/owners/${editingId}`, { name: editName.trim(), notes: editNotes || undefined });
      setSuccess('Betrieb aktualisiert ✅');
      setEditingId(null);
      loadOwners();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: "20px", fontFamily: "system-ui, sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Betriebe</h1>
          <Button variant="primary" size="lg" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Abbrechen" : "+ Neuer Betrieb"}
          </Button>
        </div>

        {error && (
          <Alert type="error" title="Fehler" message={error} onClose={() => setError(null)} />
        )}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess(null)} />
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: colors.neutral[50],
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "grid",
              gap: "12px",
              maxWidth: "500px",
            }}
          >
            <Input
              label="Betriebsname*"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="z.B. Betrieb München"
              autoFocus
            />
            <Input
              label="Notizen"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Zusätzliche Informationen"
              asTextarea={true}
            />
            <Button type="submit" variant="success" loading={submitting} disabled={submitting}>
              Betrieb anlegen
            </Button>
          </form>
        )}

        {loading ? (
          <p style={{ textAlign: "center", color: colors.neutral[500] }}>Wird geladen...</p>
        ) : owners.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.neutral[500] }}>
            <p>Keine Betriebe vorhanden.</p>
            <p>Klick auf "+ Neuer Betrieb" um einen hinzuzufügen.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {owners.map((owner) => (
              <div
                key={owner.id}
                style={{
                  padding: "16px",
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: "8px",
                  backgroundColor: colors.white,
                }}
              >
                {editingId === owner.id ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <Input label="Name*" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <Input label="Notizen" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} asTextarea />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Abbrechen
                      </Button>
                      <Button type="button" variant="primary" size="sm" loading={saving} disabled={saving} onClick={handleSave}>
                        Speichern
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>{owner.name}</h3>
                      {owner.notes && <p style={{ margin: 0, fontSize: '14px', color: colors.neutral[600] }}>{owner.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(owner)}>
                        Bearbeiten
                      </Button>
                      {canDelete && (
                        <Button size="sm" variant="danger" onClick={() => handleDelete(owner.id)} disabled={deleting === owner.id}>
                          Löschen
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </main>
  );
}

