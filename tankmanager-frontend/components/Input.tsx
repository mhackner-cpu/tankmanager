import colors from "@/lib/colors";
import { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  asTextarea?: boolean;
}

export default function Input({
  label,
  error,
  hint,
  id,
  asTextarea = false,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "16px", // Mobile-First: Mindestens 16px
            fontWeight: 600,
            color: colors.neutral[800], // Besserer Kontrast
          }}
        >
          {label}
        </label>
      )}
      {asTextarea ? (
        <textarea
          id={inputId}
          style={{
            padding: "14px 16px", // Touch-optimiert
            fontSize: "16px", // Mobile-First: Verhindert Auto-Zoom
            border: `1px solid ${error ? colors.error : colors.neutral[300]}`,
            borderRadius: "8px",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
            backgroundColor: colors.white,
            color: colors.neutral[900],
            minHeight: "96px", // Touch-optimiert
            resize: "vertical",
            width: "100%", // Mobile-First
            boxSizing: "border-box",
          }}
          {...(props as any)}
        />
      ) : (
        <input
          id={inputId}
          style={{
            padding: "14px 16px", // Touch-optimiert
            fontSize: "16px", // Mobile-First: Verhindert Auto-Zoom auf iOS
            border: `1px solid ${error ? colors.error : colors.neutral[300]}`,
            borderRadius: "8px",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
            backgroundColor: colors.white,
            color: colors.neutral[900],
            minHeight: "48px", // Touch-optimiert
            width: "100%", // Mobile-First
            boxSizing: "border-box",
          }}
          {...props}
        />
      )}
      {error && (
        <span style={{ fontSize: "14px", color: colors.error, lineHeight: 1.4 }}>{error}</span>
      )}
      {hint && (
        <span style={{ fontSize: "14px", color: colors.neutral[600], lineHeight: 1.4 }}>
          {hint}
        </span>
      )}
    </div>
  );
}
