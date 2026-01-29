import colors from "@/lib/colors";

interface StatusBadgeProps {
  status: "ACTIVE" | "INACTIVE" | "LOANED";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    ACTIVE: {
      bg: "#ECFDF5",
      text: colors.active,
      label: "Aktiv",
    },
    INACTIVE: {
      bg: "#F3F4F6",
      text: colors.inactive,
      label: "Inaktiv",
    },
    LOANED: {
      bg: "#FFFBEB",
      text: colors.loaned,
      label: "Ausgeliehen",
    },
  };

  const { bg, text, label } = statusConfig[status];

  return (
    <span
      style={{
        backgroundColor: bg,
        color: text,
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 600,
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}
