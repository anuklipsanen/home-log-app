"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 tarkistetaan URL parametrit
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");

    if (err === "not-allowed") {
      setError("Sinulla ei ole käyttöoikeutta tähän sovellukseen.");
    }
  }, []);

  async function signInWithGoogle() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
        padding: 24,
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

        {/* 🔥 virheilmoitus */}
        {error && (
          <p style={{ color: "#f87171", marginBottom: 16 }}>
            {error}
          </p>
        )}

        <p style={{ color: "#d1d5db", marginBottom: 24 }}>
          Kirjaudu Google-tilillä käyttääksesi sovellusta.
        </p>

        <button
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
          {loading ? "Avataan..." : "Kirjaudu Googlella"}
        </button>
      </section>
    </main>
  );
}