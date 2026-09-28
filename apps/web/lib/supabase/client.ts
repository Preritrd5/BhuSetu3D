/**
 * BhuSetu 3D Supabase Browser Client
 * Enterprise 3D Cadastral Intelligence Platform
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qcobqjtrhhdwzmadfykq.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_lCZMVQiaV9X-GnUjdYx-TA_2iHm3AHp";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
