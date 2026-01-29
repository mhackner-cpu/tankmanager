import colors from "@/lib/colors";

interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  onClose?: () => void;
}

export default function Alert({ type, title, message, onClose }: AlertProps) {
  const typeColors = {
    success: { bg: "#ECFDF5", border: colors.success, text: colors.success },
    error: { bg: "#FEF2F2", border: colors.error, text: colors.error },
    warning: { bg: "#FFFBEB", border: colors.warning, text: colors.warning },
    info: { bg: "#EFF6FF", border: colors.info, text: colors.info },
  };

  const { bg, border, text } = typeColors[type];

  return (
    <div
      style={{
        padding: "16px", // Touch-optimiert
        border: `2px solid ${border}`,
        borderRadius: "8px",
        backgroundColor: bg,
        marginBottom: "16px", // Mobile spacing
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <div style={{ flex: 1 }}>
        {title && (
          <strong style={{ color: text, display: "block", marginBottom: "6px", fontSize: "16px", lineHeight: 1.4 }}>
            {title}
          </strong>
        )}
        <p style={{ color: text, margin: 0, fontSize: "16px", lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: text,
            cursor: "pointer",
            fontSize: "24px", // Touch-optimiert
            padding: "8px", // Touch-optimiert
            minWidth: "40px", // Touch-optimiert
            minHeight: "40px", // Touch-optimiert
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Schließen"
        >
          ✕
        </button>
      )}
    </div>
  );
}
