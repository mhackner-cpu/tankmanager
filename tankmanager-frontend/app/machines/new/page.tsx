'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import MachineForm from '@/components/MachineForm';

export default function NewMachinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('categoryId');

  function handleSuccess(resultCategoryId: string) {
    // Use the category from the created machine
    router.push(`/machines/category/${resultCategoryId}`);
  }

  return (
    <main style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Neue Maschine / Gerät</h1>
        <MachineForm onSuccess={handleSuccess} initialCategoryId={categoryId || undefined} />
    </main>
  );
}

