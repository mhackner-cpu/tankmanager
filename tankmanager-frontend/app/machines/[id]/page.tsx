'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiDelete, apiRequest } from '@/lib/api';
import { getUser, hasRole } from '@/lib/auth';
import colors from '@/lib/colors';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import MachineLabel from '@/components/MachineLabel';
import FileUpload from '@/components/FileUpload';
import { FileList } from '@/components/FileList';

type Machine = {
  id: string;
  inventoryNo: string;
  inventoryMiddle?: string;
  designation: string;
  manufacturer?: string;
  modelType?: string;
  serialNumber?: string;
  buildYear?: number;
  counterType: string;
  counterStartValue: number;
  counterCurrent?: number;
  primaryFuelType?: string;
  adBlueRequired: boolean;
  stvzoApproved: boolean;
  licensePlate?: string;
  status: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  creator?: {
    firstName: string;
    lastName: string;
  };
  category: {
    id: string;
    name: string;
    hasEngine: boolean;
  };
  owner: {
    id: string;
    name: string;
  };
  dynamicValues: Array<{
    id: string;
    value: string;
    field: {
      id: string;
      key: string;
      label: string;
      type: string;
    };
  }>;
};

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;

  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLabel, setShowLabel] = useState(false);
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('small');
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0);

  const user = getUser();

  useEffect(() => {
    // Prüfe, ob Benutzer eingeloggt ist
    if (!user) {
      // Speichere aktuelle URL für Rücksprung nach Login
      const currentPath = `/machines/${machineId}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    loadMachine();
  }, [machineId, user, router]);

  async function loadMachine() {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet<Machine>(`/machines/${machineId}`);
      console.log('[MachineDetail] Loaded machine data:', data);
      console.log('[MachineDetail] Serial Number:', data.serialNumber);
      setMachine(data);
    } catch (e: any) {
      // Bei 401 Fehler zur Login-Seite umleiten
      if (e?.message?.includes('401') || e?.message?.toLowerCase().includes('unauthorized')) {
        const currentPath = `/machines/${machineId}`;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      } else {
        setError(e?.message || 'Fehler beim Laden');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Möchten Sie ${machine?.inventoryNo} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      await apiDelete(`/machines/${machineId}`);
      router.push(`/machines/category/${machine?.category.id}`);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Löschen');
    }
  }

  const handleFileUploadSuccess = () => {
    setFileRefreshTrigger((prev) => prev + 1);
  };

  async function handleStatusChange(newStatus: string) {
    try {
      await apiRequest(`/machines/${machineId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      // Reload machine data to reflect the change
      await loadMachine();
    } catch (e: any) {
      alert(e?.message || 'Fehler beim Ändern des Status');
    }
  }

  const canChangeStatus = user && (hasRole('ADMIN') || hasRole('MANAGEMENT'));

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <p>Lädt...</p>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ color: colors.red[600] }}>{error || 'Maschine nicht gefunden'}</p>
        <Button onClick={() => router.push('/machines')} style={{ marginTop: '16px' }}>
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  const fuelTypeLabels: Record<string, string> = {
    DIESEL: 'Diesel',
    GASOLINE: 'Benzin',
    ELECTRIC: 'Elektro',
  };

  const counterTypeLabels: Record<string, string> = {
    HOURS: 'Betriebsstunden',
    KM: 'Kilometer',
    NONE: 'Kein Zähler',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Button
          onClick={() => router.push(`/machines/category/${machine.category.id}`)}
          style={{ marginBottom: '16px', background: colors.neutral[200], color: colors.neutral[700] }}
        >
          ← Zurück zu {machine.category.name}
        </Button>
        <div className="machine-detail-header">
          <div className="machine-detail-header-main">
            <h1 className="machine-inventory-no">{machine.inventoryNo}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              {canChangeStatus ? (
                <select
                  value={machine.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e0',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: 
                      machine.status === 'ACTIVE' ? colors.green[50] : 
                      machine.status === 'LOANED' ? colors.blue[50] : colors.neutral[100],
                    color: 
                      machine.status === 'ACTIVE' ? colors.green[700] : 
                      machine.status === 'LOANED' ? colors.blue[700] : colors.neutral[600],
                  }}
                >
                  <option value="ACTIVE">✓ Aktiv</option>
                  <option value="INACTIVE">⊗ Inaktiv</option>
                  <option value="LOANED">⇄ Verliehen</option>
                </select>
              ) : (
                <StatusBadge status={machine.status as 'ACTIVE' | 'INACTIVE' | 'LOANED'} />
              )}
            </div>
            <p style={{ fontSize: '18px', color: colors.neutral[600], margin: '0 0 8px 0' }}>
              {machine.designation}
            </p>
            <p style={{ fontSize: '14px', color: colors.neutral[500], margin: 0 }}>
              {machine.category.name} • {machine.owner.name}
            </p>
          </div>
          <div className="machine-detail-header-actions">
            {!showLabel && (
              <Button onClick={() => setShowLabel(true)} variant="secondary">
                📄 Aufkleber anzeigen
              </Button>
            )}
            <Button onClick={() => router.push(`/machines/${machine.id}/edit`)}>
              Bearbeiten
            </Button>
            <Button onClick={handleDelete} variant="ghost" style={{ color: colors.red[600], borderColor: colors.red[600] }}>
              Löschen
            </Button>
          </div>
        </div>
        <style jsx>{`
          .machine-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 16px;
          }
          .machine-detail-header-main {
            flex: 1 1 200px;
            min-width: 0;
          }
          .machine-inventory-no {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
            word-break: break-all;
          }
          .machine-detail-header-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          @media (max-width: 600px) {
            .machine-detail-header {
              flex-direction: column;
              align-items: stretch;
              gap: 8px;
            }
            .machine-detail-header-actions {
              flex-direction: column;
              gap: 8px;
            }
            .machine-inventory-no {
              font-size: 22px;
              margin-bottom: 4px;
            }
            .machine-detail-header-actions :global(button) {
              font-size: 15px !important;
              padding: 10px 8px !important;
              min-width: 0 !important;
            }
          }
        `}</style>
      </div>

      {/* QR Code Label (collapsible) */}
      {showLabel && (
        <div style={{ 
          marginBottom: '32px', 
          padding: '24px', 
          background: colors.neutral[50], 
          borderRadius: '8px',
          border: `2px solid ${colors.neutral[200]}`,
          position: 'relative'
        }}>
          {/* Close button (X) */}
          <button
            onClick={() => setShowLabel(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'white',
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: '4px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
              color: colors.neutral[600],
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.neutral[100];
              e.currentTarget.style.borderColor = colors.neutral[400];
              e.currentTarget.style.color = colors.neutral[800];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = colors.neutral[300];
              e.currentTarget.style.color = colors.neutral[600];
            }}
            className="no-print"
          >
            ×
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Inventar-Aufkleber
          </h2>
          <p style={{ fontSize: '14px', color: colors.neutral[600], marginBottom: '16px' }}>
            Drucken Sie diesen Aufkleber aus und bringen Sie ihn an der Maschine an. 
            Der QR-Code ermöglicht schnellen Zugriff auf die Maschinendetails per Smartphone.
          </p>
          
          {/* Size Selection */}
          <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: colors.neutral[700] }}>Größe:</span>
            <button
              onClick={() => setLabelSize('small')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: `2px solid ${labelSize === 'small' ? colors.blue[600] : colors.neutral[300]}`,
                background: labelSize === 'small' ? colors.blue[50] : 'white',
                color: labelSize === 'small' ? colors.blue[700] : colors.neutral[600],
                fontWeight: labelSize === 'small' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Klein (8×6cm)
            </button>
            <button
              onClick={() => setLabelSize('medium')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: `2px solid ${labelSize === 'medium' ? colors.blue[600] : colors.neutral[300]}`,
                background: labelSize === 'medium' ? colors.blue[50] : 'white',
                color: labelSize === 'medium' ? colors.blue[700] : colors.neutral[600],
                fontWeight: labelSize === 'medium' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Mittel (14×10cm)
            </button>
            <button
              onClick={() => setLabelSize('large')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: `2px solid ${labelSize === 'large' ? colors.blue[600] : colors.neutral[300]}`,
                background: labelSize === 'large' ? colors.blue[50] : 'white',
                color: labelSize === 'large' ? colors.blue[700] : colors.neutral[600],
                fontWeight: labelSize === 'large' ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Groß (A4, 16×22cm)
            </button>
          </div>

          <MachineLabel
            inventoryNo={machine.inventoryNo}
            designation={machine.designation}
            category={machine.category.name}
            owner={machine.owner.name}
            machineId={machine.id}
            size={labelSize}
          />
        </div>
      )}

      {/* Info Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        {/* Stammdaten */}
        <div
            style={{
              background: 'white',
              borderRadius: '8px',
              border: `1px solid ${colors.neutral[200]}`,
              padding: '20px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
              Stammdaten
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <InfoRow label="Hersteller" value={machine.manufacturer} />
              <InfoRow label="Modell/Typ" value={machine.modelType} />
              <InfoRow label="Seriennummer" value={machine.serialNumber} />
              <InfoRow label="Baujahr" value={machine.buildYear} />
            </div>
          </div>

          {/* Zähler */}
          {machine.category.hasEngine && (
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                border: `1px solid ${colors.neutral[200]}`,
                padding: '20px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
                Zähler
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <InfoRow label="Zählerart" value={counterTypeLabels[machine.counterType]} />
                {machine.counterType !== 'NONE' && (
                  <>
                    <InfoRow
                      label="Aktueller Zählerstand"
                      value={machine.counterCurrent ? `${machine.counterCurrent} ${machine.counterType === 'HOURS' ? 'h' : 'km'}` : 'Nicht erfasst'}
                    />
                    <div>
                      <InfoRow
                        label="Voraussichtl. Laufleistung /a"
                        value="-"
                      />
                      <p style={{ fontSize: '12px', color: colors.neutral[500], margin: '4px 0 0 0', paddingLeft: '180px' }}>
                        (wird nach 3+ Tankungen berechnet)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Kraftstoff */}
          {machine.category.hasEngine && (
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                border: `1px solid ${colors.neutral[200]}`,
                padding: '20px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
                Kraftstoff
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <InfoRow
                  label="Primärer Kraftstoff"
                  value={machine.primaryFuelType ? fuelTypeLabels[machine.primaryFuelType] : 'Nicht angegeben'}
                />
                {machine.primaryFuelType === 'DIESEL' && (
                  <InfoRow label="AdBlue erforderlich" value={machine.adBlueRequired ? 'Ja' : 'Nein'} />
                )}
              </div>
            </div>
          )}

          {/* StVZO-Zulassung und Kennzeichen */}
          {machine.stvzoApproved && (
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                border: `1px solid ${colors.neutral[200]}`,
                padding: '20px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
                StVZO-Zulassung
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                <InfoRow label="StVZO zugelassen" value="Ja" />
                {machine.licensePlate && <InfoRow label="Kennzeichen" value={machine.licensePlate} />}
              </div>
            </div>
          )}

          {/* Dynamische Felder */}
          {machine.dynamicValues.length > 0 && (
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                border: `1px solid ${colors.neutral[200]}`,
                padding: '20px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
                Kategorie-spezifische Felder
              </h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {machine.dynamicValues.map((dv) => (
                  <InfoRow key={dv.id} label={dv.field.label} value={dv.value || '-'} />
                ))}
              </div>
            </div>
          )}

          {/* Metadaten */}
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              border: `1px solid ${colors.neutral[200]}`,
              padding: '20px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
              Metadaten
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <InfoRow
                label="Angelegt am"
                value={new Date(machine.createdAt).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
              <InfoRow 
                label="Angelegt von" 
                value={machine.creator ? `${machine.creator.firstName} ${machine.creator.lastName}` : 'System'} 
              />
              {machine.counterType !== 'NONE' && (
                <InfoRow
                  label="Startzähler beim Anlegen"
                  value={`${machine.counterStartValue} ${machine.counterType === 'HOURS' ? 'h' : 'km'}`}
                />
              )}
            </div>
          </div>

          {/* Notizen */}
          {machine.notes && (
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                border: `1px solid ${colors.neutral[200]}`,
                padding: '20px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>
                Notizen
              </h2>
              <p style={{ margin: 0, color: colors.neutral[700], whiteSpace: 'pre-wrap' }}>
                {machine.notes}
              </p>
            </div>
          )}

          {/* Dateien & Dokumente */}
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              border: `1px solid ${colors.neutral[200]}`,
              padding: '20px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
              📄 Dateien & Dokumente
            </h2>
            <FileUpload machineId={machineId} onUploadSuccess={handleFileUploadSuccess} />
            <div style={{ marginTop: '24px' }}>
              <FileList machineId={machineId} refreshTrigger={fileRefreshTrigger} />
            </div>
          </div>
      </div>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '14px', color: colors.neutral[500] }}>{label}:</div>
      <div style={{ fontSize: '14px', color: colors.neutral[900], fontWeight: 500, wordBreak: 'break-word', overflowWrap: 'break-word', marginLeft: 16 }}>
        {value || '-'}
      </div>
    </div>
  );
}
