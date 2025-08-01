"use client"

import { motion } from "framer-motion"
import { Activity, Database, Monitor, Radio, Settings, Shield, Users, Zap, BarChart3, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DashboardSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  { id: "overview", label: "System Overview", icon: Monitor, badge: null },
  { id: "streams", label: "Live Streams", icon: Radio, badge: "12" },
  { id: "users", label: "Operators", icon: Users, badge: null },
  { id: "analytics", label: "Analytics", icon: BarChart3, badge: null },
  { id: "logs", label: "System Logs", icon: FileText, badge: "99+" },
  { id: "security", label: "Security", icon: Shield, badge: "3" },
  { id: "database", label: "Database", icon: Database, badge: null },
  { id: "settings", label: "Settings", icon: Settings, badge: null },
]

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  return (
    <motion.aside
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 h-full bg-hud-bg/50 border-r border-hud-border backdrop-blur-sm"
    >
      <div className="p-6 space-y-6">
        {/* Status */}
        <div className="hud-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-hud-primary font-mono text-sm uppercase">System Status</span>
            <div className="w-2 h-2 bg-hud-secondary rounded-full animate-pulse" />
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-hud-primary/70">CPU</span>
              <span className="text-hud-secondary">23%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-hud-primary/70">Memory</span>
              <span className="text-hud-secondary">45%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-hud-primary/70">Streams</span>
              <span className="text-hud-secondary">12 Active</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full justify-start space-x-3 font-mono ${
                    isActive
                      ? "bg-hud-primary text-black hud-glow"
                      : "text-hud-primary hover:bg-hud-primary/10 hover:text-hud-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={`text-xs ${
                        isActive ? "bg-black text-hud-primary" : "border-hud-accent text-hud-accent"
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            )
          })}
        </nav>

        {/* Quick Actions */}
        <div className="hud-border rounded-lg p-4 space-y-3">
          <h3 className="text-hud-primary font-mono text-sm uppercase">Quick Actions</h3>
          <div className="space-y-2">
            <Button size="sm" className="w-full hud-button text-xs">
              <Activity className="w-3 h-3 mr-2" />
              System Scan
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-hud-secondary text-hud-secondary hover:bg-hud-secondary/10 text-xs bg-transparent"
            >
              <Zap className="w-3 h-3 mr-2" />
              Boost Performance
            </Button>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
