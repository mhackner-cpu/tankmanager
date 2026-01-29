/**
 * Datenbank-Backup Script
 * Erstellt täglich einen PostgreSQL Dump und speichert ihn lokal oder auf einem Server
 *
 * Verwendung:
 * npm run backup
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Konfiguration aus .env oder Umgebungsvariablen
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'tankmanager';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'Muehlrad!1895';

// Backup-Verzeichnis
const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const NETWORK_BACKUP_DIR = process.env.NETWORK_BACKUP_DIR; // z.B. \\SERVER\Backups\TankManager

async function createBackup() {
  console.log('🔄 Starte Datenbank-Backup...');

  // Erstelle Backup-Verzeichnis falls nicht vorhanden
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Timestamp für Dateinamen
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .split('T')[0];
  const filename = `tankmanager_backup_${timestamp}.sql`;
  const localFilepath = path.join(BACKUP_DIR, filename);

  try {
    // pg_dump Command
    const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${localFilepath}"`;

    // Setze Passwort als Umgebungsvariable für pg_dump
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

    console.log(`📦 Erstelle Backup: ${filename}`);
    await execAsync(command, { env });

    console.log(`✅ Backup erfolgreich erstellt: ${localFilepath}`);

    // Dateigröße anzeigen
    const stats = fs.statSync(localFilepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Backup-Größe: ${fileSizeMB} MB`);

    // Optional: Kopiere zu Netzwerk-Backup-Verzeichnis
    if (NETWORK_BACKUP_DIR) {
      await copyToNetworkDrive(localFilepath, NETWORK_BACKUP_DIR);
    }

    // Optional: Lösche alte Backups (behalte nur letzte 30 Tage)
    await cleanOldBackups(BACKUP_DIR, 30);

    return localFilepath;
  } catch (error: any) {
    console.error('❌ Fehler beim Backup:', error.message);
    throw error;
  }
}

async function copyToNetworkDrive(sourcePath: string, networkDir: string) {
  try {
    console.log(`📤 Kopiere Backup zu Netzlaufwerk: ${networkDir}`);

    // Erstelle Netzwerk-Verzeichnis falls nicht vorhanden
    if (!fs.existsSync(networkDir)) {
      fs.mkdirSync(networkDir, { recursive: true });
    }

    const filename = path.basename(sourcePath);
    const destPath = path.join(networkDir, filename);

    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Backup kopiert zu: ${destPath}`);
  } catch (error: any) {
    console.error('⚠️  Fehler beim Kopieren zum Netzlaufwerk:', error.message);
    // Nicht kritisch - lokales Backup existiert noch
  }
}

async function cleanOldBackups(backupDir: string, keepDays: number) {
  try {
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const maxAge = keepDays * 24 * 60 * 60 * 1000; // Tage in Millisekunden

    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('tankmanager_backup_')) continue;

      const filepath = path.join(backupDir, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtime.getTime();

      if (age > maxAge) {
        fs.unlinkSync(filepath);
        deletedCount++;
        console.log(`🗑️  Gelöscht (älter als ${keepDays} Tage): ${file}`);
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ ${deletedCount} alte Backup(s) gelöscht`);
    }
  } catch (error: any) {
    console.error('⚠️  Fehler beim Aufräumen alter Backups:', error.message);
  }
}

// Script ausführen
createBackup()
  .then((_filepath) => {
    console.log('\n✅ Backup-Vorgang abgeschlossen');
    process.exit(0);
  })
  .catch((_error) => {
    console.error('\n❌ Backup fehlgeschlagen');
    process.exit(1);
  });
