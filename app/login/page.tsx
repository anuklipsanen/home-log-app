"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "documents"; // vaihda tähän oma bucketin nimi

export default function AuthTestPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [message, setMessage] = useState("Tarkistetaan kirjautumista...");

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setMessage("Et ole kirjautunut.");
        return;
      }

      setUserEmail(user.email || null);
      setMessage("Kirjautunut.");

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list("", {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        console.error(error);
        setMessage(`Kirjautunut, mutta tiedostojen haku epäonnistui: ${error.message}`);
        return;
      }

      setFiles(data || []);
    }

    load();
  }, []);

  async function login() {
    const origin = window.location.origin;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth-test`,
      },
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>🔐 Auth-testi</h1>

      <p>{message}</p>

      {userEmail ? (
        <>
          <p>
            Kirjautunut käyttäjä: <b>{userEmail}</b>
          </p>

          <button onClick={logout}>Kirjaudu ulos</button>

          <h2 style={{ marginTop: 24 }}>Supabase Storage -tiedostot</h2>

          {files.length === 0 ? (
            <p>Ei tiedostoja tai bucket on tyhjä.</p>
          ) : (
            <ul>
              {files.map((file) => (
                <li key={file.name}>
                  {file.name}{" "}
                  {file.metadata?.size
                    ? `(${Math.round(file.metadata.size / 1024)} kt)`
                    : ""}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <button onClick={login}>Kirjaudu Googlella</button>
      )}
    </main>
  );
}