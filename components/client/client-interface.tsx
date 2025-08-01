"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tv, User, LogOut, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getChannels, type Channel } from "@/lib/channels"
import { realtimeManager, type RealtimePayload } from "@/lib/realtime"
import { getBestStreamUrl, getProtocolColor, getProtocolIcon, getAllAvailableStreams } from "@/lib/protocol-detector"
import { toast } from "@/hooks/use-toast"
import { VideoPlayer } from "./video-player"

interface ClientInterfaceProps {
  user: any
  onLogout: () => void
}

export function ClientInterface({ user, onLogout }: ClientInterfaceProps) {
  const [selectedChannel, setSelectedChannel] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
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
      console.log("🔄 Client received channel update:", payload)

      if (payload.eventType === "UPDATE") {
        setChannels((prevChannels) =>
          prevChannels.map((channel) => (channel.id === payload.new.id ? payload.new : channel)),
        )

        // Show toast notification for important updates
        if (payload.old.is_live !== payload.new.is_live) {
          toast({
            title: `${payload.new.channel_name}`,
            description: `Stream is now ${payload.new.is_live ? "LIVE" : "OFFLINE"}`,
            duration: 3000,
          })
        }
      } else if (payload.eventType === "INSERT") {
        setChannels((prevChannels) => [...prevChannels, payload.new])
        toast({
          title: "New Channel Added",
          description: `${payload.new.channel_name} is now available`,
          duration: 3000,
        })
      } else if (payload.eventType === "DELETE") {
        setChannels((prevChannels) => prevChannels.filter((channel) => channel.id !== payload.old.id))
        toast({
          title: "Channel Removed",
          description: `${payload.old.channel_name} is no longer available`,
          duration: 3000,
        })
      }
    })

    if (subscription) {
      setIsRealtimeConnected(true)
    }

    // Cleanup subscription on unmount
    return () => {
      realtimeManager.unsubscribeFromChannels()
      setIsRealtimeConnected(false)
    }
  }, [])

  const currentChannel = channels[selectedChannel] || null
  const bestStream = currentChannel?.protocol_analysis ? getBestStreamUrl(currentChannel.protocol_analysis) : null

  const handleChannelSelect = (index: number) => {
    setSelectedChannel(index)
    setIsPlaying(false) // Stop current playback when switching channels
  }

  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hud-scanlines fixed inset-0 pointer-events-none opacity-20" />

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 border-b border-hud-border bg-hud-bg/80 backdrop-blur-sm sticky top-0 z-40"
      >
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-hud-primary to-hud-secondary rounded-lg flex items-center justify-center hud-glow">
              <Tv className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-hud-primary font-futuristic uppercase tracking-wider">
                XTV Client
              </h1>
              <p className="text-xs text-hud-secondary font-mono">Multi-Protocol Streaming Interface</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Real-time Status */}
            <div className="flex items-center space-x-2">
              {isRealtimeConnected ? (
                <Wifi className="w-4 h-4 text-hud-secondary" />
              ) : (
                <WifiOff className="w-4 h-4 text-hud-accent" />
              )}
              <span className="text-xs font-mono text-hud-primary/70">{isRealtimeConnected ? "LIVE" : "OFFLINE"}</span>
            </div>

            {/* Current Stream Info */}
            {currentChannel && bestStream && (
              <div className="flex items-center space-x-2">
                <Badge className={`bg-${getProtocolColor(bestStream.protocol)} text-black text-xs`}>
                  {getProtocolIcon(bestStream.protocol)} {bestStream.protocol.toUpperCase()}
                </Badge>
                {isPlaying && <Badge className="bg-hud-secondary text-black text-xs animate-pulse">PLAYING</Badge>}
              </div>
            )}

            <div className="flex items-center space-x-2 text-hud-primary">
              <div className="w-8 h-8 bg-gradient-to-br from-hud-primary to-hud-secondary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-black" />
              </div>
              <span className="font-mono text-sm">{user.username}</span>
            </div>
            <Button onClick={onLogout} variant="ghost" size="icon" className="text-hud-accent hover:bg-hud-accent/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Channel List */}
        <motion.aside
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-80 bg-hud-bg/50 border-r border-hud-border backdrop-blur-sm overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-hud-primary font-mono text-lg uppercase tracking-wider">Live Channels</h2>
              <Badge className="bg-hud-secondary text-black text-xs">{channels.length}</Badge>
            </div>
            {loading ? (
              <div className="p-6 text-center text-hud-primary font-mono">Loading channels...</div>
            ) : (
              <div className="space-y-2">
                {channels.map((channel, index) => {
                  const bestStream = channel.protocol_analysis ? getBestStreamUrl(channel.protocol_analysis) : null
                  const allStreams = channel.protocol_analysis ? getAllAvailableStreams(channel.protocol_analysis) : []

                  return (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all ${
                          selectedChannel === index
                            ? "hud-border hud-glow"
                            : "border-hud-border/30 hover:border-hud-primary/50"
                        }`}
                        onClick={() => handleChannelSelect(index)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <img
                                src={channel.tvg_logo || "/placeholder.svg?height=32&width=32&query=tv channel"}
                                alt={channel.channel_name}
                                className="w-8 h-8 rounded object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=32&width=32"
                                }}
                              />
                              <div>
                                <h3 className="text-hud-primary font-mono font-bold">{channel.channel_name}</h3>
                                <p className="text-xs text-hud-primary/70">{channel.group_title}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge
                                className={`text-xs ${
                                  channel.is_live
                                    ? "bg-hud-secondary text-black animate-pulse"
                                    : "bg-gray-500 text-white"
                                }`}
                              >
                                {channel.is_live ? "LIVE" : "OFFLINE"}
                              </Badge>
                              {bestStream && (
                                <Badge className={`text-xs bg-${getProtocolColor(bestStream.protocol)} text-black`}>
                                  {getProtocolIcon(bestStream.protocol)} {bestStream.protocol.toUpperCase()}
                                </Badge>
                              )}
                              {allStreams.length > 1 && (
                                <Badge className="text-xs bg-blue-400 text-black">{allStreams.length} URLs</Badge>
                              )}
                              {selectedChannel === index && isPlaying && (
                                <Badge className="text-xs bg-hud-accent text-white animate-pulse">PLAYING</Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 text-xs font-mono">
                            <div className="flex justify-between">
                              <span className="text-hud-primary/70">Quality:</span>
                              <span className="text-hud-secondary">{channel.video_resolution || "Auto"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-hud-primary/70">Viewers:</span>
                              <span className="text-hud-secondary">{channel.clients_count.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-hud-primary/70">Mode:</span>
                              <span className="text-hud-secondary uppercase">{channel.restream}</span>
                            </div>
                            {bestStream && (
                              <div className="flex justify-between">
                                <span className="text-hud-primary/70">Protocol:</span>
                                <span className={`text-${getProtocolColor(bestStream.protocol)} uppercase`}>
                                  {bestStream.protocol} ({allStreams.length} available)
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.aside>

        {/* Video Player */}
        <motion.main
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 p-6 space-y-6"
        >
          {/* Video Player Component */}
          <VideoPlayer channel={currentChannel} isPlaying={isPlaying} onPlayStateChange={handlePlayStateChange} />

          {/* Channel Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hud-border">
              <CardContent className="p-4">
                <h3 className="text-hud-primary font-mono text-sm uppercase mb-2">Now Playing</h3>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-hud-secondary font-bold">{currentChannel?.channel_name || "No Channel"}</div>
                  <div className="text-hud-primary/70">{currentChannel?.group_title || "Select a channel"}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hud-border">
              <CardContent className="p-4">
                <h3 className="text-hud-primary font-mono text-sm uppercase mb-2">Stream Quality</h3>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-hud-secondary font-bold">{currentChannel?.video_resolution || "N/A"}</div>
                  <div className="text-hud-primary/70">Auto-Adaptive</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hud-border">
              <CardContent className="p-4">
                <h3 className="text-hud-primary font-mono text-sm uppercase mb-2">Protocol</h3>
                <div className="space-y-1 text-xs font-mono">
                  {bestStream ? (
                    <>
                      <div className={`text-${getProtocolColor(bestStream.protocol)} font-bold`}>
                        {getProtocolIcon(bestStream.protocol)} {bestStream.protocol.toUpperCase()}
                      </div>
                      <div className="text-hud-primary/70">Auto-Selected</div>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-400 font-bold">UNKNOWN</div>
                      <div className="text-hud-primary/70">No Stream</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="hud-border">
              <CardContent className="p-4">
                <h3 className="text-hud-primary font-mono text-sm uppercase mb-2">Status</h3>
                <div className="space-y-1 text-xs font-mono">
                  <div className={`font-bold ${isPlaying ? "text-hud-secondary" : "text-gray-400"}`}>
                    {isPlaying ? "PLAYING" : "STOPPED"}
                  </div>
                  <div className="text-hud-primary/70">
                    {currentChannel?.clients_count.toLocaleString() || "0"} viewers
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.main>
      </div>
    </div>
  )
}
