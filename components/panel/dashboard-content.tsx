"use client"

import { motion } from "framer-motion"
import { Activity, Monitor, Radio, Users, Zap, CheckCircle, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import {
  getChannels,
  updateChannelStatus,
  type Channel,
  getChannelLevelColor,
  getChannelLevelLabel,
  getRestreamModeColor,
} from "@/lib/channels"
import { realtimeManager, type RealtimePayload } from "@/lib/realtime"
import { toast } from "@/hooks/use-toast"

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
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  useEffect(() => {
    // Subscribe to real-time updates for system overview
    const subscription = realtimeManager.subscribeToChannels((payload: RealtimePayload<Channel>) => {
      console.log("📊 System overview received update:", payload)
      // Update system stats based on channel changes
    })

    if (subscription) {
      setIsRealtimeConnected(true)
    }

    return () => {
      realtimeManager.unsubscribeFromChannels()
      setIsRealtimeConnected(false)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">
            System Overview
          </h2>
          <div className="flex items-center space-x-2">
            <p className="text-hud-secondary font-mono text-sm">Neural Command Matrix • Real-time Status</p>
            {isRealtimeConnected ? (
              <Wifi className="w-4 h-4 text-hud-secondary animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4 text-hud-accent" />
            )}
          </div>
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
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const channelData = await getChannels()
        setChannels(channelData)
      } catch (error) {
        console.error("Failed to load channels:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChannels()

    // Subscribe to real-time channel updates
    const subscription = realtimeManager.subscribeToChannels((payload: RealtimePayload<Channel>) => {
      console.log("🎛️ Panel received channel update:", payload)

      if (payload.eventType === "UPDATE") {
        setChannels((prevChannels) =>
          prevChannels.map((channel) => (channel.id === payload.new.id ? payload.new : channel)),
        )

        // Show toast notification
        toast({
          title: "Channel Updated",
          description: `${payload.new.channel_name} status changed`,
          duration: 2000,
        })
      } else if (payload.eventType === "INSERT") {
        setChannels((prevChannels) => [...prevChannels, payload.new])
        toast({
          title: "New Channel",
          description: `${payload.new.channel_name} added to system`,
          duration: 3000,
        })
      } else if (payload.eventType === "DELETE") {
        setChannels((prevChannels) => prevChannels.filter((channel) => channel.id !== payload.old.id))
        toast({
          title: "Channel Deleted",
          description: `${payload.old.channel_name} removed from system`,
          duration: 3000,
        })
      }
    })

    if (subscription) {
      setIsRealtimeConnected(true)
    }

    return () => {
      realtimeManager.unsubscribeFromChannels()
      setIsRealtimeConnected(false)
    }
  }, [])

  const handleToggleStream = async (channel: Channel) => {
    try {
      const newStatus = !channel.is_live
      const success = await updateChannelStatus(channel.id, newStatus)

      if (success) {
        // Update local state immediately for better UX
        setChannels((prev) => prev.map((c) => (c.id === channel.id ? { ...c, is_live: newStatus } : c)))

        toast({
          title: "Stream Status Updated",
          description: `${channel.channel_name} is now ${newStatus ? "LIVE" : "OFFLINE"}`,
          duration: 2000,
        })
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update stream status",
          duration: 2000,
        })
      }
    } catch (error) {
      console.error("Failed to toggle stream:", error)
      toast({
        title: "Error",
        description: "Failed to update stream status",
        duration: 2000,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">Live Streams</h2>
          <div className="flex items-center space-x-2">
            <p className="text-hud-secondary font-mono text-sm">Active streaming channels • Real-time monitoring</p>
            {isRealtimeConnected ? (
              <Wifi className="w-4 h-4 text-hud-secondary animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4 text-hud-accent" />
            )}
          </div>
        </div>
        <Button className="hud-button">
          <Radio className="w-4 h-4 mr-2" />
          Add Stream
        </Button>
      </div>

      {loading ? (
        <Card className="hud-border">
          <CardContent className="p-6">
            <div className="text-center text-hud-primary font-mono">Loading channels...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <StreamCard key={channel.id} channel={channel} onToggle={handleToggleStream} />
          ))}
        </div>
      )}
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

function StreamCard({ channel, onToggle }: { channel: Channel; onToggle: (channel: Channel) => void }) {
  return (
    <Card className="hud-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={channel.tvg_logo || "/placeholder.svg"} alt={channel.channel_name} className="w-8 h-8 rounded" />
            <div>
              <CardTitle className="text-hud-primary font-mono text-sm uppercase">{channel.channel_name}</CardTitle>
              <p className="text-xs text-hud-primary/70">{channel.group_title}</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge
              className={`text-xs ${
                channel.is_live ? "bg-hud-secondary text-black animate-pulse" : "bg-gray-500 text-white"
              }`}
            >
              {channel.is_live ? "LIVE" : "OFFLINE"}
            </Badge>
            <Badge className={`text-xs bg-${getChannelLevelColor(channel.level)} text-black`}>
              {getChannelLevelLabel(channel.level)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-video bg-black rounded border border-hud-border flex items-center justify-center">
          <Monitor className="w-8 h-8 text-hud-primary/50" />
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Viewers</span>
            <span className="text-hud-secondary">{channel.clients_count.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Quality</span>
            <span className="text-hud-secondary">{channel.video_resolution}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Mode</span>
            <span className={`text-${getRestreamModeColor(channel.restream)} uppercase`}>{channel.restream}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Type</span>
            <span className="text-hud-secondary uppercase">{channel.type}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => onToggle(channel)}
            className={`flex-1 text-xs ${
              channel.is_live ? "bg-hud-accent text-white hover:bg-hud-accent/80" : "hud-button"
            }`}
          >
            {channel.is_live ? "Stop Stream" : "Start Stream"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-hud-primary text-hud-primary hover:bg-hud-primary/10 bg-transparent text-xs"
          >
            <Monitor className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
