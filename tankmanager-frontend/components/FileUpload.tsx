'use client';

import { useState, useRef } from 'react';
import { apiRequest } from '@/lib/api';

interface FileUploadProps {
  machineId: string;
  onUploadSuccess?: () => void;
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export default function FileUpload({ machineId, onUploadSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Dateityp ${file.type} ist nicht erlaubt. Nur Bilder, PDFs und Office-Dokumente.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximal 50 MB erlaubt.`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setError('');
    setUploading(true);
    setProgress(0);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('machineId', machineId);
      formData.append('title', customTitle || file.name);
      formData.append('module', 'MACHINE');

      // Simulated progress (real progress tracking requires XMLHttpRequest or axios)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('http://localhost:3005/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tankmanager_token')}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload fehlgeschlagen');
      }

      const result = await response.json();
      console.log('File uploaded:', result);

      // Success
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setSelectedFile(null);
        setCustomTitle('');
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }, 500);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload fehlgeschlagen');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Set selected file and show title input
    setSelectedFile(files[0]);
    setCustomTitle('');
    setError('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          style={{
            border: dragActive ? '2px dashed #10b981' : '2px dashed #cbd5e0',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: dragActive ? '#f0fdf4' : '#f9fafb',
            transition: 'all 0.2s',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />

          <div>
            <p style={{ fontSize: '40px', marginBottom: '10px' }}>📁</p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
              Datei hochladen
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Klicken oder Drag & Drop
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px' }}>
              Bilder, PDFs, Office-Dokumente • Max. 50 MB
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            border: '1px solid #cbd5e0',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f9fafb',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            Ausgewählte Datei:
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Beschriftung (optional):
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="z.B. Typenschild, Betriebsanleitung..."
              disabled={uploading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e0';
              }}
            />
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              Falls leer, wird der Dateiname verwendet
            </p>
          </div>

          {uploading ? (
            <div>
              <p style={{ marginBottom: '10px', fontSize: '14px' }}>📤 Wird hochgeladen... {progress}%</p>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#10b981',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => uploadFile(selectedFile)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                ✓ Hochladen
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setCustomTitle('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px',
          }}
        >
          ❌ {error}
        </div>
      )}
    </div>
  );
}
