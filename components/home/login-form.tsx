"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, User, Zap, Monitor, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

interface LoginFormProps {
  onLogin: (user: any) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("🔄 Attempting login with external Supabase...")

      // Test Supabase connection first
      const connectionTest = await testSupabaseConnection()
      if (connectionTest) {
        console.log("✅ Supabase connection verified")
      }

      // Try Supabase authentication
      const { data, error } = await supabase
        .from("xtv_cdn_users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single()

      if (!error && data) {
        console.log("✅ Supabase login successful:", data)
        onLogin(data)
        return
      } else {
        console.log("⚠️ Supabase login failed, trying fallback...")
      }

      // Fallback credentials for testing
      const fallbackUsers = [
        { id: "1", username: "admin", password: "rahasia123", role: "admin" },
        { id: "2", username: "system", password: "publisher123", role: "system" },
        { id: "3", username: "budi", password: "passwordbudi", role: "user" },
        { id: "4", username: "siti", password: "passwordsiti", role: "user" },
        { id: "5", username: "guest", password: "guest123", role: "guest" },
        { id: "6", username: "test", password: "test", role: "admin" },
        { id: "7", username: "demo", password: "demo", role: "user" },
      ]

      // Fallback authentication
      const user = fallbackUsers.find((u) => u.username === username && u.password === password)

      if (user) {
        console.log("✅ Fallback login successful:", user)
        onLogin(user)
      } else {
        setError("Invalid credentials. Try: admin/rahasia123 or test/test")
      }
    } catch (err) {
      console.error("❌ Login error:", err)
      setError("Authentication failed. Try: admin/rahasia123 or test/test")
    } finally {
      setIsLoading(false)
    }
  }

  const testSupabaseConnection = async () => {
    try {
      await supabase.from("xtv_cdn_users").select("*").limit(1)
      return true
    } catch (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hud-grid opacity-20" />
      <div className="hud-scanlines absolute inset-0" />

      {/* Animated Background Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        className="absolute top-1/4 left-1/4 w-32 h-32 border border-hud-primary/30 rounded-full"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
        className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-hud-secondary/30 rounded-full"
      />

      <div className="w-full max-w-6xl p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-2 space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-hud-primary to-hud-secondary rounded-full flex items-center justify-center hud-glow-strong"
            >
              <Zap className="w-10 h-10 text-black" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-hud-primary font-futuristic uppercase tracking-widest">
                XTV Neural Grid
              </h1>
              <p className="text-hud-secondary font-mono text-lg">
                Zenix OS vXTV-1.2.5 • Multi-Platform Access Terminal
              </p>
            </div>
          </div>

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="hud-border rounded-lg p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-hud-primary font-mono uppercase text-sm tracking-wider">
                  Operator ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-hud-primary/70" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="hud-input pl-12 py-3 text-lg font-mono"
                    placeholder="Enter operator ID"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-hud-primary font-mono uppercase text-sm tracking-wider">
                  Access Code
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-hud-primary/70" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="hud-input pl-12 pr-12 py-3 text-lg font-mono"
                    placeholder="Enter access code"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-hud-primary/70 hover:text-hud-primary"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-hud-accent text-sm font-mono bg-hud-accent/10 border border-hud-accent/30 rounded p-3"
                >
                  ⚠ {error}
                </motion.div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full hud-button py-4 text-xl">
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full"
                  />
                ) : (
                  "INITIALIZE ACCESS"
                )}
              </Button>
            </div>
          </motion.form>
        </motion.div>

        {/* App Selection & Info */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          {/* App Selection */}
          <Card className="hud-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-hud-primary font-mono text-lg uppercase tracking-wider">Access Points</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded border border-hud-primary/30 bg-hud-primary/5">
                  <Monitor className="w-6 h-6 text-hud-primary" />
                  <div>
                    <div className="text-hud-primary font-mono font-bold">Panel</div>
                    <div className="text-hud-secondary text-xs">Admin Dashboard</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded border border-hud-secondary/30 bg-hud-secondary/5">
                  <Tv className="w-6 h-6 text-hud-secondary" />
                  <div>
                    <div className="text-hud-secondary font-mono font-bold">Client</div>
                    <div className="text-hud-primary/70 text-xs">TV/Android Interface</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Credentials */}
          <Card className="hud-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-hud-secondary font-mono text-sm uppercase tracking-wider">Test Credentials</h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-hud-primary/70">Quick Test:</span>
                  <span className="text-hud-secondary">test / test</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hud-primary/70">Admin Panel:</span>
                  <span className="text-hud-secondary">admin / rahasia123</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hud-primary/70">Client Demo:</span>
                  <span className="text-hud-secondary">demo / demo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="hud-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-hud-primary font-mono text-sm uppercase tracking-wider">System Status</h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-hud-primary/70">Neural Grid:</span>
                  <span className="text-hud-secondary">ONLINE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hud-primary/70">Streaming Core:</span>
                  <span className="text-hud-secondary">ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hud-primary/70">Database:</span>
                  <span className="text-hud-secondary">CONNECTED</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
