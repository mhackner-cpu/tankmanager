import colors from "@/lib/colors";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: string;
}

export default function AuthLayout({ title, subtitle, children, icon = "🚜" }: AuthLayoutProps) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)",
      padding: "16px", // Mobile-First: Screen Padding
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px", // Mobile-First: Max Width
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
        padding: "24px", // Mobile-First: Card Padding
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: "32px",
        }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "16px",
          }}>
            {icon}
          </div>
          <h1 style={{
            fontSize: "24px", // Mobile-First: H1
            fontWeight: 700,
            color: colors.black,
            marginBottom: "8px",
            lineHeight: 1.4,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: "16px", // Mobile-First
              color: colors.neutral[600],
              lineHeight: 1.5,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px", // Mobile-First: Consistent Spacing
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
