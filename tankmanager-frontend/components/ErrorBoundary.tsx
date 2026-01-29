'use client';

import { Component, ReactNode } from 'react';
import colors from '@/lib/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '32px',
            maxWidth: '600px',
            margin: '64px auto',
            background: 'white',
            borderRadius: '8px',
            border: `1px solid ${colors.red[300]}`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}
          >
            ⚠️
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: colors.red[700] }}>
            Ein Fehler ist aufgetreten
          </h2>
          <p style={{ fontSize: '14px', color: colors.neutral[600], marginBottom: '24px' }}>
            Die Anwendung konnte nicht korrekt geladen werden.
            Bitte laden Sie die Seite neu oder kontaktieren Sie den Support.
          </p>
          {this.state.error && (
            <details style={{ textAlign: 'left', marginBottom: '24px' }}>
              <summary style={{ cursor: 'pointer', color: colors.neutral[500], fontSize: '14px' }}>
                Fehlerdetails anzeigen
              </summary>
              <pre
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: colors.neutral[50],
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}
              >
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: colors.blue[600],
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Seite neu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
