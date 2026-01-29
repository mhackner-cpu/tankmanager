'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Alert from '@/components/Alert';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { isAuthenticated, getUser, hasRole } from '@/lib/auth';
import colors from '@/lib/colors';

type Category = { id: string; name: string; hasEngine: boolean; notes?: string; inventoryPrefix?: string; _count?: { machines: number } };

type CategoryField = {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOL' | 'SELECT';
  required: boolean;
  optionsJson: string | null;
  sortOrder: number;
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editHasEngine, setEditHasEngine] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newHasEngine, setNewHasEngine] = useState(true);
  const [creating, setCreating] = useState(false);

  const [fieldsByCategory, setFieldsByCategory] = useState<Record<string, CategoryField[]>>({});
  const [newField, setNewField] = useState<{ label: string; key: string; type: CategoryField['type']; required: boolean; options: string }>(
    { label: '', key: '', type: 'TEXT', required: false, options: '' },
  );
  const [fieldBusy, setFieldBusy] = useState(false);
  const [newCategoryFields, setNewCategoryFields] = useState<Array<Omit<CategoryField, 'id' | 'categoryId'>>>([]);

  const user = getUser();
  const canDelete = user && (hasRole('ADMIN') || hasRole('MANAGEMENT'));

  // Standard-Felder die immer vorhanden sind
  const standardFields = [
    { label: 'Bezeichnung', type: 'TEXT', required: true },
    { label: 'Seriennummer', type: 'TEXT', required: false },
    { label: 'Inventarnummer', type: 'TEXT', required: false },
    { label: 'Eigentümer', type: 'SELECT', required: false },
    { label: 'Standort', type: 'TEXT', required: false },
    { label: 'Status', type: 'SELECT', required: true },
  ];

  // Engine-spezifische Standard-Felder
  const engineFields = [
    { label: 'Kraftstoffart', type: 'SELECT', required: true },
    { label: 'Betriebsstunden', type: 'NUMBER', required: false },
  ];

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [router]);

  async function loadData() {
    setLoading(true);
    try {
      const categoriesData = await apiGet<Category[]>('/categories');
      setCategories(categoriesData);
      
      const fieldMap: Record<string, CategoryField[]> = {};
      for (const cat of categoriesData) {
        const fields = await apiGet<CategoryField[]>(`/category-fields?categoryId=${cat.id}`);
        fieldMap[cat.id] = fields;
      }
      setFieldsByCategory(fieldMap);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Kategorien');
    } finally {
      setLoading(false);
    }
  }

  async function reloadFields(categoryId: string) {
    const fields = await apiGet<CategoryField[]>(`/category-fields?categoryId=${categoryId}`);
    setFieldsByCategory((prev) => ({ ...prev, [categoryId]: fields }));
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setError('Bitte einen Namen angeben');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const result = await apiPost<Category>('/categories', {
        name: newName.trim(),
        notes: newNotes || undefined,
        hasEngine: newHasEngine,
      });
      
      // Create custom fields for the new category
      for (let i = 0; i < newCategoryFields.length; i++) {
        const field = newCategoryFields[i];
        await apiPost('/category-fields', {
          categoryId: result.id,
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          optionsJson: field.optionsJson,
          sortOrder: i,
        });
      }
      
      setSuccess('Kategorie erstellt ✅');
      setNewName('');
      setNewNotes('');
      setNewHasEngine(true);
      setNewCategoryFields([]);
      setShowCreateForm(false);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Erstellen');
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditNotes(category.notes || '');
    setEditHasEngine(category.hasEngine);
    setNewField({ label: '', key: '', type: 'TEXT', required: false, options: '' });
  }

  async function handleCreateField(categoryId: string) {
    if (!newField.label.trim()) {
      setError('Feldname angeben');
      return;
    }
    setFieldBusy(true);
    setError(null);
    try {
      const key = newField.key.trim() || slugify(newField.label);
      const optionsJson = newField.type === 'SELECT'
        ? JSON.stringify(
            newField.options
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          )
        : undefined;

      await apiPost('/category-fields', {
        categoryId,
        key,
        label: newField.label.trim(),
        type: newField.type,
        required: newField.required,
        optionsJson,
        sortOrder: (fieldsByCategory[categoryId]?.length || 0),
      });
      await reloadFields(categoryId);
      setSuccess('Feld hinzugefügt ✅');
      setNewField({ label: '', key: '', type: 'TEXT', required: false, options: '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Hinzufügen des Felds');
    } finally {
      setFieldBusy(false);
    }
  }

  async function handleDeleteField(fieldId: string, categoryId: string) {
    if (!confirm('Feld wirklich löschen? Werte an Maschinen gehen verloren.')) return;
    try {
      await apiDelete(`/category-fields?id=${encodeURIComponent(fieldId)}`);
      await reloadFields(categoryId);
      setSuccess('Feld gelöscht ✅');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen des Felds');
    }
  }

  function handleAddNewCategoryField() {
    if (!newField.label.trim()) {
      setError('Feldname angeben');
      return;
    }
    
    const key = newField.key.trim() || slugify(newField.label);
    const optionsJson = newField.type === 'SELECT'
      ? JSON.stringify(
          newField.options
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        )
      : null;

    setNewCategoryFields((prev) => [
      ...prev,
      {
        key,
        label: newField.label.trim(),
        type: newField.type,
        required: newField.required,
        optionsJson,
        sortOrder: prev.length,
      },
    ]);
    setNewField({ label: '', key: '', type: 'TEXT', required: false, options: '' });
    setError(null);
  }

  function handleRemoveNewCategoryField(index: number) {
    setNewCategoryFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!editName.trim()) {
      setError('Bitte einen Namen angeben');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/categories/${editingId}`, {
        name: editName.trim(),
        notes: editNotes || undefined,
        hasEngine: editHasEngine,
      });
      setSuccess('Kategorie aktualisiert ✅');
      setEditingId(null);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(categoryId: string) {
    if (!canDelete) {
      setError('Keine Berechtigung zum Löschen');
      return;
    }
    if (!confirm('Kategorie wirklich löschen? Alle zugehörigen Maschinen werden ebenfalls gelöscht!')) return;
    try {
      await apiDelete(`/categories/${categoryId}`);
      setSuccess('Kategorie gelöscht ✅');
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }

  return (
    <main style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Kategorien</h1>
        <Button variant="primary" size="lg" onClick={() => setShowCreateForm((v) => !v)}>
          + Neue Kategorie
        </Button>
      </div>

      {error && <Alert type="error" title="Fehler" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {showCreateForm && (
        <div style={{ border: `1px solid ${colors.neutral[200]}`, padding: '16px', borderRadius: '6px', marginBottom: '20px', backgroundColor: 'white' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Neue Kategorie</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <Input label="Name*" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input label="Notizen" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} asTextarea />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={newHasEngine}
                onChange={(e) => setNewHasEngine(e.target.checked)}
              />
              Hat Motor / Zähler (Kraftstoff & Betriebsstunden erforderlich)
            </label>
            
            {/* Benutzerdefinierte Felder */}
            <div style={{ display: 'grid', gap: '8px', padding: '12px', border: `1px solid ${colors.neutral[200]}`, borderRadius: '6px', backgroundColor: colors.neutral[50] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <strong>Felder für diese Kategorie</strong>
                  <div style={{ fontSize: '12px', color: colors.neutral[600], marginTop: '4px' }}>
                    Standard: {standardFields.length + (newHasEngine ? engineFields.length : 0)} • Benutzerdefiniert: {newCategoryFields.length}
                  </div>
                </div>
              </div>
              
              {/* Standardfelder Anzeige */}
              <div style={{ padding: '8px', backgroundColor: colors.neutral[0], borderRadius: '4px', border: `1px solid ${colors.neutral[200]}` }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: colors.neutral[700], marginBottom: '6px' }}>📋 Standardfelder (immer vorhanden):</div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  {standardFields.map((field, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: colors.neutral[600], paddingLeft: '8px' }}>
                      • {field.label} <span style={{ color: colors.neutral[400] }}>({field.type}{field.required ? ', Pflicht' : ''})</span>
                    </div>
                  ))}
                  {newHasEngine && engineFields.map((field, idx) => (
                    <div key={`engine-${idx}`} style={{ fontSize: '12px', color: colors.neutral[600], paddingLeft: '8px' }}>
                      • {field.label} <span style={{ color: colors.neutral[400] }}>({field.type}{field.required ? ', Pflicht' : ''})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benutzerdefinierte Felder Liste */}
              {newCategoryFields.length > 0 && (
                <div style={{ padding: '8px', backgroundColor: colors.success + '10', borderRadius: '4px', border: `1px solid ${colors.success}` }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: colors.neutral[700], marginBottom: '6px' }}>✅ Ihre benutzerdefinierten Felder:</div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {newCategoryFields.map((field, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{field.label}</div>
                          <div style={{ fontSize: '11px', color: colors.neutral[600] }}>
                            {field.type} {field.required ? '• Pflichtfeld' : ''}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveNewCategoryField(index)}>
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Neues Feld hinzufügen */}
              <div style={{ display: 'grid', gap: '8px', borderTop: `2px solid ${colors.neutral[300]}`, paddingTop: '12px', marginTop: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: colors.neutral[700] }}>➕ Benutzerdefiniertes Feld hinzufügen:</div>
                <Input 
                  label="Feldname" 
                  value={newField.label} 
                  onChange={(e) => setNewField((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="z.B. Maximale Traglast"
                />
                <Select
                  label="Typ"
                  value={newField.type}
                  onChange={(e) => setNewField((prev) => ({ ...prev, type: e.target.value as any }))}
                  options={[
                    { value: 'TEXT', label: 'Text' },
                    { value: 'NUMBER', label: 'Zahl' },
                    { value: 'DATE', label: 'Datum' },
                    { value: 'BOOL', label: 'Ja/Nein' },
                    { value: 'SELECT', label: 'Auswahl' },
                  ]}
                />
                {newField.type === 'SELECT' && (
                  <Input
                    label="Optionen (kommagetrennt)"
                    value={newField.options}
                    onChange={(e) => setNewField((prev) => ({ ...prev, options: e.target.value }))}
                    placeholder="z.B. klein,mittel,groß"
                  />
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField((prev) => ({ ...prev, required: e.target.checked }))}
                  />
                  Pflichtfeld
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button size="sm" variant="primary" onClick={handleAddNewCategoryField} disabled={!newField.label.trim()}>
                    + Feld hinzufügen
                  </Button>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                Abbrechen
              </Button>
              <Button type="button" variant="primary" size="sm" loading={creating} disabled={creating} onClick={handleCreate}>
                Erstellen
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: colors.neutral[500] }}>Wird geladen...</p>
      ) : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.neutral[500] }}>
          <p>Noch keine Kategorien vorhanden.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {categories.map((category) => (
            <div
              key={category.id}
              style={{
                border: `1px solid ${colors.neutral[200]}`,
                padding: '16px',
                borderRadius: '6px',
                backgroundColor: 'white',
              }}
            >
              {editingId === category.id ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <Input label="Name*" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Input label="Notizen" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} asTextarea />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={editHasEngine}
                      onChange={(e) => setEditHasEngine(e.target.checked)}
                    />
                    Hat Motor / Zähler
                  </label>
                  
                  {/* Benutzerdefinierte Felder */}
                  <div style={{ display: 'grid', gap: '8px', padding: '12px', border: `1px solid ${colors.neutral[200]}`, borderRadius: '6px', backgroundColor: colors.neutral[50] }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <strong>Felder für diese Kategorie</strong>
                        <div style={{ fontSize: '12px', color: colors.neutral[600], marginTop: '4px' }}>
                          Standard: {standardFields.length + (editHasEngine ? engineFields.length : 0)} • Benutzerdefiniert: {fieldsByCategory[category.id]?.length || 0}
                        </div>
                      </div>
                    </div>
                    
                    {/* Standardfelder Anzeige */}
                    <div style={{ padding: '8px', backgroundColor: colors.neutral[0], borderRadius: '4px', border: `1px solid ${colors.neutral[200]}` }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: colors.neutral[700], marginBottom: '6px' }}>📋 Standardfelder (immer vorhanden):</div>
                      <div style={{ display: 'grid', gap: '4px' }}>
                        {standardFields.map((field, idx) => (
                          <div key={idx} style={{ fontSize: '12px', color: colors.neutral[600], paddingLeft: '8px' }}>
                            • {field.label} <span style={{ color: colors.neutral[400] }}>({field.type}{field.required ? ', Pflicht' : ''})</span>
                          </div>
                        ))}
                        {editHasEngine && engineFields.map((field, idx) => (
                          <div key={`engine-${idx}`} style={{ fontSize: '12px', color: colors.neutral[600], paddingLeft: '8px' }}>
                            • {field.label} <span style={{ color: colors.neutral[400] }}>({field.type}{field.required ? ', Pflicht' : ''})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benutzerdefinierte Felder Liste */}
                    {(fieldsByCategory[category.id]?.length || 0) > 0 && (
                      <div style={{ padding: '8px', backgroundColor: colors.success + '10', borderRadius: '4px', border: `1px solid ${colors.success}` }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.neutral[700], marginBottom: '6px' }}>✅ Benutzerdefinierte Felder:</div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {(fieldsByCategory[category.id] || []).map((field) => (
                            <div key={field.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', backgroundColor: 'white', borderRadius: '4px' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{field.label}</div>
                                <div style={{ fontSize: '11px', color: colors.neutral[600] }}>
                                  {field.type} {field.required ? '• Pflichtfeld' : ''}
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteField(field.id, category.id)}>
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Neues Feld hinzufügen */}
                    <div style={{ display: 'grid', gap: '8px', borderTop: `2px solid ${colors.neutral[300]}`, paddingTop: '12px', marginTop: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: colors.neutral[700] }}>➕ Benutzerdefiniertes Feld hinzufügen:</div>
                      <Input 
                        label="Feldname" 
                        value={newField.label} 
                        onChange={(e) => setNewField((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="z.B. Maximale Traglast"
                      />
                      <Select
                        label="Typ"
                        value={newField.type}
                        onChange={(e) => setNewField((prev) => ({ ...prev, type: e.target.value as any }))}
                        options={[
                          { value: 'TEXT', label: 'Text' },
                          { value: 'NUMBER', label: 'Zahl' },
                          { value: 'DATE', label: 'Datum' },
                          { value: 'BOOL', label: 'Ja/Nein' },
                          { value: 'SELECT', label: 'Auswahl' },
                        ]}
                      />
                      {newField.type === 'SELECT' && (
                        <Input
                          label="Optionen (kommagetrennt)"
                          value={newField.options}
                          onChange={(e) => setNewField((prev) => ({ ...prev, options: e.target.value }))}
                          placeholder="z.B. klein,mittel,groß"
                        />
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={(e) => setNewField((prev) => ({ ...prev, required: e.target.checked }))}
                        />
                        Pflichtfeld
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button size="sm" variant="primary" loading={fieldBusy} disabled={fieldBusy || !newField.label.trim()} onClick={() => handleCreateField(category.id)}>
                          + Feld hinzufügen
                        </Button>
                      </div>
                    </div>
                  </div>
                  
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
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                      {category.name}
                      {!category.hasEngine && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: colors.neutral[500] }}>
                          (Gerät ohne Motor)
                        </span>
                      )}
                      {category.hasEngine && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: colors.success }}>
                          (Maschine mit Motor)
                        </span>
                      )}
                    </h3>
                    {category.notes && <p style={{ margin: 0, fontSize: '14px', color: colors.neutral[600] }}>{category.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(category)}>
                      Bearbeiten
                    </Button>
                    {canDelete && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(category.id)}>
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
