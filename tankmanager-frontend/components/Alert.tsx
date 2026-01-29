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
        padding: "12px 16px",
        border: `2px solid ${border}`,
        borderRadius: "6px",
        backgroundColor: bg,
        marginBottom: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        {title && (
          <strong style={{ color: text, display: "block", marginBottom: "4px" }}>
            {title}
          </strong>
        )}
        <p style={{ color: text, margin: 0, fontSize: "14px" }}>
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
            fontSize: "18px",
            padding: "0 8px",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
