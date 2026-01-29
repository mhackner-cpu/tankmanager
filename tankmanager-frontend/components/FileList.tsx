'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

interface FileItem {
  id: string;
  machineId: string;
  module: string;
  title: string | null;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedBy: string | null;
  uploadedAt: string;
}

interface FileListProps {
  machineId: string;
  refreshTrigger?: number;
}

export default function FileList({ machineId, refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<FileItem[]>(`/files/machines/${machineId}`);
      data.forEach((file, index) => {
        console.log(`Datei ${index + 1}:`, {
          title: file.title,
          fileName: file.fileName,
          id: file.id,
          mimeType: file.mimeType
        });
      });
      setFiles(data);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [machineId, refreshTrigger]);

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`http://localhost:3005/files/${fileId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tankmanager_token')}`,
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download fehlgeschlagen');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Datei wirklich löschen?')) return;

    try {
      setDeleting(fileId);
      await apiRequest(`/files/${fileId}`, { method: 'DELETE' });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Löschen fehlgeschlagen');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unbekannt';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (mimeType: string | null): string => {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📕';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📄';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Lade Dateien...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px dashed #cbd5e0',
        }}
      >
        📂 Noch keine Dateien vorhanden
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {files.map((file) => (
          <div
            key={file.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: '32px', flexShrink: 0 }}>
              {getFileIcon(file.mimeType)}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.title || file.fileName || 'Unbenannte Datei'}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {formatFileSize(file.sizeBytes)} • {formatDate(file.uploadedAt)}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
              <button
                onClick={() => handleDownload(file.id, file.fileName)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                ⬇️ Download
              </button>

              <button
                onClick={() => handleDelete(file.id)}
                disabled={deleting === file.id}
                style={{
                  padding: '8px 16px',
                  backgroundColor: deleting === file.id ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: deleting === file.id ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => {
                  if (deleting !== file.id) {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (deleting !== file.id) {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }
                }}
              >
                {deleting === file.id ? '...' : '🗑️ Löschen'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
