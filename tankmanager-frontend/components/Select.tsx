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
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: colors.neutral[700],
          }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        style={{
          padding: "10px 12px",
          fontSize: "14px",
          border: `1px solid ${error ? colors.error : colors.neutral[300]}`,
          borderRadius: "6px",
          fontFamily: "inherit",
          backgroundColor: colors.white,
          color: colors.neutral[900],
          cursor: "pointer",
          transition: "all 0.2s ease",
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
        <span style={{ fontSize: "12px", color: colors.error }}>{error}</span>
      )}
    </div>
  );
}
