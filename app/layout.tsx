import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body>

        {/* ✅ TOP NAV */}
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: 12,
            borderBottom: "1px solid #444",
            marginBottom: 20,
          }}
        >
          <Link href="/upload">Upload</Link>
          <Link href="/events">Tapahtumat</Link>
          <Link href="/events/calendar">Kalenteri</Link>
        </div>

        {/* ✅ PAGE CONTENT */}
        <div style={{ padding: 20 }}>
          {children}
        </div>

      </body>
    </html>
  );
}