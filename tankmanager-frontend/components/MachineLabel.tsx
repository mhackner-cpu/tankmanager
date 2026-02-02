'use client';

import { QRCodeSVG } from 'qrcode.react';

type LabelSize = 'small' | 'medium' | 'large';

interface MachineLabelProps {
  inventoryNo: string;
  designation: string;
  category: string;
  owner: string;
  machineId: string;
  size?: LabelSize;
}

export default function MachineLabel({ inventoryNo, designation, category, owner, machineId, size = 'small' }: MachineLabelProps) {
  // Produktions-URL für QR-Code (immer die veröffentlichte Domain verwenden)
  const baseUrl = 'https://tankmanager-ebon.vercel.app';
  const machineUrl = `${baseUrl}/machines/${machineId}`;

  const handlePrint = () => {
    window.print();
  };

  // Move label to body for printing and restore after
  let originalParent: HTMLElement | null = null;
  let originalNextSibling: Node | null = null;

  const moveToBodyForPrint = () => {
    const wrapper = document.getElementById('machine-label-print-wrapper');
    if (wrapper && wrapper.parentElement?.tagName !== 'BODY') {
      originalParent = wrapper.parentElement;
      originalNextSibling = wrapper.nextSibling;
      wrapper.classList.add('printing');
      document.body.appendChild(wrapper);
    }
  };

  const restorePosition = () => {
    const wrapper = document.getElementById('machine-label-print-wrapper');
    if (wrapper && originalParent) {
      wrapper.classList.remove('printing');
      if (originalNextSibling) {
        originalParent.insertBefore(wrapper, originalNextSibling);
      } else {
        originalParent.appendChild(wrapper);
      }
      originalParent = null;
      originalNextSibling = null;
    }
  };

  const handlePrintClick = () => {
    moveToBodyForPrint();
    
    // Listen for print events
    const afterPrint = () => {
      restorePosition();
      window.removeEventListener('afterprint', afterPrint);
    };
    window.addEventListener('afterprint', afterPrint);
    
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Größendefinitionen
  const sizes = {
    small: {
      width: '8cm',
      minHeight: '6cm',
      fontSize: {
        header: '24px',
        label: '12px',
        inventoryNo: '32px',
        info: '12px',
        qrText: '9px',
      },
      qrSize: 120,
      padding: '16px',
    },
    medium: {
      width: '14cm',
      minHeight: '10cm',
      fontSize: {
        header: '36px',
        label: '16px',
        inventoryNo: '48px',
        info: '16px',
        qrText: '12px',
      },
      qrSize: 180,
      padding: '24px',
    },
    large: {
      width: '16cm',
      minHeight: '22cm',
      fontSize: {
        header: '48px',
        label: '20px',
        inventoryNo: '64px',
        info: '20px',
        qrText: '15px',
      },
      qrSize: 240,
      padding: '32px',
    },
  };

  const currentSize = sizes[size];

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0mm;
        }
        @media screen {
          #machine-label-print-wrapper.printing {
            position: fixed !important;
            left: -9999px !important;
            top: -9999px !important;
          }
        }
        @media print {
          body > *:not(#machine-label-print-wrapper) {
            display: none !important;
          }
          #machine-label-print-wrapper {
            display: block !important;
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Print Button */}
      <div className="no-print mb-4">
        <button
          onClick={handlePrintClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🖨️ Aufkleber drucken
        </button>
      </div>

      {/* Printable Label Wrapper */}
      <div id="machine-label-print-wrapper" style={{ display: 'block' }}>
        {/* Printable Label */}
        <div
          id="machine-label"
          style={{
            width: currentSize.width,
            minHeight: currentSize.minHeight,
            border: '2px solid #333',
            borderRadius: '8px',
            padding: currentSize.padding,
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: size === 'large' ? '24px' : '12px',
          }}
        >
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: size === 'large' ? '16px' : '8px' }}>
          <h1 style={{ fontSize: currentSize.fontSize.header, fontWeight: 'bold', margin: 0 }}>🚜 TankManager</h1>
        </div>

        {/* Inventory Number - Large */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: currentSize.fontSize.label, color: '#666', marginBottom: '4px' }}>Inventarnummer</div>
          <div style={{ fontSize: currentSize.fontSize.inventoryNo, fontWeight: 'bold', letterSpacing: '2px' }}>
            {inventoryNo}
          </div>
        </div>

        {/* Machine Info */}
        <div style={{ fontSize: currentSize.fontSize.info, lineHeight: '1.6' }}>
          <div><strong>Bezeichnung:</strong> {designation}</div>
          <div><strong>Kategorie:</strong> {category}</div>
          <div><strong>Betrieb:</strong> {owner}</div>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto' }}>
          <QRCodeSVG
            value={machineUrl}
            size={currentSize.qrSize}
            level="M"
            includeMargin={true}
          />
          <div style={{ fontSize: currentSize.fontSize.qrText, color: '#666', marginTop: '8px', textAlign: 'center' }}>
            Scannen für Details
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
