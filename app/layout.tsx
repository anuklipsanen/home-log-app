"use client";

import "./globals.css";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";
import { usePathname } from "next/navigation";

function getNavLinkStyle(active: boolean) {
  return {
    color: active ? "#fff" : "#d1d5db",
    textDecoration: "none",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
    padding: "6px 10px",
    borderRadius: 8,

    background: active ? "#2563eb" : "transparent",
  };
}

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
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {/* 🔥 NAV LINKS */}
          <Link href="/" style={getNavLinkStyle(usePathname() === "/")}>🏠 Koti</Link>
          <Link href="/events/new" style={getNavLinkStyle(usePathname() === "/events/new")}>➕ Lisää</Link>
          <Link href="/upload" style={getNavLinkStyle(usePathname() === "/upload")}>📤 Upload</Link>
          <Link href="/events" style={getNavLinkStyle(usePathname() === "/events")}>📋 Tapahtumat</Link>
          <Link href="/calendar" style={getNavLinkStyle(usePathname() === "/calendar")}>📅 Kalenteri</Link>
          <Link href="/reports" style={getNavLinkStyle(usePathname() === "/reports")}>📊 Raportit</Link>

          {/* 🔥 UUSI */}
          <Link href="/sports" style={getNavLinkStyle(usePathname() === "/sports")}>🏃 Liikunta</Link>

          {/* 🔥 spacer työntää logout oikealle */}
          <div style={{ flex: 1 }} />

          {/* 🔥 LOGOUT OIKEALLE */}
          <LogoutButton />
        </header>

        {/* 🔐 AUTH */}
        <AuthGuard>
          <main
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              padding: "16px 12px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 900,
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