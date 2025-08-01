"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/panel/dashboard-header"
import { DashboardSidebar } from "@/components/panel/dashboard-sidebar"
import { DashboardContent } from "@/components/panel/dashboard-content"
import { HudLoader } from "@/components/shared/hud-loader"
import { testSupabaseConnection } from "@/lib/supabase"

export default function PanelPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("xtv_user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      // Check if user has panel access
      if (parsedUser.role === "admin" || parsedUser.role === "system") {
        setUser(parsedUser)

        // Test Supabase connection
        testSupabaseConnection().then((connected) => {
          if (connected) {
            console.log("🛰️ XTV Panel connected to external Supabase")
          } else {
            console.log("⚠️ XTV Panel using fallback mode")
          }
        })
      } else {
        router.push("/home")
        return
      }
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
    return <HudLoader message="Loading Panel Command Matrix..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hud-scanlines fixed inset-0 pointer-events-none opacity-30" />
      <div className="relative z-10 flex flex-col h-screen">
        <DashboardHeader user={user} onLogout={handleLogout} />
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <DashboardContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  )
}
