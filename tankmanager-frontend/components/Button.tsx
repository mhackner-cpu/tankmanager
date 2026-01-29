import colors from "@/lib/colors";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyle = {
    fontFamily: "system-ui, sans-serif",
    fontWeight: 500,
    border: "none",
    borderRadius: "8px",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%", // Mobile-First: Full width
    minHeight: "48px", // Touch-optimiert
  };

  const sizeStyles = {
    sm: { padding: "12px 16px", fontSize: "16px", minHeight: "48px" }, // Touch-optimiert
    md: { padding: "14px 16px", fontSize: "16px", minHeight: "48px" }, // Touch-optimiert
    lg: { padding: "16px 20px", fontSize: "18px", minHeight: "52px" }, // Touch-optimiert
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: disabled ? colors.neutral[300] : colors.primary,
      color: disabled ? colors.neutral[500] : colors.black,
    },
    secondary: {
      backgroundColor: colors.neutral[200],
      color: colors.neutral[800],
    },
    danger: {
      backgroundColor: disabled ? colors.neutral[300] : colors.error,
      color: colors.white,
    },
    success: {
      backgroundColor: disabled ? colors.neutral[300] : colors.success,
      color: colors.white,
    },
    ghost: {
      backgroundColor: colors.neutral[0],
      color: colors.neutral[700],
      border: `1px solid ${colors.neutral[300]}`,
    },
  };

  const style: React.CSSProperties = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={style}
    >
      {loading ? "..." : children}
    </button>
  );
}
