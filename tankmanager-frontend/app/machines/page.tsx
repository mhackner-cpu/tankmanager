'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import colors from '@/lib/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import * as XLSX from 'xlsx';

type Category = {
  id: string;
  name: string;
  hasEngine: boolean;
  inventoryPrefix?: string;
  _count?: {
    machines: number;
  };
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
  categoryId: string;
  owner?: {
    id: string;
    name: string;
  };
};

export default function MachinesOverviewPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allMachines, setAllMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadCategories();
  }, [router]);

  async function loadCategories() {
    setLoading(true);
    setError(null);

    try {
      const cats = await apiGet<Category[]>('/categories');
      
      // Lade Maschinenanzahl für jede Kategorie und alle Maschinen
      const catsWithCounts = await Promise.all(
        cats.map(async (cat) => {
          try {
            const machines = await apiGet<any[]>(`/machines?categoryId=${cat.id}`);
            return { ...cat, _count: { machines: machines.length } };
          } catch {
            return { ...cat, _count: { machines: 0 } };
          }
        })
      );

      // Lade alle Maschinen für die Suche
      try {
        const machines = await apiGet<Machine[]>('/machines');
        setAllMachines(machines);
      } catch {
        setAllMachines([]);
      }

      setCategories(catsWithCounts);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden der Kategorien');
    } finally {
      setLoading(false);
    }
  }

  async function exportToCSV() {
    setExportLoading(true);
    try {
      const data = await apiGet<any[]>('/machines/export/all');
      
      // Erstelle Excel-Workbook mit mehreren Sheets (ein Sheet pro Kategorie)
      const workbook = XLSX.utils.book_new();
      
      // Für jede Kategorie ein eigenes Sheet
      data.forEach((categoryData) => {
        if (categoryData.machines.length === 0) return; // Überspringe leere Kategorien
        
        // Spaltenüberschriften
        const headers = [
          'Inventarnummer',
          'Bezeichnung',
          'Hersteller',
          'Modell/Typ',
          'Seriennummer',
          'Baujahr',
          'Beschreibung',
          'Status',
          'StVZO zugelassen',
          'Kennzeichen',
          'Betrieb',
          'Zählertyp',
          'Zählerstand Start',
          'Zählerstand Aktuell',
          'Kraftstoffart',
          'AdBlue erforderlich',
          'Notizen',
        ];
        
        // Dynamische Felder hinzufügen
        categoryData.fields.forEach((field: any) => {
          headers.push(field.label);
        });
        
        // Datenzeilen
        const rows = categoryData.machines.map((machine: any) => {
          const row: any = {
            'Inventarnummer': machine.inventoryNo || '',
            'Bezeichnung': machine.designation || '',
            'Hersteller': machine.manufacturer || '',
            'Modell/Typ': machine.modelType || '',
            'Seriennummer': machine.serialNumber || '',
            'Baujahr': machine.buildYear || '',
            'Beschreibung': (machine.description || '').replace(/\n/g, ' '),
            'Status': machine.status || '',
            'StVZO zugelassen': machine.stvzoApproved ? 'Ja' : 'Nein',
            'Kennzeichen': machine.licensePlate || '',
            'Betrieb': machine.ownerName || '',
            'Zählertyp': machine.counterType || '',
            'Zählerstand Start': machine.counterStartValue || '',
            'Zählerstand Aktuell': machine.counterCurrent || '',
            'Kraftstoffart': machine.primaryFuelType || '',
            'AdBlue erforderlich': machine.adBlueRequired ? 'Ja' : 'Nein',
            'Notizen': (machine.notes || '').replace(/\n/g, ' '),
          };
          
          // Dynamische Felder
          categoryData.fields.forEach((field: any) => {
            row[field.label] = machine.dynamicFields[field.key] || '';
          });
          
          return row;
        });
        
        // Erstelle Worksheet aus Daten
        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        
        // Sheet-Name (max 31 Zeichen für Excel)
        let sheetName = categoryData.categoryName;
        if (sheetName.length > 31) {
          sheetName = sheetName.substring(0, 31);
        }
        
        // Füge Sheet zum Workbook hinzu
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      // Excel-Datei generieren und downloaden
      XLSX.writeFile(workbook, `maschinen_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (e: any) {
      alert('Fehler beim Export: ' + (e?.message || 'Unbekannter Fehler'));
    } finally {
      setExportLoading(false);
    }
  }

  // Gefilterte Maschinen basierend auf Suchbegriff
  const filteredMachines = useMemo(() => {
    if (!search.trim()) return [];
    
    // Split search into multiple terms (e.g., "Meiller 2019" -> ["meiller", "2019"])
    const terms = search.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    return allMachines.filter((m) => {
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
  }, [allMachines, search]);

  const machinesCategories = categories.filter((c) => c.hasEngine);
  const devicesCategories = categories.filter((c) => !c.hasEngine);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <p>Lädt Kategorien...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0' }}>
          Maschinen & Geräte
        </h1>
        <p style={{ color: colors.neutral[600], margin: 0 }}>
          Wählen Sie eine Kategorie aus, um die zugehörigen Einträge anzuzeigen
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '24px', padding: '12px', background: colors.red[50], border: `1px solid ${colors.red[200]}`, borderRadius: '6px' }}>
          <p style={{ margin: 0, color: colors.red[700] }}>{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div 
        style={{ 
          marginBottom: '32px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button 
            onClick={() => router.push('/machines/manage')}
            style={{
              fontSize: '14px',
              padding: '10px 16px',
            }}
          >
            ⚙️ Kategorien verwalten
          </Button>
          <Button 
            onClick={exportToCSV}
            disabled={exportLoading}
            style={{
              fontSize: '14px',
              padding: '10px 16px',
              background: colors.blue[600],
            }}
          >
            {exportLoading ? '⏳ Exportiere...' : '📥 Als Excel exportieren'}
          </Button>
        </div>
        <Button
          onClick={() => router.push('/machines/new')}
          style={{ 
            background: colors.green[600],
            fontSize: '18px',
            padding: '16px 32px',
            fontWeight: 600,
          }}
        >
          + Neue Maschine/Gerät anlegen
        </Button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <Input
          placeholder="Suchen nach Inventarnummer, Bezeichnung, Hersteller, Modell, Baujahr, Betrieb..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Search Results */}
      {search.trim() && (
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              background: colors.blue[50],
              borderRadius: '8px',
              border: `2px solid ${colors.blue[200]}`,
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: colors.blue[700] }}>
              🔍 Suchergebnisse: {filteredMachines.length} {filteredMachines.length === 1 ? 'Eintrag' : 'Einträge'}
            </h2>
          </div>
          {filteredMachines.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                background: colors.neutral[50],
                borderRadius: '8px',
                border: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <p style={{ margin: 0, color: colors.neutral[500] }}>
                Keine Ergebnisse für "{search}" gefunden
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
                      Baujahr
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>
                      Betrieb
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMachines.map((machine) => {
                    const category = categories.find(c => c.id === machine.categoryId);
                    return (
                      <tr
                        key={machine.id}
                        style={{
                          borderBottom: `1px solid ${colors.neutral[100]}`,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.neutral[50];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <Link 
                            href={`/machines/${machine.id}`}
                            style={{ 
                              fontWeight: 500, 
                              fontFamily: 'monospace',
                              color: colors.primary,
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            {machine.inventoryNo}
                          </Link>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{machine.designation}</td>
                        <td style={{ padding: '12px 16px', color: colors.neutral[600] }}>
                          {machine.manufacturer || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', color: colors.neutral[600] }}>
                          {machine.modelType || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', color: colors.neutral[600] }}>
                          {machine.buildYear || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', color: colors.neutral[600] }}>
                          {machine.owner?.name || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Two Column Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '32px',
        }}
      >
        {/* Left Column: Maschinen (mit Motor) */}
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              background: colors.blue[50],
              borderRadius: '8px',
              border: `2px solid ${colors.blue[200]}`,
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: colors.blue[700] }}>
              🚜 Maschinen (mit Motor)
            </h2>
          </div>
          {machinesCategories.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                background: colors.neutral[50],
                borderRadius: '8px',
                border: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <p style={{ margin: 0, color: colors.neutral[500] }}>
                Keine Kategorien vorhanden
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {machinesCategories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} onClick={() => router.push(`/machines/category/${cat.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Geräte (ohne Motor) */}
        <div>
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              background: colors.orange[50],
              borderRadius: '8px',
              border: `2px solid ${colors.orange[200]}`,
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: colors.orange[700] }}>
              📦 Geräte (ohne Motor)
            </h2>
          </div>
          {devicesCategories.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                background: colors.neutral[50],
                borderRadius: '8px',
                border: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <p style={{ margin: 0, color: colors.neutral[500] }}>
                Keine Kategorien vorhanden
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {devicesCategories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} onClick={() => router.push(`/machines/category/${cat.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        border: `2px solid ${isHovered ? colors.blue[400] : colors.neutral[200]}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0', color: colors.neutral[900] }}>
            {category.name}
          </h3>
          {category.inventoryPrefix && (
            <p style={{ fontSize: '13px', color: colors.neutral[500], margin: '0 0 4px 0' }}>
              Inventar-Präfix: {category.inventoryPrefix}
            </p>
          )}
          <p style={{ fontSize: '14px', color: colors.neutral[600], margin: 0 }}>
            {category._count?.machines || 0} {category._count?.machines === 1 ? 'Eintrag' : 'Einträge'}
          </p>
        </div>
        <div
          style={{
            fontSize: '24px',
            color: isHovered ? colors.blue[500] : colors.neutral[400],
            transition: 'color 0.2s',
          }}
        >
          →
        </div>
      </div>
    </div>
  );
}
