'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Alert from '@/components/Alert';
import colors from '@/lib/colors';
import { createMachineSchema, updateMachineSchema } from '@/lib/schemas/machine.schema';
import { validateData, getFirstError } from '@/lib/validation';

type Owner = { id: string; name: string };
type Category = {
  id: string;
  name: string;
  hasEngine: boolean;
  inventoryPrefix?: string;
  inventoryMiddleHint?: string;
};

type CategoryField = {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "BOOL" | "SELECT";
  required: boolean;
  optionsJson: string | null;
  sortOrder: number;
};

interface MachineFormProps {
  machineId?: string;
  initialCategoryId?: string;
  onSuccess?: (categoryId: string) => void;
}

export default function MachineForm({ machineId, initialCategoryId, onSuccess }: MachineFormProps) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fields, setFields] = useState<CategoryField[]>([]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNotes, setNewCategoryNotes] = useState('');
  const [newCategoryHasEngine, setNewCategoryHasEngine] = useState(true);
  const [newCategoryInventoryPrefix, setNewCategoryInventoryPrefix] = useState('');
  const [newCategoryInventoryMiddleHint, setNewCategoryInventoryMiddleHint] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryFields, setNewCategoryFields] = useState<
    Array<{ id: string; label: string; key: string; type: CategoryField['type']; required: boolean; options: string }>
  >([]);

  const [ownerId, setOwnerId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [inventoryNo, setInventoryNo] = useState("");
  const [inventoryMiddle, setInventoryMiddle] = useState("");
  const [nextInventoryNumber, setNextInventoryNumber] = useState(1);
  const [designation, setDesignation] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelType, setModelType] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [buildYear, setBuildYear] = useState<number | "">("");
  const [counterType, setCounterType] = useState<"HOURS" | "KM" | "NONE">("HOURS");
  const [counterStartValue, setCounterStartValue] = useState<number | "">(0);
  const [primaryFuelType, setPrimaryFuelType] = useState<"DIESEL" | "GASOLINE" | "ELECTRIC" | "">("DIESEL");
  const [adBlueRequired, setAdBlueRequired] = useState(false);  
  const [stvzoApproved, setStvzoApproved] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "LOANED">("ACTIVE");
  const [notes, setNotes] = useState("");

  const [dynamic, setDynamic] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Serial number duplicate detection
  const [serialNumberWarning, setSerialNumberWarning] = useState<{ inventoryNo: string; designation: string } | null>(null);
  const [serialNumberConfirmed, setSerialNumberConfirmed] = useState(false);
  const [serialCheckTimeout, setSerialCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load existing machine if editing
  useEffect(() => {
    if (!machineId) return;

    setLoading(true);
    apiGet(`/machines/${machineId}`)
      .then((machine: any) => {
        setOwnerId(machine.ownerId);
        setCategoryId(machine.categoryId);
        setInventoryNo(machine.inventoryNo);
        setInventoryMiddle(machine.inventoryMiddle || "");
        setDesignation(machine.designation || "");
        setManufacturer(machine.manufacturer || "");
        setModelType(machine.modelType || "");
        setSerialNumber(machine.serialNumber || "");
        setBuildYear(machine.buildYear || "");
        setCounterType(machine.counterType);
        setCounterStartValue(machine.counterStartValue);
        setPrimaryFuelType(machine.primaryFuelType || "");
        setAdBlueRequired(machine.adBlueRequired || false);
        setStvzoApproved(machine.stvzoApproved || false);
        setLicensePlate(machine.licensePlate || "");
        setStatus(machine.status || "ACTIVE");
        setNotes(machine.notes || "");

        const dynamicMap: Record<string, string> = {};
        machine.dynamicValues.forEach((dv: any) => {
          dynamicMap[dv.field.key] = dv.value || "";
        });
        setDynamic(dynamicMap);
      })
      .catch((e) => setError(e?.message ?? "Fehler beim Laden der Maschine"))
      .finally(() => setLoading(false));
  }, [machineId]);

  // Load owners
  useEffect(() => {
    apiGet<Owner[]>("/owners")
      .then(setOwners)
      .catch((e) => setError(String(e)));
  }, []);

  // Load categories
  useEffect(() => {
    apiGet<Category[]>('/categories')
      .then((cats) => {
        setCategories(cats);
        // Set initial category if provided
        if (initialCategoryId && !machineId) {
          setCategoryId(initialCategoryId);
        }
      })
      .catch((e) => setError(String(e)));
  }, [initialCategoryId, machineId]);

  // Set defaults based on category hasEngine
  useEffect(() => {
    if (!categoryId || machineId) return;
    const selectedCategory = categories.find((c) => c.id === categoryId);
    if (selectedCategory && !selectedCategory.hasEngine) {
      setCounterType('NONE');
      setPrimaryFuelType('');
      setAdBlueRequired(false);
    }
  }, [categoryId, categories, machineId]);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Load next inventory number when category changes
  useEffect(() => {
    if (!categoryId || machineId) {
      setNextInventoryNumber(1);
      return;
    }

    const cat = categories.find((c) => c.id === categoryId);
    if (cat?.inventoryPrefix) {
      apiGet<number>(`/categories/${categoryId}/next-inventory-number`)
        .then(setNextInventoryNumber)
        .catch(() => setNextInventoryNumber(1));
    }
  }, [categoryId, categories, machineId]);

  // Load fields when category changes
  useEffect(() => {
    if (!categoryId) {
      setFields([]);
      setDynamic({});
      return;
    }

    loadCategoryFields();
  }, [categoryId]);

  async function loadCategoryFields() {
    if (!categoryId) return;
    
    try {
      const f = await apiGet<CategoryField[]>(`/category-fields?categoryId=${encodeURIComponent(categoryId)}`);
      const sorted = [...f].sort((a, b) => a.sortOrder - b.sortOrder);
      setFields(sorted);

      // Behalte existierende Werte, füge neue Felder mit leerem Wert hinzu
      setDynamic((prev) => {
        const next: Record<string, string> = { ...prev };
        for (const field of sorted) {
          if (!(field.key in next)) {
            next[field.key] = "";
          }
        }
        return next;
      });
    } catch (e) {
      setError(String(e));
    }
  }

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  // Check serial number for duplicates
  async function checkSerialNumber(serial: string) {
    if (!serial?.trim() || machineId) {
      setSerialNumberWarning(null);
      setSerialNumberConfirmed(false);
      return;
    }

    console.log('[SerialCheck] Checking serial:', serial.trim());

    try {
      const existing = await apiGet<{ id: string; inventoryNo: string; designation: string } | null>(
        `/machines/check-serial/${encodeURIComponent(serial.trim())}`
      );
      
      console.log('[SerialCheck] API response:', existing);
      
      if (existing && existing.id) {
        console.log('[SerialCheck] DUPLICATE FOUND:', existing.inventoryNo, existing.designation);
        setSerialNumberWarning({
          inventoryNo: existing.inventoryNo,
          designation: existing.designation,
        });
        setSerialNumberConfirmed(false);
      } else {
        console.log('[SerialCheck] No duplicate');
        setSerialNumberWarning(null);
        setSerialNumberConfirmed(false);
      }
    } catch (e) {
      console.error('[SerialCheck] Serial number check failed:', e);
      // Silently fail - don't block user if API call fails
      setSerialNumberWarning(null);
    }
  }

  async function createCategoryInline() {
    if (!newCategoryName.trim()) {
      setError('Bitte einen Kategorienamen angeben');
      return;
    }
    setCreatingCategory(true);
    setError(null);
    try {
      const createdCategory = await apiPost<Category>('/categories', {
        name: newCategoryName.trim(),
        notes: newCategoryNotes || undefined,
        hasEngine: newCategoryHasEngine,
        inventoryPrefix: newCategoryInventoryPrefix.trim() || undefined,
        inventoryMiddleHint: newCategoryInventoryMiddleHint.trim() || undefined,
      });

      // create category fields if provided
      for (let i = 0; i < newCategoryFields.length; i++) {
        const f = newCategoryFields[i];
        const optionsJson = f.type === 'SELECT' ? JSON.stringify(
          f.options
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        ) : undefined;

        await apiPost('/category-fields', {
          categoryId: createdCategory.id,
          key: f.key || slugify(f.label),
          label: f.label,
          type: f.type,
          required: f.required,
          optionsJson,
          sortOrder: i,
        });
      }

      const refreshed = await apiGet<Category[]>('/categories');
      setCategories(refreshed);
      setCategoryId(createdCategory.id);
      
      // Felder der neuen Kategorie laden
      await loadCategoryFields();
      
      setShowCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryNotes('');
      setNewCategoryHasEngine(true);
      setNewCategoryInventoryPrefix('');
      setNewCategoryInventoryMiddleHint('');
      setNewCategoryFields([]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setCreatingCategory(false);
    }
  }

  function addNewFieldRow() {
    setNewCategoryFields((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: '',
        key: '',
        type: 'TEXT',
        required: false,
        options: '',
      },
    ]);
  }

  function updateNewField(id: string, patch: Partial<{ label: string; key: string; type: CategoryField['type']; required: boolean; options: string }>) {
    setNewCategoryFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...patch };
        if (patch.label && !patch.key) {
          next.key = slugify(patch.label);
        }
        return next;
      })
    );
  }

  function removeNewField(id: string) {
    setNewCategoryFields((prev) => prev.filter((f) => f.id !== id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    // Validierung
    if (!ownerId || !categoryId || !designation) {
      setError("Bitte füllen Sie alle Pflichtfelder aus (Betrieb, Kategorie, Bezeichnung)");
      return;
    }

    // Seriennummer Duplikat-Warnung prüfen
    if (!machineId && serialNumberWarning && !serialNumberConfirmed) {
      setError("Bitte bestätigen Sie, dass Sie das Gerät trotz doppelter Seriennummer anlegen möchten.");
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);
    if (selectedCat?.inventoryPrefix) {
      if (!inventoryMiddle?.trim()) {
        setError("Bitte den Mittelteil der Inventarnummer angeben");
        return;
      }
    } else {
      if (!inventoryNo?.trim()) {
        setError("Bitte Inventarnummer angeben");
        return;
      }
    }

    // Payload vorbereiten
    const payload: any = {
      ownerId,
      categoryId,
      designation: designation || undefined,
      manufacturer: manufacturer || undefined,
      modelType: modelType || undefined,
      serialNumber: serialNumber?.trim() || undefined,
      buildYear: buildYear === "" ? undefined : Number(buildYear) || undefined,
      counterType,
      counterStartValue: counterStartValue === "" ? 0 : Number(counterStartValue),
      primaryFuelType: primaryFuelType === "" ? undefined : primaryFuelType,
      adBlueRequired,
      stvzoApproved,
      licensePlate: licensePlate || undefined,
      status,
      notes: notes || undefined,
      dynamic,
    };

    // Entweder inventoryNo oder inventoryMiddle
    if (selectedCat?.inventoryPrefix) {
      payload.inventoryMiddle = inventoryMiddle.trim();
    } else {
      payload.inventoryNo = inventoryNo.trim();
    }

    // Zod Validierung
    const schema = machineId ? updateMachineSchema : createMachineSchema;
    const validation = validateData(schema, payload);
    
    if (!validation.success) {
      setValidationErrors(validation.errors);
      setError("Bitte korrigieren Sie die Eingabefehler");
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0];
      console.error('[Validation] Fehler:', validation.errors);
      return;
    }

    setLoading(true);

    try {
      if (machineId) {
        await apiPatch(`/machines/${machineId}`, validation.data);
        setSuccess("Maschine aktualisiert ✅");
      } else {
        await apiPost("/machines", validation.data);
        setSuccess("Maschine angelegt ✅");
      }

      // Reset warning after successful creation
      setSerialNumberWarning(null);
      setSerialNumberConfirmed(false);

      setTimeout(() => {
        onSuccess?.(categoryId);
      }, 1000);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "grid",
        gap: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      {error && (
        <Alert
          type="error"
          title="Fehler"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      <Select
        label="Betrieb*"
        value={ownerId}
        onChange={(e) => setOwnerId(e.target.value)}
        options={owners.map((o) => ({ value: o.id, label: o.name }))}
        placeholder="Bitte wählen…"
      />

      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <Select
          label="Kategorie*"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Bitte wählen…"
          style={{ flex: 1 }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowCategoryForm((v) => !v)}>
          Neue Kategorie
        </Button>
      </div>

      {showCategoryForm && (
        <div style={{ border: `1px solid ${colors.neutral[200]}`, padding: '12px', borderRadius: '6px', display: 'grid', gap: '8px' }}>
          <Input label="Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
          <Input label="Notizen (optional)" value={newCategoryNotes} onChange={(e) => setNewCategoryNotes(e.target.value)} />
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', padding: '8px', backgroundColor: colors.neutral[50], borderRadius: '4px' }}>
            <input
              type="checkbox"
              checked={newCategoryHasEngine}
              onChange={(e) => setNewCategoryHasEngine(e.target.checked)}
            />
            <div>
              <strong>Maschine (mit Motor)</strong>
              <div style={{ fontSize: '12px', color: colors.neutral[600] }}>Abwählen für Geräte ohne Motor (z.B. Anhänger, Container)</div>
            </div>
          </label>

          <div style={{ border: `1px solid ${colors.neutral[100]}`, padding: '12px', borderRadius: '6px', backgroundColor: colors.neutral[50] }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Inventarnummer-System (optional)</h4>
            <Input
              label="Präfix (z.B. 'AR' für Abrollcontainer)"
              value={newCategoryInventoryPrefix}
              onChange={(e) => setNewCategoryInventoryPrefix(e.target.value)}
              placeholder="AR"
            />
            <Input
              label="Hinweis für Mittelteil (z.B. 'm³ angeben')"
              value={newCategoryInventoryMiddleHint}
              onChange={(e) => setNewCategoryInventoryMiddleHint(e.target.value)}
              placeholder="z.B. m³ angeben"
            />
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: colors.neutral[600] }}>
              Format: {newCategoryInventoryPrefix || 'PREFIX'}-MIDDLE-001, -002, ...
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px' }}>Felder (optional)</h4>
            <Button type="button" variant="secondary" size="sm" onClick={addNewFieldRow}>
              Feld hinzufügen
            </Button>
          </div>

          {newCategoryFields.length === 0 && <p style={{ margin: 0, color: colors.neutral[500], fontSize: '13px' }}>Noch keine Felder hinzugefügt.</p>}

          {newCategoryFields.map((f, idx) => (
            <div key={f.id} style={{ border: `1px solid ${colors.neutral[200]}`, padding: '8px', borderRadius: '6px', display: 'grid', gap: '6px' }}>
              <Input label="Feldname" value={f.label} onChange={(e) => updateNewField(f.id, { label: e.target.value })} />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Select
                  label="Typ"
                  value={f.type}
                  onChange={(e) => updateNewField(f.id, { type: e.target.value as CategoryField['type'] })}
                  options={[
                    { value: 'TEXT', label: 'Text' },
                    { value: 'NUMBER', label: 'Zahl' },
                    { value: 'DATE', label: 'Datum' },
                    { value: 'BOOL', label: 'Ja/Nein' },
                    { value: 'SELECT', label: 'Auswahl' },
                  ]}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <input type="checkbox" checked={f.required} onChange={(e) => updateNewField(f.id, { required: e.target.checked })} />
                  Pflichtfeld
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeNewField(f.id)}>
                  Entfernen
                </Button>
              </div>
              {f.type === 'SELECT' && (
                <Input
                  label="Optionen (durch Komma getrennt)"
                  value={f.options}
                  onChange={(e) => updateNewField(f.id, { options: e.target.value })}
                  placeholder="z.B. Diesel, AdBlue"
                />
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCategoryForm(false)}>
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={creatingCategory}
              disabled={creatingCategory}
              onClick={createCategoryInline}
            >
              Speichern
            </Button>
          </div>
        </div>
      )}

      {/* Inventarnummer: Automatisch oder Manuell */}
      {selectedCategory?.inventoryPrefix ? (
        <div>
          <Input
            label={`Inventar-Mittelteil* ${selectedCategory.inventoryMiddleHint ? `(${selectedCategory.inventoryMiddleHint})` : ''}`}
            value={inventoryMiddle}
            onChange={(e) => setInventoryMiddle(e.target.value)}
            placeholder={selectedCategory.inventoryMiddleHint || "z.B. 38"}
          />
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: colors.neutral[600] }}>
            Inventarnummer wird automatisch generiert: <strong>{selectedCategory.inventoryPrefix}-{inventoryMiddle || 'XXX'}-{nextInventoryNumber.toString().padStart(3, '0')}</strong>
          </p>
        </div>
      ) : (
        <Input
          label="Inventarnummer*"
          value={inventoryNo}
          onChange={(e) => setInventoryNo(e.target.value)}
          placeholder="z.B. AR38-02"
        />
      )}

      <Input
        label="Bezeichnung*"
        value={designation}
        onChange={(e) => setDesignation(e.target.value)}
        placeholder="z.B. Abrollcontainer 38m³"
        error={getFirstError(validationErrors, 'designation')}
      />

      <Input
        label="Hersteller"
        value={manufacturer}
        onChange={(e) => setManufacturer(e.target.value)}
        error={getFirstError(validationErrors, 'manufacturer')}
      />

      <Input
        label="Modell / Typ"
        value={modelType}
        onChange={(e) => setModelType(e.target.value)}
        error={getFirstError(validationErrors, 'modelType')}
      />

      <Input
        label="Serien/Fahrgestellnummer"
        value={serialNumber}
        onChange={(e) => {
          const value = e.target.value;
          setSerialNumber(value);
          setSerialNumberWarning(null);
          setSerialNumberConfirmed(false);
          
          // Clear existing timeout
          if (serialCheckTimeout) {
            clearTimeout(serialCheckTimeout);
          }
          
          // Set new timeout to check after 1 second of no typing
          if (value.trim()) {
            const timeout = setTimeout(() => {
              checkSerialNumber(value);
            }, 1000);
            setSerialCheckTimeout(timeout);
          }
        }}
        onBlur={(e) => {
          // Also check on blur for immediate feedback
          if (serialCheckTimeout) {
            clearTimeout(serialCheckTimeout);
          }
          checkSerialNumber(e.target.value);
        }}
        placeholder="Optional"
        error={getFirstError(validationErrors, 'serialNumber')}
      />

      {serialNumberWarning && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: colors.warning + '20', 
          border: `2px solid ${colors.warning}`, 
          borderRadius: '6px',
          marginTop: '-8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: colors.neutral[800] }}>
                Seriennummer bereits vergeben
              </div>
              <div style={{ fontSize: '13px', color: colors.neutral[700], marginBottom: '8px' }}>
                Diese Seriennummer wird bereits von <strong>{serialNumberWarning.designation}</strong> (Inventarnr.: <strong>{serialNumberWarning.inventoryNo}</strong>) verwendet.
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={serialNumberConfirmed}
                  onChange={(e) => setSerialNumberConfirmed(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Gerät trotzdem anlegen</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <Input
        label="Baujahr"
        type="number"
        value={buildYear}
        onChange={(e) => setBuildYear(e.target.value ? parseInt(e.target.value) : "")}
      />

      {/* Zähler- und Kraftstoff-Felder nur für Maschinen mit Motor */}
      {selectedCategory?.hasEngine && (
        <>
          <Select
            label="Zählerart"
            value={counterType}
            onChange={(e) => setCounterType(e.target.value as any)}
            options={[
              { value: "HOURS", label: "Betriebsstunden (h)" },
              { value: "KM", label: "Kilometer (km)" },
              { value: "NONE", label: "Kein Zähler" },
            ]}
          />

          {counterType !== "NONE" && (
            <Input
              label={`Startzähler (${counterType === "HOURS" ? "h" : "km"})`}
              type="number"
              value={counterStartValue}
              onChange={(e) => setCounterStartValue(e.target.value ? parseFloat(e.target.value) : "")}
            />
          )}

          <Select
            label="Primärer Kraftstoff"
            value={primaryFuelType}
            onChange={(e) => setPrimaryFuelType(e.target.value as any)}
            options={[
              { value: "", label: "Kein Kraftstoff" },
              { value: "DIESEL", label: "Diesel" },
              { value: "GASOLINE", label: "Benzin" },
              { value: "ELECTRIC", label: "Elektro" },
            ]}
            placeholder="Optional"
          />

          {primaryFuelType === "DIESEL" && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={adBlueRequired}
                onChange={(e) => setAdBlueRequired(e.target.checked)}
              />
              AdBlue erforderlich
            </label>
          )}
        </>
      )}

      {/* StVZO-Zulassung und Kennzeichen */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginTop: '8px' }}>
        <input
          type="checkbox"
          checked={stvzoApproved}
          onChange={(e) => setStvzoApproved(e.target.checked)}
        />
        StVZO zugelassen
      </label>

      {stvzoApproved && (
        <Input
          label="Kennzeichen"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          placeholder="z.B. B-AB 1234"
        />
      )}

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE" | "LOANED")}
        options={[
          { value: "ACTIVE", label: "✓ Aktiv" },
          { value: "INACTIVE", label: "⊗ Inaktiv" },
          { value: "LOANED", label: "⇄ Verliehen" },
        ]}
      />

      <Input
        label="Notizen"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Zusätzliche Informationen"
        asTextarea={true}
      />

      {/* Dynamic Fields */}
      {fields.length > 0 && (
        <div style={{ paddingTop: "12px", borderTop: `1px solid ${colors.neutral[200]}` }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 600 }}>
            Kategorie-spezifische Felder
          </h3>
          {fields.map((field) => (
            <div key={field.id} style={{ marginBottom: "12px" }}>
              {field.type === "SELECT" && field.optionsJson ? (
                <Select
                  label={`${field.label}${field.required ? "*" : ""}`}
                  value={dynamic[field.key] || ""}
                  onChange={(e) =>
                    setDynamic({ ...dynamic, [field.key]: e.target.value })
                  }
                  options={JSON.parse(field.optionsJson).map((opt: string) => ({
                    value: opt,
                    label: opt,
                  }))}
                  placeholder="Bitte wählen…"
                />
              ) : field.type === "BOOL" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    id={field.id}
                    checked={dynamic[field.key] === "true"}
                    onChange={(e) =>
                      setDynamic({
                        ...dynamic,
                        [field.key]: e.target.checked ? "true" : "false",
                      })
                    }
                  />
                  <label htmlFor={field.id}>{field.label}</label>
                </div>
              ) : (
                <Input
                  label={`${field.label}${field.required ? "*" : ""}`}
                  type={field.type === "DATE" ? "date" : field.type === "NUMBER" ? "number" : "text"}
                  value={dynamic[field.key] || ""}
                  onChange={(e) =>
                    setDynamic({ ...dynamic, [field.key]: e.target.value })
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading}
        >
          Speichern
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => window.history.back()}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
