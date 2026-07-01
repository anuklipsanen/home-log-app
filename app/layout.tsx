import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body style={{ margin: 0 }}>
        {/* TOP NAV */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "14px 24px",
            borderBottom: "1px solid #444",
            background: "#111",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <Link href="/" style={{ fontWeight: "bold" }}>
            🏠 Koti
          </Link>

          <Link href="/upload">
            📤 Upload
          </Link>

          <Link href="/events">
            📋 Tapahtumat
          </Link>

          <Link href="/calendar">
            📅 Kalenteri
          </Link>
        </header>

        {/* PAGE CONTENT */}
        <main
          style={{
            padding: 24,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}