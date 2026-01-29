'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import colors from '@/lib/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import StatusBadge from '@/components/StatusBadge';

type Category = {
  id: string;
  name: string;
  hasEngine: boolean;
};

type Machine = {
  id: string;
  inventoryNo: string;
  designation: string;
  manufacturer?: string;
  modelType?: string;
  serialNo?: string;
  buildYear?: number;
  description?: string;
  licensePlate?: string;
  status: string;
  owner?: {
    id: string;
    name: string;
  };
};

export default function CategoryMachinesPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [categoryId]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [cat, machs] = await Promise.all([
        apiGet<Category>(`/categories/${categoryId}`),
        apiGet<Machine[]>(`/machines?categoryId=${categoryId}`),
      ]);

      setCategory(cat);
      // Sortiere nach Inventarnummer (numerisch)
      const sorted = machs.sort((a, b) => {
        // Extrahiere die fortlaufende Nummer am Ende (001, 002, etc.)
        const matchA = a.inventoryNo.match(/(\d+)$/);
        const matchB = b.inventoryNo.match(/(\d+)$/);
        
        if (matchA && matchB) {
          return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
        }
        
        // Fallback: Alphabetisch
        return a.inventoryNo.localeCompare(b.inventoryNo);
      });
      
      setMachines(sorted);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  // Gefilterte und sortierte Maschinen
  const filteredMachines = useMemo(() => {
    if (!search.trim()) return machines;
    
    // Split search into multiple terms (e.g., "Meiller 2019" -> ["meiller", "2019"])
    const terms = search.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    return machines.filter((m) => {
      // For each machine, create a searchable string with all relevant fields
      const searchableText = [
        m.inventoryNo,
        m.designation,
        m.manufacturer || '',
        m.modelType || '',
        m.serialNo || '',
        m.buildYear?.toString() || '',
        m.description || '',
        m.licensePlate || '',
        m.owner?.name || '',
      ].join(' ').toLowerCase();
      
      // All terms must be found in the searchable text
      return terms.every(term => searchableText.includes(term));
    });
  }, [machines, search]);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <p>Lädt...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ color: colors.red[600] }}>{error || 'Kategorie nicht gefunden'}</p>
        <Button onClick={() => router.push('/machines')} style={{ marginTop: '16px' }}>
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Button
          onClick={() => router.push('/machines')}
          style={{ marginBottom: '16px', background: colors.neutral[200], color: colors.neutral[700] }}
        >
          ← Zurück zur Übersicht
        </Button>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
          {category.name}
        </h1>
        <p style={{ color: colors.neutral[600], margin: 0 }}>
          {category.hasEngine ? 'Maschinen mit Motor' : 'Geräte ohne Motor'} • {filteredMachines.length} {filteredMachines.length === 1 ? 'Eintrag' : 'Einträge'}
          {search && ` (gefiltert von ${machines.length})`}
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <Input
          placeholder="Suchen nach Inventarnummer, Bezeichnung, Hersteller, Modell..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* New Button */}
      <div style={{ marginBottom: '24px' }}>
        <Button onClick={() => router.push(`/machines/new?categoryId=${categoryId}`)}>
          + Neue {category.hasEngine ? 'Maschine' : 'Gerät'} anlegen
        </Button>
      </div>

      {/* Machines Table */}
      {filteredMachines.length === 0 ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            background: colors.neutral[50],
            borderRadius: '8px',
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <p style={{ color: colors.neutral[600], margin: 0 }}>
            {search ? 'Keine Ergebnisse gefunden' : `Noch keine ${category.hasEngine ? 'Maschinen' : 'Geräte'} in dieser Kategorie`}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            border: `1px solid ${colors.neutral[200]}`,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: colors.neutral[50], borderBottom: `1px solid ${colors.neutral[200]}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>
                  Inventarnummer
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>
                  Bezeichnung
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>
                  Hersteller
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>
                  Modell/Typ
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMachines.map((machine) => (
                <tr
                  key={machine.id}
                  style={{
                    borderBottom: `1px solid ${colors.neutral[100]}`,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.neutral[50])}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => router.push(`/machines/${machine.id}`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: colors.blue[600],
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '14px',
                      }}
                    >
                      {machine.inventoryNo}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{machine.designation}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: colors.neutral[600] }}>
                    {machine.manufacturer || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: colors.neutral[600] }}>
                    {machine.modelType || '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={machine.status as 'ACTIVE' | 'INACTIVE' | 'LOANED'} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Button
                      onClick={() => router.push(`/machines/${machine.id}/edit`)}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      Bearbeiten
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
