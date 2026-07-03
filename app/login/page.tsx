"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin, // 🔥 EI callback routea
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