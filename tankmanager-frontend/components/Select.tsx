import colors from "@/lib/colors";
import { useId } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  id,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: "16px", // Mobile-First
            fontWeight: 600,
            color: colors.neutral[800], // Besserer Kontrast
          }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        style={{
          padding: "14px 16px", // Touch-optimiert
          fontSize: "16px", // Mobile-First
          border: `1px solid ${error ? colors.error : colors.neutral[300]}`,
          borderRadius: "8px",
          fontFamily: "inherit",
          backgroundColor: colors.white,
          color: colors.neutral[900],
          cursor: "pointer",
          transition: "all 0.2s ease",
          minHeight: "48px", // Touch-optimiert
          width: "100%", // Mobile-First
          boxSizing: "border-box",
        }}
        {...props}
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: "14px", color: colors.error, lineHeight: 1.4 }}>{error}</span>
      )}
    </div>
  );
}
