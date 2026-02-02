'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import AuthLayout from '@/components/AuthLayout';
import { saveAuth } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import colors from '@/lib/colors';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login fehlgeschlagen');
      }

      // Save auth data
      saveAuth(data);

      // Redirect to original page or dashboard
      router.push(redirectUrl || '/');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Willkommen zurück" 
      subtitle="Melden Sie sich bei Ihrem TankManager Account an"
      icon="🚜"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        <Input
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="max@moosmuehle.com"
        />

        <Input
          label="Passwort"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Ihr Passwort"
        />

        <Button 
          type="submit" 
          variant="success"
          loading={loading}
          disabled={loading}
          style={{
            marginTop: '8px',
          }}
        >
          {loading ? 'Wird angemeldet...' : '🔓 Anmelden'}
        </Button>

        <div style={{
          paddingTop: '16px',
          borderTop: `1px solid ${colors.neutral[200]}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          textAlign: 'center',
        }}>
          <Link 
            href="/auth/forgot-password" 
            style={{
              fontSize: '16px',
              color: colors.info,
              fontWeight: 500,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Passwort vergessen?
          </Link>
          
          <p style={{ fontSize: '16px', color: colors.neutral[600], margin: 0 }}>
            Noch kein Unternehmen registriert?{' '}
            <Link 
              href="/auth/register" 
              style={{
                color: colors.success,
                fontWeight: 600,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Unternehmen registrieren
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
