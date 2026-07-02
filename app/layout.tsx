import "./globals.css";
import Link from "next/link";

const navLinkStyle = {
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 600,
  whiteSpace: "nowrap" as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body style={{ margin: 0, background: "#0f0f0f", color: "#f5f5f5" }}>
        <div
          style={{
            width: "max-content",
            minWidth: "100%",
            minHeight: "100vh",
            background: "#0f0f0f",
          }}
        >
          <header
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 24px",
      borderBottom: "1px solid #444",
      background: "#111",
      position: "sticky",
      top: 0,
      left: 0,
      zIndex: 1000,
      width: "100%",
      minWidth: "max-content",
    }}
  >
            <Link href="/" style={navLinkStyle}>
              🏠 Koti
            </Link>
            <Link href="/events/new" style={navLinkStyle}>
              ➕ Lisää tapahtuma
            </Link>
            <Link href="/upload" style={navLinkStyle}>
              📤 Upload
            </Link>
            <Link href="/events" style={navLinkStyle}>
              📋 Tapahtumat
            </Link>
            <Link href="/calendar" style={navLinkStyle}>
              📅 Kalenteri
            </Link>
          </header>

          <main
            style={{
              padding: 24,
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}