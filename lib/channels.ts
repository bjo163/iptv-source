import { supabase } from "./supabase"
import { analyzeStreamUrl, type StreamUrlAnalysis } from "./protocol-detector"

export type StreamType = "iptv" | "vod" | "live" | "surveillance"
export type RestreamMode = "always" | "on-demand" | "scheduled" | "direct"
export type ChannelLevel = "0-public" | "1-basic" | "2-standard" | "3-premium" | "4-vip" | "5-super-vip"

export interface Channel {
  id: string
  tvg_id: string
  tvg_name: string
  tvg_logo: string
  group_title: string
  channel_name: string
  stream_name: string
  stream_url: string
  type: StreamType
  restream: RestreamMode
  status: boolean
  level: ChannelLevel
  publish_url?: string
  publish_url_rtmp?: string
  publish_url_flv?: string
  is_live: boolean
  video_codec?: string
  video_resolution?: string
  video_fps?: number
  audio_codec?: string
  audio_freq?: number
  audio_channels?: number
  stream_duration?: string
  schedule_enabled: boolean
  schedule_start_time?: string
  schedule_end_time?: string
  schedule_timezone: string
  schedule_days: number[]
  created_at: string
  updated_at: string
  // Add protocol analysis
  protocol_analysis?: StreamUrlAnalysis
}

export async function getChannels(): Promise<Channel[]> {
  try {
    console.log("🔄 Fetching channels from Supabase...")

    const { data, error } = await supabase
      .from("xtv_cdn_channel")
      .select("*")
      .eq("status", true)
      .order("group_title", { ascending: true })
      .order("channel_name", { ascending: true })

    if (error) {
      console.error("❌ Supabase query error:", error)
      console.log("🔄 Using fallback channels...")
      return getFallbackChannels()
    }

    if (data && data.length > 0) {
      console.log(`✅ Loaded ${data.length} channels from Supabase`)
      console.log("📊 Sample channel data:", data[0]) // Debug: show first channel structure

      // Add protocol analysis to each channel
      return data.map((channel) => {
        console.log(`🔍 Processing channel: ${channel.channel_name}`)
        console.log(`📺 Stream URL: ${channel.stream_url}`)
        console.log(`🔗 Publish URL: ${channel.publish_url || "N/A"}`)
        console.log(`🎬 Publish FLV: ${channel.publish_url_flv || "N/A"}`)
        console.log(`📡 Publish RTMP: ${channel.publish_url_rtmp || "N/A"}`)

        return {
          ...channel,
          protocol_analysis: analyzeStreamUrl(
            channel.stream_url, // Use the actual stream_url from database
            channel.stream_name,
            channel.restream,
            channel.publish_url,
            channel.publish_url_rtmp,
            channel.publish_url_flv,
          ),
        }
      })
    } else {
      console.log("⚠️ No channels found in database, using fallback")
      return getFallbackChannels()
    }
  } catch (err) {
    console.error("❌ Failed to fetch channels:", err)
    console.log("🔄 Using fallback channels...")
    return getFallbackChannels()
  }
}

export async function getLiveChannels(): Promise<Channel[]> {
  try {
    console.log("🔄 Fetching live channels from Supabase...")

    const { data, error } = await supabase
      .from("xtv_cdn_channel")
      .select("*")
      .eq("status", true)
      .eq("is_live", true)
      .order("clients_count", { ascending: false })

    if (error) {
      console.error("❌ Supabase query error:", error)
      return getFallbackChannels().filter((c) => c.is_live)
    }

    if (data && data.length > 0) {
      console.log(`✅ Loaded ${data.length} live channels from Supabase`)
      return data.map((channel) => ({
        ...channel,
        protocol_analysis: analyzeStreamUrl(
          channel.stream_url, // Use the actual stream_url from database
          channel.stream_name,
          channel.restream,
          channel.publish_url,
          channel.publish_url_rtmp,
          channel.publish_url_flv,
        ),
      }))
    } else {
      console.log("⚠️ No live channels found, using fallback")
      return getFallbackChannels().filter((c) => c.is_live)
    }
  } catch (err) {
    console.error("❌ Failed to fetch live channels:", err)
    return getFallbackChannels().filter((c) => c.is_live)
  }
}

export async function getChannelsByGroup(group: string): Promise<Channel[]> {
  try {
    const { data, error } = await supabase
      .from("xtv_cdn_channel")
      .select("*")
      .eq("status", true)
      .eq("group_title", group)
      .order("channel_name", { ascending: true })

    if (error) {
      console.error("Supabase error:", error)
      return getFallbackChannels().filter((c) => c.group_title === group)
    }

    return (
      data?.map((channel) => ({
        ...channel,
        protocol_analysis: analyzeStreamUrl(
          channel.stream_url, // Use the actual stream_url from database
          channel.stream_name,
          channel.restream,
          channel.publish_url,
          channel.publish_url_rtmp,
          channel.publish_url_flv,
        ),
      })) || getFallbackChannels().filter((c) => c.group_title === group)
    )
  } catch (err) {
    console.error("Failed to fetch channels by group:", err)
    return getFallbackChannels().filter((c) => c.group_title === group)
  }
}

export async function updateChannelStatus(id: string, is_live: boolean, clients_count?: number): Promise<boolean> {
  try {
    console.log(`🔄 Updating channel ${id} status: ${is_live ? "LIVE" : "OFFLINE"}`)

    const updateData: any = {
      is_live,
      updated_at: new Date().toISOString(),
    }

    if (clients_count !== undefined) {
      updateData.clients_count = clients_count
    }

    const { error } = await supabase.from("xtv_cdn_channel").update(updateData).eq("id", id)

    if (error) {
      console.error("❌ Failed to update channel status:", error)
      return false
    }

    console.log(`✅ Channel ${id} status updated successfully`)
    return true
  } catch (err) {
    console.error("❌ Failed to update channel status:", err)
    return false
  }
}

// Add function to create/insert new channel
export async function createChannel(channelData: Partial<Channel>): Promise<Channel | null> {
  try {
    console.log("🔄 Creating new channel...")

    const { data, error } = await supabase.from("xtv_cdn_channel").insert([channelData]).select().single()

    if (error) {
      console.error("❌ Failed to create channel:", error)
      return null
    }

    console.log("✅ Channel created successfully:", data)
    return {
      ...data,
      protocol_analysis: analyzeStreamUrl(
        data.stream_url,
        data.stream_name,
        data.restream,
        data.publish_url,
        data.publish_url_rtmp,
        data.publish_url_flv,
      ),
    }
  } catch (err) {
    console.error("❌ Failed to create channel:", err)
    return null
  }
}

// Add function to delete channel
export async function deleteChannel(id: string): Promise<boolean> {
  try {
    console.log(`🔄 Deleting channel ${id}...`)

    const { error } = await supabase.from("xtv_cdn_channel").delete().eq("id", id)

    if (error) {
      console.error("❌ Failed to delete channel:", error)
      return false
    }

    console.log(`✅ Channel ${id} deleted successfully`)
    return true
  } catch (err) {
    console.error("❌ Failed to delete channel:", err)
    return false
  }
}

function getFallbackChannels(): Channel[] {
  const fallbackData = [
    {
      id: "test-hls-1",
      tvg_id: "test-hls-tears",
      tvg_name: "Test HLS - Tears of Steel",
      tvg_logo: "/placeholder.svg?height=100&width=100",
      group_title: "Test Streams",
      channel_name: "Test HLS - Tears of Steel",
      stream_name: "test_hls_tears",
      stream_url:
        "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      type: "live" as StreamType,
      restream: "direct" as RestreamMode,
      status: true,
      level: "0-public" as ChannelLevel,
      publish_url:
        "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      publish_url_rtmp: "",
      publish_url_flv: "",
      is_live: true,
      video_codec: "h264",
      video_resolution: "1080p",
      video_fps: 24,
      audio_codec: "aac",
      audio_freq: 48000,
      audio_channels: 2,
      stream_duration: "",
      schedule_enabled: false,
      schedule_start_time: "",
      schedule_end_time: "",
      schedule_timezone: "Asia/Jakarta",
      schedule_days: [1, 2, 3, 4, 5, 6, 7],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "test-hls-2",
      tvg_id: "test-hls-sintel",
      tvg_name: "Test HLS - Sintel",
      tvg_logo: "/placeholder.svg?height=100&width=100",
      group_title: "Test Streams",
      channel_name: "Test HLS - Sintel",
      stream_name: "test_hls_sintel",
      stream_url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      type: "live" as StreamType,
      restream: "direct" as RestreamMode,
      status: true,
      level: "0-public" as ChannelLevel,
      publish_url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      publish_url_rtmp: "",
      publish_url_flv: "",
      is_live: true,
      video_codec: "h264",
      video_resolution: "720p",
      video_fps: 24,
      audio_codec: "aac",
      audio_freq: 48000,
      audio_channels: 2,
      stream_duration: "",
      schedule_enabled: false,
      schedule_start_time: "",
      schedule_end_time: "",
      schedule_timezone: "Asia/Jakarta",
      schedule_days: [1, 2, 3, 4, 5, 6, 7],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "test-mp4-1",
      tvg_id: "test-mp4-bunny",
      tvg_name: "Test MP4 - Big Buck Bunny",
      tvg_logo: "/placeholder.svg?height=100&width=100",
      group_title: "Test Streams",
      channel_name: "Test MP4 - Big Buck Bunny",
      stream_name: "test_mp4_bunny",
      stream_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      type: "vod" as StreamType,
      restream: "direct" as RestreamMode,
      status: true,
      level: "0-public" as ChannelLevel,
      publish_url: "",
      publish_url_rtmp: "",
      publish_url_flv: "",
      is_live: true,
      video_codec: "h264",
      video_resolution: "720p",
      video_fps: 30,
      audio_codec: "aac",
      audio_freq: 44100,
      audio_channels: 2,
      stream_duration: "",
      schedule_enabled: false,
      schedule_start_time: "",
      schedule_end_time: "",
      schedule_timezone: "Asia/Jakarta",
      schedule_days: [1, 2, 3, 4, 5, 6, 7],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Add some real IPTV examples with correct URLs from your database
    {
      id: "iptv-144",
      tvg_id: "al-jazeera",
      tvg_name: "Al Jazeera",
      tvg_logo: "/placeholder.svg?height=100&width=100",
      group_title: "News",
      channel_name: "Al Jazeera",
      stream_name: "al_jazeera",
      stream_url: "https://iptv.lancartech.co.id:443/mohrezza/mohrezza@Reg1-3/144.m3u8", // Use correct numbered URL
      type: "iptv" as StreamType,
      restream: "direct" as RestreamMode,
      status: true,
      level: "0-public" as ChannelLevel,
      publish_url: "https://iptv.lancartech.co.id:443/mohrezza/mohrezza@Reg1-3/144.m3u8",
      publish_url_rtmp: "",
      publish_url_flv: "",
      is_live: true,
      video_codec: "h264",
      video_resolution: "720p",
      video_fps: 25,
      audio_codec: "aac",
      audio_freq: 48000,
      audio_channels: 2,
      stream_duration: "",
      schedule_enabled: false,
      schedule_start_time: "",
      schedule_end_time: "",
      schedule_timezone: "Asia/Jakarta",
      schedule_days: [1, 2, 3, 4, 5, 6, 7],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "iptv-145",
      tvg_id: "abc-australia",
      tvg_name: "ABC Australia",
      tvg_logo: "/placeholder.svg?height=100&width=100",
      group_title: "International",
      channel_name: "ABC Australia",
      stream_name: "abc_australia",
      stream_url: "https://iptv.lancartech.co.id:443/mohrezza/mohrezza@Reg1-3/145.m3u8", // Use correct numbered URL
      type: "iptv" as StreamType,
      restream: "direct" as RestreamMode,
      status: true,
      level: "0-public" as ChannelLevel,
      publish_url: "https://iptv.lancartech.co.id:443/mohrezza/mohrezza@Reg1-3/145.m3u8",
      publish_url_rtmp: "",
      publish_url_flv: "",
      is_live: true,
      video_codec: "h264",
      video_resolution: "720p",
      video_fps: 25,
      audio_codec: "aac",
      audio_freq: 48000,
      audio_channels: 2,
      stream_duration: "",
      schedule_enabled: false,
      schedule_start_time: "",
      schedule_end_time: "",
      schedule_timezone: "Asia/Jakarta",
      schedule_days: [1, 2, 3, 4, 5, 6, 7],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  return fallbackData.map((channel) => ({
    ...channel,
    protocol_analysis: analyzeStreamUrl(
      channel.stream_url, // Use the actual stream_url, not constructed from name
      channel.stream_name,
      channel.restream,
      channel.publish_url,
      channel.publish_url_rtmp,
      channel.publish_url_flv,
    ),
  }))
}

export function getChannelLevelColor(level: ChannelLevel): string {
  switch (level) {
    case "0-public":
      return "hud-secondary"
    case "1-basic":
      return "blue-400"
    case "2-standard":
      return "hud-primary"
    case "3-premium":
      return "yellow-400"
    case "4-vip":
      return "purple-400"
    case "5-super-vip":
      return "hud-accent"
    default:
      return "hud-primary"
  }
}

export function getChannelLevelLabel(level: ChannelLevel): string {
  switch (level) {
    case "0-public":
      return "PUBLIC"
    case "1-basic":
      return "BASIC"
    case "2-standard":
      return "STANDARD"
    case "3-premium":
      return "PREMIUM"
    case "4-vip":
      return "VIP"
    case "5-super-vip":
      return "SUPER VIP"
    default:
      return "UNKNOWN"
  }
}

export function getRestreamModeColor(mode: RestreamMode): string {
  switch (mode) {
    case "always":
      return "hud-secondary"
    case "on-demand":
      return "hud-primary"
    case "scheduled":
      return "yellow-400"
    case "direct":
      return "orange-400"
    default:
      return "hud-primary"
  }
}
