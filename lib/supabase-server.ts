import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); // ✅ TÄRKEÄ

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },

        set(name: string, value: string) {
          try {
            cookieStore.set(name, value);
          } catch {}
        },

        remove(name: string) {
          try {
            cookieStore.set(name, "");
          } catch {}
        },
      },
    }
  );
}