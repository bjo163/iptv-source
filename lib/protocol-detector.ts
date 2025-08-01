export type StreamProtocol = "hls" | "flv" | "rtmp" | "dash" | "webrtc" | "direct" | "unknown"

export interface ProtocolInfo {
  protocol: StreamProtocol
  priority: number
  description: string
  supported: boolean
}

export interface StreamUrlAnalysis {
  originalUrl: string
  detectedProtocol: StreamProtocol
  publishUrls: {
    hls?: string
    flv?: string
    rtmp?: string
  }
  priority: StreamProtocol[]
  isRestream: boolean
}

// Protocol detection patterns
const PROTOCOL_PATTERNS = {
  hls: [/\.m3u8(\?.*)?$/i, /\/hls\//i, /\/live\//i],
  flv: [/\.flv(\?.*)?$/i, /\/flv\//i],
  rtmp: [/^rtmp:\/\//i, /^rtmps:\/\//i],
  dash: [/\.mpd(\?.*)?$/i, /\/dash\//i],
  webrtc: [/^webrtc:/i, /\/webrtc\//i],
  direct: [/^https?:\/\//i], // Fallback for HTTP/HTTPS
}

// Priority order: HLS > FLV > RTMP > Direct > Unknown
const PROTOCOL_PRIORITY: Record<StreamProtocol, number> = {
  hls: 1,
  flv: 2,
  rtmp: 3,
  webrtc: 4,
  dash: 5,
  direct: 6,
  unknown: 7,
}

export function detectProtocol(url: string): StreamProtocol {
  if (!url || typeof url !== "string") return "unknown"

  // Check each protocol pattern
  for (const [protocol, patterns] of Object.entries(PROTOCOL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return protocol as StreamProtocol
      }
    }
  }

  return "unknown"
}

export function generatePublishUrls(
  streamUrl: string,
  streamName: string,
  basePublishUrl?: string,
): {
  hls?: string
  flv?: string
  rtmp?: string
} {
  const publishUrls: { hls?: string; flv?: string; rtmp?: string } = {}

  if (!streamUrl || !streamName) return publishUrls

  // Extract base URL from stream URL
  const urlParts = streamUrl.split("/")
  const baseUrl = urlParts.slice(0, -1).join("/")

  // Use provided base URL or extract from stream URL
  const publishBase = basePublishUrl || baseUrl.replace(/\/live\//, "/publish/")

  // Generate publish URLs for different protocols
  publishUrls.hls = `${publishBase}/${streamName}.m3u8`
  publishUrls.flv = `${publishBase}/${streamName}.flv`
  publishUrls.rtmp = `rtmp://${urlParts[2]}/live/${streamName}`

  return publishUrls
}

// Update the analyzeStreamUrl function to properly check all 4 URLs
export function analyzeStreamUrl(
  streamUrl: string,
  streamName: string,
  restream: string,
  publishUrl?: string,
  publishUrlRtmp?: string,
  publishUrlFlv?: string,
): StreamUrlAnalysis {
  const detectedProtocol = detectProtocol(streamUrl)
  const isRestream = restream !== "direct"

  // Generate publish URLs if not provided
  const generatedUrls = generatePublishUrls(streamUrl, streamName)

  const publishUrls: { hls?: string; flv?: string; rtmp?: string } = {
    hls: publishUrl || generatedUrls.hls,
    flv: publishUrlFlv || generatedUrls.flv,
    rtmp: publishUrlRtmp || generatedUrls.rtmp,
  }

  // Determine priority based on available URLs and protocols
  const priority: StreamProtocol[] = []

  // Check all 4 URLs and add them to priority based on availability
  // Priority 1: HLS (publish_url) - if exists and not empty
  if (publishUrl && publishUrl.trim() !== "") {
    priority.push("hls")
  }

  // Priority 2: FLV (publish_url_flv) - if exists and not empty
  if (publishUrlFlv && publishUrlFlv.trim() !== "") {
    priority.push("flv")
  }

  // Priority 3: RTMP (publish_url_rtmp) - if exists and not empty
  if (publishUrlRtmp && publishUrlRtmp.trim() !== "") {
    priority.push("rtmp")
  }

  // Priority 4: Direct mode (original stream_url) - always available
  priority.push("direct")

  // Add detected protocol if not already in priority and different from direct
  if (!priority.includes(detectedProtocol) && detectedProtocol !== "unknown") {
    priority.push(detectedProtocol)
  }

  return {
    originalUrl: streamUrl,
    detectedProtocol,
    publishUrls,
    priority,
    isRestream,
  }
}

// Update getBestStreamUrl to properly handle all URLs
export function getBestStreamUrl(analysis: StreamUrlAnalysis): { url: string; protocol: StreamProtocol } {
  // Return the highest priority available URL
  for (const protocol of analysis.priority) {
    switch (protocol) {
      case "hls":
        if (analysis.publishUrls.hls && analysis.publishUrls.hls.trim() !== "") {
          return { url: analysis.publishUrls.hls, protocol: "hls" }
        }
        break
      case "flv":
        if (analysis.publishUrls.flv && analysis.publishUrls.flv.trim() !== "") {
          return { url: analysis.publishUrls.flv, protocol: "flv" }
        }
        break
      case "rtmp":
        if (analysis.publishUrls.rtmp && analysis.publishUrls.rtmp.trim() !== "") {
          return { url: analysis.publishUrls.rtmp, protocol: "rtmp" }
        }
        break
      case "direct":
        return { url: analysis.originalUrl, protocol: analysis.detectedProtocol }
    }
  }

  // Fallback to original URL
  return { url: analysis.originalUrl, protocol: analysis.detectedProtocol }
}

// Add function to get all available URLs with their protocols
export function getAllAvailableStreams(
  analysis: StreamUrlAnalysis,
): Array<{ url: string; protocol: StreamProtocol; priority: number }> {
  const streams: Array<{ url: string; protocol: StreamProtocol; priority: number }> = []

  // Check HLS URL
  if (analysis.publishUrls.hls && analysis.publishUrls.hls.trim() !== "") {
    streams.push({ url: analysis.publishUrls.hls, protocol: "hls", priority: 1 })
  }

  // Check FLV URL
  if (analysis.publishUrls.flv && analysis.publishUrls.flv.trim() !== "") {
    streams.push({ url: analysis.publishUrls.flv, protocol: "flv", priority: 2 })
  }

  // Check RTMP URL
  if (analysis.publishUrls.rtmp && analysis.publishUrls.rtmp.trim() !== "") {
    streams.push({ url: analysis.publishUrls.rtmp, protocol: "rtmp", priority: 3 })
  }

  // Always add direct stream
  streams.push({ url: analysis.originalUrl, protocol: analysis.detectedProtocol, priority: 4 })

  return streams.sort((a, b) => a.priority - b.priority)
}

export function getProtocolInfo(protocol: StreamProtocol): ProtocolInfo {
  const protocolInfoMap: Record<StreamProtocol, ProtocolInfo> = {
    hls: {
      protocol: "hls",
      priority: PROTOCOL_PRIORITY.hls,
      description: "HTTP Live Streaming (HLS)",
      supported: true,
    },
    flv: {
      protocol: "flv",
      priority: PROTOCOL_PRIORITY.flv,
      description: "Flash Video (FLV)",
      supported: true,
    },
    rtmp: {
      protocol: "rtmp",
      priority: PROTOCOL_PRIORITY.rtmp,
      description: "Real-Time Messaging Protocol (RTMP)",
      supported: true,
    },
    webrtc: {
      protocol: "webrtc",
      priority: PROTOCOL_PRIORITY.webrtc,
      description: "Web Real-Time Communication",
      supported: false,
    },
    dash: {
      protocol: "dash",
      priority: PROTOCOL_PRIORITY.dash,
      description: "Dynamic Adaptive Streaming (DASH)",
      supported: false,
    },
    direct: {
      protocol: "direct",
      priority: PROTOCOL_PRIORITY.direct,
      description: "Direct Stream (Protocol Unknown)",
      supported: true,
    },
    unknown: {
      protocol: "unknown",
      priority: PROTOCOL_PRIORITY.unknown,
      description: "Unknown Protocol",
      supported: false,
    },
  }

  return protocolInfoMap[protocol]
}

export function getProtocolColor(protocol: StreamProtocol): string {
  const colorMap: Record<StreamProtocol, string> = {
    hls: "hud-secondary", // Green for HLS (highest priority)
    flv: "hud-primary", // Cyan for FLV
    rtmp: "yellow-400", // Yellow for RTMP
    webrtc: "purple-400", // Purple for WebRTC
    dash: "blue-400", // Blue for DASH
    direct: "orange-400", // Orange for Direct
    unknown: "gray-400", // Gray for Unknown
  }

  return colorMap[protocol]
}

export function getProtocolIcon(protocol: StreamProtocol): string {
  const iconMap: Record<StreamProtocol, string> = {
    hls: "📺", // TV for HLS
    flv: "🎬", // Movie for FLV
    rtmp: "📡", // Satellite for RTMP
    webrtc: "🌐", // Globe for WebRTC
    dash: "⚡", // Lightning for DASH
    direct: "🔗", // Link for Direct
    unknown: "❓", // Question for Unknown
  }

  return iconMap[protocol]
}
