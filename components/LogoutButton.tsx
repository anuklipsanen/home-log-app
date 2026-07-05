"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();

    // 🔥 pakota reload + takaisin login
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        marginLeft: "auto",
        padding: "6px 12px",
        borderRadius: 8,
        background: "#222",
        color: "#fff",
        border: "1px solid #444",
        cursor: "pointer",
      }}
    >
      🚪 Kirjaudu ulos
    </button>
  );
}