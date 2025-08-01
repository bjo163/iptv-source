"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home (login page)
    router.push("/home")
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-hud-primary font-mono">Redirecting to XTV Home...</div>
    </div>
  )
}
