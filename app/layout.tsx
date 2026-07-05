import "./globals.css";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

const navLinkStyle = {
  color: "#d1d5db",
  textDecoration: "none",
  fontWeight: 600,
  whiteSpace: "nowrap" as const,
  padding: "6px 10px",
  borderRadius: 8,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body
        style={{
          margin: 0,
          background: "#0f0f0f",
          color: "#f5f5f5",
        }}
      >
        {/* 🔝 HEADER */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderBottom: "1px solid #2a2a2a",
            background: "#111",
            position: "sticky",
            top: 0,
            zIndex: 1000,

            // 🔥 mobiili fix
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          <Link href="/" style={navLinkStyle}>🏠 Koti</Link>
          <Link href="/events/new" style={navLinkStyle}>➕ Lisää</Link>
          <Link href="/upload" style={navLinkStyle}>📤 Upload</Link>
          <Link href="/events" style={navLinkStyle}>📋 Tapahtumat</Link>
          <Link href="/calendar" style={navLinkStyle}>📅 Kalenteri</Link>
          <Link href="/reports" style={navLinkStyle}>📊 Raportit</Link>
        </header>

        {/* 🔐 AUTH */}
        <AuthGuard>
          <main
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",

              // 🔥 mobiili spacing
              padding: "16px 12px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 900, // 🔥 estää liiallisen leveyden desktopissa

                // 🔥 tärkeä: ei liian keskitetty fiilis
                margin: "0 auto",
              }}
            >
              {children}
            </div>
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}