"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Monitor, Play, Settings, Info } from "lucide-react"
import type { Channel } from "@/lib/channels"
import {
  getBestStreamUrl,
  getProtocolColor,
  getProtocolIcon,
  getProtocolInfo,
  getAllAvailableStreams,
} from "@/lib/protocol-detector"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StreamProtocolCardProps {
  channel: Channel
  onToggle: (channel: Channel) => void
}

// Update the StreamProtocolCard to show all available URLs and fix image display
export function StreamProtocolCard({ channel, onToggle }: StreamProtocolCardProps) {
  const analysis = channel.protocol_analysis
  const bestStream = analysis ? getBestStreamUrl(analysis) : null
  const allStreams = analysis ? getAllAvailableStreams(analysis) : []
  const protocolInfo = bestStream ? getProtocolInfo(bestStream.protocol) : null

  return (
    <Card className="hud-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
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
            {bestStream && (
              <Badge className={`text-xs bg-${getProtocolColor(bestStream.protocol)} text-black`}>
                {getProtocolIcon(bestStream.protocol)} {bestStream.protocol.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-video bg-black rounded border border-hud-border flex items-center justify-center relative">
          <Monitor className="w-8 h-8 text-hud-primary/50" />
          {/* Show stream preview or logo */}
          <div className="absolute top-2 left-2">
            <img
              src={channel.tvg_logo || "/placeholder.svg?height=24&width=24&query=tv"}
              alt={channel.channel_name}
              className="w-6 h-6 rounded opacity-70"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=24&width=24"
              }}
            />
          </div>
        </div>

        {/* All Available URLs */}
        {analysis && allStreams.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-hud-primary/70 uppercase">
                Available Streams ({allStreams.length})
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-hud-primary/50" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1 text-xs max-w-xs">
                      <div className="font-bold">Stream URLs:</div>
                      {allStreams.map((stream, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{stream.protocol.toUpperCase()}:</span>
                          <span className="text-hud-secondary">Priority #{stream.priority}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-2 gap-1">
              {allStreams.map((stream, index) => (
                <Badge
                  key={index}
                  className={`text-xs bg-${getProtocolColor(stream.protocol)} text-black`}
                  title={`Priority #${stream.priority}: ${stream.url}`}
                >
                  #{stream.priority} {getProtocolIcon(stream.protocol)} {stream.protocol.toUpperCase()}
                </Badge>
              ))}
            </div>

            {bestStream && protocolInfo && (
              <div className="text-xs font-mono space-y-1 bg-hud-bg/30 p-2 rounded">
                <div className="flex justify-between">
                  <span className="text-hud-primary/70">Selected:</span>
                  <span className={`text-${getProtocolColor(bestStream.protocol)} font-bold`}>
                    {bestStream.protocol.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hud-primary/70">Priority:</span>
                  <span className="text-hud-secondary">#{protocolInfo.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hud-primary/70">URL:</span>
                  <span className="text-hud-secondary text-xs truncate max-w-[120px]" title={bestStream.url}>
                    {bestStream.url.split("/").pop()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Channel Stats */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Viewers</span>
            <span className="text-hud-secondary">{channel.clients_count.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Quality</span>
            <span className="text-hud-secondary">{channel.video_resolution || "Auto"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Mode</span>
            <span className="text-hud-secondary uppercase">{channel.restream}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-primary/70">Type</span>
            <span className="text-hud-secondary uppercase">{channel.type}</span>
          </div>
        </div>

        {/* Action Buttons */}
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
            title={`Play ${bestStream?.protocol.toUpperCase() || "Stream"}`}
          >
            <Play className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-hud-secondary text-hud-secondary hover:bg-hud-secondary/10 bg-transparent text-xs"
            title="Stream Settings"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
