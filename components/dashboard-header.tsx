"use client"

import { motion } from "framer-motion"
import { Bell, Search, Settings, User, Zap, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface DashboardHeaderProps {
  user: any
  onLogout: () => void
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 border-b border-hud-border bg-hud-bg/80 backdrop-blur-sm sticky top-0 z-40"
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo & Title */}
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-10 h-10 bg-gradient-to-br from-hud-primary to-hud-secondary rounded-lg flex items-center justify-center hud-glow"
          >
            <Zap className="w-6 h-6 text-black" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">XTV Panel</h1>
            <p className="text-xs text-hud-secondary font-mono">Neural Command Matrix</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-hud-primary/70" />
            <Input placeholder="Search streams, users, logs..." className="hud-input pl-10 font-mono" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-hud-primary hover:bg-hud-primary/10">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-hud-accent text-xs">3</Badge>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" className="text-hud-primary hover:bg-hud-primary/10">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 text-hud-primary hover:bg-hud-primary/10">
                <div className="w-8 h-8 bg-gradient-to-br from-hud-primary to-hud-secondary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-black" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-mono">{user.username}</div>
                  <div className="text-xs text-hud-secondary uppercase">{user.role}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-hud-bg border-hud-border">
              <DropdownMenuLabel className="text-hud-primary font-mono">Operator: {user.username}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-hud-border" />
              <DropdownMenuItem className="text-hud-primary hover:bg-hud-primary/10">
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-hud-primary hover:bg-hud-primary/10">
                <Settings className="mr-2 h-4 w-4" />
                System Config
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-hud-border" />
              <DropdownMenuItem onClick={onLogout} className="text-hud-accent hover:bg-hud-accent/10">
                <LogOut className="mr-2 h-4 w-4" />
                Terminate Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}
