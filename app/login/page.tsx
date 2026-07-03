"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/`,
      },
    });

    if (error) {
      console.error(error);
      alert("Kirjautuminen epäonnistui");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 28,
          border: "1px solid #333",
          borderRadius: 16,
          background: "#181818",
        }}
      >
        <h1>🔐 Kirjaudu sisään</h1>

        <p style={{ color: "#d1d5db", marginBottom: 24 }}>
          Kirjaudu Google-tilillä käyttääksesi Kotiapplikaatiota.
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {loading ? "Avataan Google-kirjautumista..." : "Kirjaudu Googlella"}
        </button>
      </section>
    </main>
  );
}