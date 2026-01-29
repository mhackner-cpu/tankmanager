'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import MachineForm from '@/components/MachineForm';
import Button from '@/components/Button';
import { apiDelete } from '@/lib/api';
import colors from '@/lib/colors';

export default function EditMachinePage() {
  const router = useRouter();
  const params = useParams();
  const machineId = params.id as string;
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Möchten Sie diese Maschine wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setDeleting(true);
    try {
      await apiDelete(`/machines/${machineId}`);
      alert('Maschine gelöscht ✅');
      router.push('/machines');
    } catch (e: any) {
      alert(e?.message || 'Fehler beim Löschen');
      setDeleting(false);
    }
  }

  return (
    <main style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Maschine / Gerät bearbeiten</h1>
          <Button 
            onClick={handleDelete} 
            variant="ghost" 
            disabled={deleting}
            style={{ color: colors.red[600], borderColor: colors.red[600] }}
          >
            {deleting ? 'Wird gelöscht...' : 'Löschen'}
          </Button>
        </div>
        <MachineForm 
          machineId={machineId} 
          onSuccess={(categoryId) => router.push(`/machines/category/${categoryId}`)} 
        />
    </main>
  );
}
