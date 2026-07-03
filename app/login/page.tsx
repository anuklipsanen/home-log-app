"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("error") === "not_allowed") {
      setError("Sinulla ei ole käyttöoikeutta tähän sovellukseen.");
    }
  }, []);

  async function signInWithGoogle() {
    setLoading(true);

    const origin = window.location.origin;
    const next =
      new URLSearchParams(window.location.search).get("next") || "/";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      console.error(error);
      setError("Kirjautuminen epäonnistui");
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

        <p style={{ color: "#d1d5db", marginBottom: 24 }}>
          Kirjaudu Google-tilillä käyttääksesi Kotiapplikaatiota.
        </p>

        {error && (
          <div
            style={{
              background: "#7f1d1d",
              color: "#fecaca",
              padding: 10,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

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
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Avataan Google-kirjautumista..."
            : "Kirjaudu Googlella"}
        </button>
      </section>
    </main>
  );
}