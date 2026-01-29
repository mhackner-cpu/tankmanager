'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getUser } from '@/lib/auth';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Nur ADMIN und MANAGEMENT dürfen zugreifen
    if (!user.roles.includes('ADMIN') && !user.roles.includes('MANAGEMENT')) {
      router.push('/');
      return;
    }
  }, [router]);

  const user = getUser();
  const isAdmin = user?.roles.includes('ADMIN');

  const adminCards = [
    {
      title: '👥 Mitarbeiter verwalten',
      description: 'Mitarbeiter einladen, Rollen zuweisen, Zugriffe verwalten',
      href: '/admin/invitations',
      roles: ['ADMIN'],
    },
    {
      title: '👤 Benutzer verwalten',
      description: 'Alle Benutzer anzeigen, bearbeiten, deaktivieren',
      href: '/admin/users',
      roles: ['ADMIN'],
    },
    {
      title: '🔐 Rollen verwalten',
      description: 'Rollen erstellen und Berechtigungen anpassen',
      href: '/admin/roles',
      roles: ['ADMIN'],
    },
    {
      title: '🏢 Betriebe verwalten',
      description: 'Betriebe anlegen, bearbeiten, löschen',
      href: '/owners',
      roles: ['ADMIN', 'MANAGEMENT'],
    },
    {
      title: ' Berichte & Auswertungen',
      description: 'Statistiken, Berichte und Auswertungen erstellen',
      href: '/admin/reports',
      roles: ['ADMIN', 'MANAGEMENT'],
      coming: true,
    },
    {
      title: '⚙️ Systemeinstellungen',
      description: 'Allgemeine Einstellungen und Konfiguration',
      href: '/admin/settings',
      roles: ['ADMIN'],
      coming: true,
    },
  ];

  const canAccess = (roles: string[]) => {
    return user?.roles.some((role) => roles.includes(role));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">⚙️ Systemverwaltung</h1>
        <p className="text-gray-600 mb-8">Zentrale Verwaltung für Ihr TankManager System</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => {
            const hasAccess = canAccess(card.roles);
            if (!hasAccess) return null;

            return (
              <Link
                key={card.href}
                href={card.coming ? '#' : card.href}
                className={`block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow ${
                  card.coming ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={(e) => card.coming && e.preventDefault()}
              >
                <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
                <p className="text-gray-600 text-sm">{card.description}</p>
                {card.coming && (
                  <span className="inline-block mt-3 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Demnächst verfügbar
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
  );
}
