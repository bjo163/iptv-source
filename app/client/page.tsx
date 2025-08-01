"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ClientInterface } from "@/components/client/client-interface"
import { HudLoader } from "@/components/shared/hud-loader"
import { testSupabaseConnection } from "@/lib/supabase"

export default function ClientPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("xtv_user")
    if (userData) {
      setUser(JSON.parse(userData))

      // Test Supabase connection
      testSupabaseConnection().then((connected) => {
        if (connected) {
          console.log("🛰️ XTV Client connected to external Supabase")
        } else {
          console.log("⚠️ XTV Client using fallback mode")
        }
      })
    } else {
      router.push("/home")
      return
    }

    setTimeout(() => setIsLoading(false), 1000)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("xtv_user")
    router.push("/home")
  }

  if (isLoading) {
    return <HudLoader message="Loading Client Interface..." />
  }

  if (!user) {
    return null
  }

  return <ClientInterface user={user} onLogout={handleLogout} />
}
