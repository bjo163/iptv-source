"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, User, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      // Fallback credentials for testing (when Supabase is not available)
      const fallbackUsers = [
        { id: "1", username: "admin", password: "rahasia123", role: "admin" },
        { id: "2", username: "system", password: "publisher123", role: "system" },
        { id: "3", username: "budi", password: "passwordbudi", role: "user" },
        { id: "4", username: "siti", password: "passwordsiti", role: "user" },
        { id: "5", username: "guest", password: "guest123", role: "guest" },
        // Quick test credentials
        { id: "6", username: "test", password: "test", role: "admin" },
        { id: "7", username: "demo", password: "demo", role: "user" },
      ]

      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from("xtv_cdn_users")
          .select("*")
          .eq("username", username)
          .eq("password", password)
          .single()

        if (!error && data) {
          console.log("Supabase login successful:", data)
          onLogin(data)
          return
        }
      } catch (supabaseError) {
        console.log("Supabase connection failed, using fallback authentication")
      }

      // Fallback authentication
      const user = fallbackUsers.find((u) => u.username === username && u.password === password)

      if (user) {
        console.log("Fallback login successful:", user)
        onLogin(user)
      } else {
        setError("Invalid credentials. Try: admin/rahasia123 or test/test")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Authentication failed. Try: admin/rahasia123 or test/test")
    } finally {
      setIsLoading(false)
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

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md p-8 space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto w-16 h-16 bg-gradient-to-br from-hud-primary to-hud-secondary rounded-full flex items-center justify-center hud-glow-strong"
          >
            <Zap className="w-8 h-8 text-black" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-hud-primary font-futuristic uppercase tracking-widest">XTV Panel</h1>
            <p className="text-hud-secondary font-mono text-sm">Zenix OS vXTV-1.2.5 • Neural Access Terminal</p>
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
          <div className="hud-border rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-hud-primary font-mono uppercase text-xs tracking-wider">
                Operator ID
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-hud-primary/70" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="hud-input pl-10 font-mono"
                  placeholder="Enter operator ID"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-hud-primary font-mono uppercase text-xs tracking-wider">
                Access Code
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-hud-primary/70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="hud-input pl-10 pr-10 font-mono"
                  placeholder="Enter access code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-hud-primary/70 hover:text-hud-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-hud-accent text-sm font-mono bg-hud-accent/10 border border-hud-accent/30 rounded p-2"
              >
                ⚠ {error}
              </motion.div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full hud-button py-3 text-lg">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                />
              ) : (
                "INITIALIZE ACCESS"
              )}
            </Button>
          </div>
        </motion.form>

        {/* Test Credentials Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="hud-border rounded-lg p-4 space-y-2"
        >
          <h3 className="text-hud-secondary font-mono text-xs uppercase tracking-wider">Test Credentials</h3>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-hud-primary/70">Quick Test:</span>
              <span className="text-hud-secondary">test / test</span>
            </div>
            <div className="flex justify-between">
              <span className="text-hud-primary/70">Admin:</span>
              <span className="text-hud-secondary">admin / rahasia123</span>
            </div>
            <div className="flex justify-between">
              <span className="text-hud-primary/70">Demo:</span>
              <span className="text-hud-secondary">demo / demo</span>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-hud-primary/60 font-mono space-y-1"
        >
          <div>Secure Connection Established</div>
          <div>panel.xtv.zenix.id • Status: ONLINE</div>
        </motion.div>
      </motion.div>
    </div>
  )
}
