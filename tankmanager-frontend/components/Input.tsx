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
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: colors.neutral[700],
          }}
        >
          {label}
        </label>
      )}
      {asTextarea ? (
        <textarea
          id={inputId}
          style={{
            padding: "10px 12px",
            fontSize: "14px",
            border: `1px solid ${error ? colors.error : colors.neutral[300]}`,
            borderRadius: "6px",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
            backgroundColor: colors.white,
            color: colors.neutral[900],
            minHeight: "80px",
            resize: "vertical",
          }}
          {...(props as any)}
        />
      ) : (
        <input
          id={inputId}
          style={{
            padding: "10px 12px",
            fontSize: "14px",
            border: `1px solid ${error ? colors.error : colors.neutral[300]}`,
            borderRadius: "6px",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
            backgroundColor: colors.white,
            color: colors.neutral[900],
          }}
          {...props}
        />
      )}
      {error && (
        <span style={{ fontSize: "12px", color: colors.error }}>{error}</span>
      )}
      {hint && (
        <span style={{ fontSize: "12px", color: colors.neutral[500] }}>
          {hint}
        </span>
      )}
    </div>
  );
}
