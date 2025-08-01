import { supabase } from "./supabase"
import type { Channel } from "./channels"

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE"

export interface RealtimePayload<T = any> {
  eventType: RealtimeEvent
  new: T
  old: T
  schema: string
  table: string
}

export type ChannelUpdateCallback = (payload: RealtimePayload<Channel>) => void

export type UserUpdateCallback = (payload: RealtimePayload<any>) => void

export type LogUpdateCallback = (payload: RealtimePayload<any>) => void

class RealtimeManager {
  private channelSubscription: any = null
  private userSubscription: any = null
  private logSubscription: any = null
  private isConnected = false

  // Subscribe to channel changes
  subscribeToChannels(callback: ChannelUpdateCallback) {
    try {
      console.log("🔄 Subscribing to channel updates...")

      this.channelSubscription = supabase
        .channel("xtv_cdn_channel_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "xtv_cdn_channel",
          },
          (payload) => {
            console.log("📡 Channel update received:", payload)
            callback(payload as RealtimePayload<Channel>)
          },
        )
        .subscribe((status) => {
          console.log("📡 Channel subscription status:", status)
          this.isConnected = status === "SUBSCRIBED"
        })

      return this.channelSubscription
    } catch (error) {
      console.error("❌ Failed to subscribe to channels:", error)
      return null
    }
  }

  // Subscribe to user changes
  subscribeToUsers(callback: UserUpdateCallback) {
    try {
      console.log("🔄 Subscribing to user updates...")

      this.userSubscription = supabase
        .channel("xtv_cdn_users_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "xtv_cdn_users",
          },
          (payload) => {
            console.log("👥 User update received:", payload)
            callback(payload as RealtimePayload<any>)
          },
        )
        .subscribe((status) => {
          console.log("👥 User subscription status:", status)
        })

      return this.userSubscription
    } catch (error) {
      console.error("❌ Failed to subscribe to users:", error)
      return null
    }
  }

  // Subscribe to log changes
  subscribeToLogs(callback: LogUpdateCallback) {
    try {
      console.log("🔄 Subscribing to log updates...")

      this.logSubscription = supabase
        .channel("xtv_cdn_logs_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "xtv_cdn_logs",
          },
          (payload) => {
            console.log("📝 Log update received:", payload)
            callback(payload as RealtimePayload<any>)
          },
        )
        .subscribe((status) => {
          console.log("📝 Log subscription status:", status)
        })

      return this.logSubscription
    } catch (error) {
      console.error("❌ Failed to subscribe to logs:", error)
      return null
    }
  }

  // Unsubscribe from channels
  unsubscribeFromChannels() {
    if (this.channelSubscription) {
      console.log("🔄 Unsubscribing from channel updates...")
      supabase.removeChannel(this.channelSubscription)
      this.channelSubscription = null
    }
  }

  // Unsubscribe from users
  unsubscribeFromUsers() {
    if (this.userSubscription) {
      console.log("🔄 Unsubscribing from user updates...")
      supabase.removeChannel(this.userSubscription)
      this.userSubscription = null
    }
  }

  // Unsubscribe from logs
  unsubscribeFromLogs() {
    if (this.logSubscription) {
      console.log("🔄 Unsubscribing from log updates...")
      supabase.removeChannel(this.logSubscription)
      this.logSubscription = null
    }
  }

  // Unsubscribe from all
  unsubscribeAll() {
    this.unsubscribeFromChannels()
    this.unsubscribeFromUsers()
    this.unsubscribeFromLogs()
    this.isConnected = false
    console.log("🔄 All subscriptions removed")
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected
  }

  // Send real-time notification
  async sendNotification(channel: string, event: string, payload: any) {
    try {
      const { error } = await supabase.channel(channel).send({
        type: "broadcast",
        event: event,
        payload: payload,
      })

      if (error) {
        console.error("❌ Failed to send notification:", error)
        return false
      }

      console.log("📡 Notification sent:", { channel, event, payload })
      return true
    } catch (error) {
      console.error("❌ Failed to send notification:", error)
      return false
    }
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager()

// Hook for using realtime in React components
export function useRealtimeChannels(callback: ChannelUpdateCallback) {
  const subscribe = () => realtimeManager.subscribeToChannels(callback)
  const unsubscribe = () => realtimeManager.unsubscribeFromChannels()

  return { subscribe, unsubscribe }
}

export function useRealtimeUsers(callback: UserUpdateCallback) {
  const subscribe = () => realtimeManager.subscribeToUsers(callback)
  const unsubscribe = () => realtimeManager.unsubscribeFromUsers()

  return { subscribe, unsubscribe }
}

export function useRealtimeLogs(callback: LogUpdateCallback) {
  const subscribe = () => realtimeManager.subscribeToLogs(callback)
  const unsubscribe = () => realtimeManager.unsubscribeFromLogs()

  return { subscribe, unsubscribe }
}
