"use client"

import { motion } from "framer-motion"
import { Activity, Monitor, Radio, Users, Zap, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface DashboardContentProps {
  activeTab: string
}

export function DashboardContent({ activeTab }: DashboardContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <SystemOverview />
      case "streams":
        return <LiveStreams />
      case "users":
        return <Operators />
      case "analytics":
        return <Analytics />
      case "logs":
        return <SystemLogs />
      case "security":
        return <Security />
      case "database":
        return <DatabasePanel />
      case "settings":
        return <Settings />
      default:
        return <SystemOverview />
    }
  }

  return (
    <motion.main
      key={activeTab}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 p-6 space-y-6 overflow-auto"
    >
      {renderContent()}
    </motion.main>
  )
}

function SystemOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">
            System Overview
          </h2>
          <p className="text-hud-secondary font-mono text-sm">Neural Command Matrix • Real-time Status</p>
        </div>
        <Button className="hud-button">
          <Zap className="w-4 h-4 mr-2" />
          System Boost
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Active Streams" value="12" change="+2" icon={Radio} color="hud-primary" />
        <StatsCard title="Connected Users" value="1,247" change="+15%" icon={Users} color="hud-secondary" />
        <StatsCard title="System Load" value="23%" change="-5%" icon={Activity} color="hud-primary" />
        <StatsCard title="Uptime" value="99.9%" change="24h" icon={CheckCircle} color="hud-secondary" />
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hud-border">
          <CardHeader>
            <CardTitle className="text-hud-primary font-futuristic">System Health</CardTitle>
            <CardDescription className="text-hud-secondary font-mono">Real-time performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-hud-primary font-mono">CPU Usage</span>
                <span className="text-hud-secondary">23%</span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-hud-primary font-mono">Memory</span>
                <span className="text-hud-secondary">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-hud-primary font-mono">Network I/O</span>
                <span className="text-hud-secondary">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hud-border">
          <CardHeader>
            <CardTitle className="text-hud-primary font-futuristic">Recent Activity</CardTitle>
            <CardDescription className="text-hud-secondary font-mono">Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ActivityItem time="2 min ago" event="Stream published: /live/stream_001" status="success" />
              <ActivityItem time="5 min ago" event="User authentication: admin" status="success" />
              <ActivityItem time="12 min ago" event="High CPU usage detected" status="warning" />
              <ActivityItem time="18 min ago" event="Database backup completed" status="success" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LiveStreams() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">Live Streams</h2>
          <p className="text-hud-secondary font-mono text-sm">Active streaming channels • Real-time monitoring</p>
        </div>
        <Button className="hud-button">
          <Radio className="w-4 h-4 mr-2" />
          Add Stream
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <StreamCard key={i} streamId={`stream_${i + 1}`} />
        ))}
      </div>
    </div>
  )
}

function Operators() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">Operators</h2>
          <p className="text-hud-secondary font-mono text-sm">System operators • Access management</p>
        </div>
        <Button className="hud-button">
          <Users className="w-4 h-4 mr-2" />
          Add Operator
        </Button>
      </div>

      <Card className="hud-border">
        <CardContent className="p-6">
          <div className="text-center text-hud-primary font-mono">Operators management interface loading...</div>
        </CardContent>
      </Card>
    </div>
  )
}

function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">Analytics</h2>
        <p className="text-hud-secondary font-mono text-sm">Performance metrics • Usage statistics</p>
      </div>

      <Card className="hud-border">
        <CardContent className="p-6">
          <div className="text-center text-hud-primary font-mono">Analytics dashboard loading...</div>
        </CardContent>
      </Card>
    </div>
  )
}

function SystemLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">System Logs</h2>
        <p className="text-hud-secondary font-mono text-sm">Real-time system events • Error tracking</p>
      </div>

      <Card className="hud-border">
        <CardContent className="p-6">
          <div className="text-center text-hud-primary font-mono">System logs interface loading...</div>
        </CardContent>
      </Card>
    </div>
  )
}

function Security() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">Security</h2>
        <p className="text-hud-secondary font-mono text-sm">Access control • Threat monitoring</p>
      </div>

      <Card className="hud-border">
        <CardContent className="p-6">
          <div className="text-center text-hud-primary font-mono">Security dashboard loading...</div>
        </CardContent>
      </Card>
    </div>
  )
}

function DatabasePanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">Database</h2>
        <p className="text-hud-secondary font-mono text-sm">Supabase connection • Data management</p>
      </div>

      <Card className="hud-border">
        <CardContent className="p-6">
          <div className="text-center text-hud-primary font-mono">Database management interface loading...</div>
        </CardContent>
      </Card>
    </div>
  )
}

function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">Settings</h2>
        <p className="text-hud-secondary font-mono text-sm">System configuration • Preferences</p>
      </div>

      <Card className="hud-border">
        <CardContent className="p-6">
          <div className="text-center text-hud-primary font-mono">Settings interface loading...</div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({ title, value, change, icon: Icon, color }: any) {
  return (
    <Card className="hud-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-mono text-hud-primary/70 uppercase">{title}</p>
            <p className={`text-2xl font-bold text-${color} font-futuristic`}>{value}</p>
            <p className="text-xs text-hud-secondary font-mono">{change}</p>
          </div>
          <Icon className={`w-8 h-8 text-${color}/70`} />
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ time, event, status }: any) {
  const statusColors = {
    success: "hud-secondary",
    warning: "yellow-400",
    error: "hud-accent",
  }

  return (
    <div className="flex items-center space-x-3">
      <div className={`w-2 h-2 rounded-full bg-${statusColors[status as keyof typeof statusColors]}`} />
      <div className="flex-1">
        <p className="text-sm text-hud-primary font-mono">{event}</p>
        <p className="text-xs text-hud-primary/50 font-mono">{time}</p>
      </div>
    </div>
  )
}

function StreamCard({ streamId }: { streamId: string }) {
  return (
    <Card className="hud-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-hud-primary font-mono text-sm uppercase">{streamId}</CardTitle>
          <Badge className="bg-hud-secondary text-black text-xs">LIVE</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-video bg-black rounded border border-hud-border flex items-center justify-center">
          <Monitor className="w-8 h-8 text-hud-primary/50" />
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Viewers</span>
            <span className="text-hud-secondary">{Math.floor(Math.random() * 1000)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Quality</span>
            <span className="text-hud-secondary">1080p</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Bitrate</span>
            <span className="text-hud-secondary">5000 kbps</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full border-hud-primary text-hud-primary hover:bg-hud-primary/10 bg-transparent"
        >
          <Monitor className="w-3 h-3 mr-2" />
          Monitor
        </Button>
      </CardContent>
    </Card>
  )
}
