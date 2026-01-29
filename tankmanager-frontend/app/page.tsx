import colors from '@/lib/colors';

export default function Home() {
  return (
    <main
      style={{
        padding: '60px 20px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '48px',
          fontWeight: 700,
          marginBottom: '16px',
          color: colors.neutral[900],
        }}
      >
        🚜 Willkommen beim TankManager
      </h1>
      <p
        style={{
          fontSize: '20px',
          color: colors.neutral[600],
          marginBottom: '40px',
          lineHeight: '1.6',
        }}
      >
        Ihre zentrale Verwaltung für Maschinen, Tankungen, Wartungen und mehr.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginTop: '48px',
        }}
      >
        <div
          style={{
            padding: '32px',
            backgroundColor: colors.neutral[50],
            borderRadius: '8px',
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: colors.neutral[800] }}>
            Maschinen
          </h3>
          <p style={{ fontSize: '14px', color: colors.neutral[600], lineHeight: '1.5' }}>
            Verwalten Sie Ihre Maschinen, Betriebe und Kategorien zentral.
          </p>
        </div>

        <div
          style={{
            padding: '32px',
            backgroundColor: colors.neutral[50],
            borderRadius: '8px',
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⛽</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: colors.neutral[800] }}>
            Tankungen
          </h3>
          <p style={{ fontSize: '14px', color: colors.neutral[600], lineHeight: '1.5' }}>
            Erfassen und überwachen Sie Kraftstoffverbrauch.
          </p>
        </div>

        <div
          style={{
            padding: '32px',
            backgroundColor: colors.neutral[50],
            borderRadius: '8px',
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔧</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: colors.neutral[800] }}>
            Wartung & UVV
          </h3>
          <p style={{ fontSize: '14px', color: colors.neutral[600], lineHeight: '1.5' }}>
            Planen Sie Wartungen und UVV-Prüfungen rechtzeitig.
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: '64px',
          padding: '24px',
          backgroundColor: colors.neutral[100],
          borderRadius: '8px',
          fontSize: '14px',
          color: colors.neutral[700],
        }}
      >
        <p style={{ margin: 0 }}>
          💡 <strong>Tipp:</strong> Nutzen Sie die Navigation oben, um direkt zu den Maschinen zu gelangen.
        </p>
      </div>
    </main>
  );
}
