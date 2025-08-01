import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://supabase.zenix.id"
const supabaseAnonKey =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTQ3ODE4MCwiZXhwIjo0OTA3MTUxNzgwLCJyb2xlIjoiYW5vbiJ9.6fc6Eai5GF9ypzeRak9ho5So-G4XrvLHSq7CXNWL0Y0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable auth persistence for this use case
  },
  db: {
    schema: "public",
  },
})

export type User = {
  id: string
  username: string
  role: "admin" | "system" | "user" | "guest"
  created_at: string
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("xtv_cdn_users").select("count").limit(1)

    if (error) {
      console.error("Supabase connection error:", error)
      return false
    }

    console.log("✅ Supabase connection successful")
    return true
  } catch (err) {
    console.error("❌ Supabase connection failed:", err)
    return false
  }
}
