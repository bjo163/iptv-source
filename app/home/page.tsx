"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/home/login-form"
import { HudLoader } from "@/components/shared/hud-loader"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = (userData: any) => {
    setIsLoading(true)

    // Store user data in localStorage for cross-app access
    localStorage.setItem("xtv_user", JSON.stringify(userData))

    setTimeout(() => {
      // Redirect based on user role or app selection
      if (userData.role === "admin" || userData.role === "system") {
        router.push("/panel")
      } else {
        router.push("/client")
      }
    }, 2000)
  }

  if (isLoading) {
    return <HudLoader message="Initializing XTV Neural Grid..." />
  }

  return <LoginForm onLogin={handleLogin} />
}
