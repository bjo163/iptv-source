"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Channel } from "@/lib/channels"
import { getProtocolColor, getProtocolIcon, getAllAvailableStreams } from "@/lib/protocol-detector"

interface VideoPlayerProps {
  channel: Channel | null
  isPlaying: boolean
  onPlayStateChange: (playing: boolean) => void
}

// Test streams that should work
const TEST_STREAMS = [
  {
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    protocol: "hls" as const,
    name: "Test HLS Stream (Tears of Steel)",
  },
  {
    url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    protocol: "hls" as const,
    name: "Test HLS Stream (Sintel)",
  },
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    protocol: "direct" as const,
    name: "Test MP4 Stream (Big Buck Bunny)",
  },
]

// Utility function to validate stream URL (outside component)
function getValidStreamUrl(stream: any): string | null {
  if (!stream) return null

  if (stream.url && typeof stream.url === "string" && stream.url.trim() !== "") {
    return stream.url.trim()
  }

  const possibleUrls = [stream.url, stream.stream_url, (stream as any).url]
  for (const url of possibleUrls) {
    if (url && typeof url === "string" && url.trim() !== "") {
      return url.trim()
    }
  }

  return null
}

export function VideoPlayer({ channel, isPlaying, onPlayStateChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0)
  const [useTestStream, setUseTestStream] = useState(false)
  const [testStreamIndex, setTestStreamIndex] = useState(0)
  const [hlsReady, setHlsReady] = useState(false)

  // Refs for preventing race conditions and infinite loops
  const isLoadingRef = useRef(false)
  const currentChannelIdRef = useRef<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentStreamRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const errorCountRef = useRef(0) // Track consecutive errors

  // Get streams data
  const allStreams = channel?.protocol_analysis ? getAllAvailableStreams(channel.protocol_analysis) : []
  const currentStream = useTestStream ? TEST_STREAMS[testStreamIndex] : allStreams[currentStreamIndex]

  // Debug function that only logs to console - NO STATE UPDATES
  const debugLog = useCallback((info: string) => {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`🐛 ${timestamp} ${info}`)
  }, [])

  // Clear any pending operations
  const clearPendingOperations = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    isLoadingRef.current = false
  }, [])

  // Try next stream function with better protection
  const tryNextStream = useCallback(() => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      debugLog("Skipping tryNextStream - already loading")
      return
    }

    clearPendingOperations()
    setError(null)
    currentStreamRef.current = null // Reset stream key to allow new loading
    errorCountRef.current = 0 // Reset error count

    if (useTestStream) {
      if (testStreamIndex < TEST_STREAMS.length - 1) {
        debugLog(`Trying next test stream (${testStreamIndex + 2}/${TEST_STREAMS.length})`)
        setTestStreamIndex((prev) => prev + 1)
      } else {
        debugLog("All test streams failed")
        setError("All test streams failed to load")
      }
    } else {
      if (currentStreamIndex < allStreams.length - 1) {
        debugLog(`Trying next stream (${currentStreamIndex + 2}/${allStreams.length})`)
        setCurrentStreamIndex((prev) => prev + 1)
      } else {
        debugLog("All channel streams failed, switching to test streams")
        setUseTestStream(true)
        setTestStreamIndex(0)
      }
    }
  }, [useTestStream, testStreamIndex, currentStreamIndex, allStreams.length, debugLog, clearPendingOperations])

  // Control functions
  const useTestStreams = useCallback(() => {
    clearPendingOperations()
    debugLog("Switching to test streams")
    setUseTestStream(true)
    setTestStreamIndex(0)
    setCurrentStreamIndex(0)
    setError(null)
    errorCountRef.current = 0
  }, [clearPendingOperations, debugLog])

  const useChannelStreams = useCallback(() => {
    if (allStreams.length > 0) {
      clearPendingOperations()
      debugLog("Switching back to channel streams")
      setUseTestStream(false)
      setCurrentStreamIndex(0)
      setTestStreamIndex(0)
      setError(null)
      errorCountRef.current = 0
    }
  }, [allStreams.length, clearPendingOperations, debugLog])

  const resetPlayer = useCallback(() => {
    clearPendingOperations()
    debugLog("Resetting player")
    setError(null)
    setCurrentStreamIndex(0)
    setTestStreamIndex(0)
    setUseTestStream(false)
    setLoading(false)
    currentStreamRef.current = null // Clear stream key
    errorCountRef.current = 0 // Reset error count
    onPlayStateChange(false)

    if (videoRef.current) {
      const video = videoRef.current
      if (video.hls) {
        video.hls.destroy()
        video.hls = null
      }
      video.removeAttribute("src")
      video.load()
    }
  }, [onPlayStateChange, clearPendingOperations, debugLog])

  // Load HLS.js library once and set ready flag
  useEffect(() => {
    const loadHlsJs = async () => {
      if (typeof window !== "undefined" && !window.Hls) {
        try {
          debugLog("Loading HLS.js library...")
          const HlsModule = await import("hls.js")
          window.Hls = HlsModule.default
          debugLog("HLS.js loaded successfully")
          setHlsReady(true)
        } catch (err) {
          debugLog(`Failed to load HLS.js: ${err}`)
          console.error("Failed to load HLS.js:", err)
          setHlsReady(false)
        }
      } else if (window.Hls) {
        setHlsReady(true)
      }
    }
    loadHlsJs()
  }, [debugLog])

  // Reset when channel changes - use stable channel ID
  useEffect(() => {
    const channelId = channel?.id || null

    if (channelId !== currentChannelIdRef.current) {
      currentChannelIdRef.current = channelId
      clearPendingOperations()

      if (channel) {
        debugLog(`Channel changed to: ${channel.channel_name}`)
        setCurrentStreamIndex(0)
        setTestStreamIndex(0)
        setUseTestStream(false)
        setError(null)
        setLoading(false)
        currentStreamRef.current = null
        errorCountRef.current = 0 // Reset error count on channel change
      }
    }
  }, [channel, clearPendingOperations, debugLog])

  // Set up video event handlers once
  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current

    const handleLoadStart = () => {
      debugLog("Video load started")
      setLoading(true)
    }

    const handleCanPlay = () => {
      debugLog("Video can play")
      setLoading(false)
      isLoadingRef.current = false
      setError(null)
      errorCountRef.current = 0 // Reset error count on successful load
    }

    const handleLoadedData = () => {
      debugLog("Video data loaded")
    }

    const handleLoadedMetadata = () => {
      debugLog(`Video metadata loaded: ${video.videoWidth}x${video.videoHeight}`)
    }

    const handleError = (e: Event) => {
      if (!video.hasAttribute("src")) {
        debugLog("Ignoring error for empty src")
        return
      }

      const errorCode = video.error?.code
      const errorMessage = video.error?.message || "Unknown video error"
      debugLog(`Video error (code ${errorCode}): ${errorMessage}`)
      console.error("Video error:", e, video.error)

      errorCountRef.current += 1
      setError(`Video error: ${errorMessage}`)
      setLoading(false)
      isLoadingRef.current = false
      currentStreamRef.current = null // Reset to allow retry

      // Only auto-retry if we haven't had too many consecutive errors
      if (errorCountRef.current < 3 && !timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          tryNextStream()
        }, 2000)
      }
    }

    const handlePlay = () => {
      debugLog("Video started playing")
      onPlayStateChange(true)
    }

    const handlePause = () => {
      debugLog("Video paused")
      onPlayStateChange(false)
    }

    const handleVolumeChange = () => {
      setVolume(video.volume)
      setMuted(video.muted)
    }

    const handleStalled = () => {
      debugLog("Video stalled")
    }

    const handleWaiting = () => {
      debugLog("Video waiting for data")
    }

    // Add event listeners
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("error", handleError)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("volumechange", handleVolumeChange)
    video.addEventListener("stalled", handleStalled)
    video.addEventListener("waiting", handleWaiting)

    return () => {
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("error", handleError)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("volumechange", handleVolumeChange)
      video.removeEventListener("stalled", handleStalled)
      video.removeEventListener("waiting", handleWaiting)
    }
  }, [onPlayStateChange, tryNextStream, debugLog])

  // Handle stream loading - main effect with better protection
  useEffect(() => {
    if (!currentStream || !videoRef.current) {
      return
    }

    const video = videoRef.current
    const streamUrl = getValidStreamUrl(currentStream)

    if (!streamUrl) {
      debugLog("Invalid or empty stream URL, trying next stream")
      setError("Invalid stream URL")
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          tryNextStream()
        }, 1000)
      }
      return
    }

    // Create unique stream key that includes channel ID and error count
    const channelId = channel?.id || "no-channel"
    const streamKey = `${channelId}-${streamUrl}-${currentStreamIndex}-${testStreamIndex}-${useTestStream}-${errorCountRef.current}`

    // Only skip if same stream key AND no error AND not loading
    if (currentStreamRef.current === streamKey && !error && !loading) {
      debugLog("Stream already loaded successfully, skipping")
      return
    }

    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      debugLog("Already loading a stream, skipping")
      return
    }

    // For HLS streams, wait for HLS.js to be ready
    if (currentStream.protocol === "hls" && !hlsReady && !window.Hls) {
      debugLog("Waiting for HLS.js to load...")
      return
    }

    // Clear previous operations before starting new load
    clearPendingOperations()

    isLoadingRef.current = true
    currentStreamRef.current = streamKey
    setLoading(true)
    setError(null)
    debugLog(`Loading stream: ${currentStream.protocol.toUpperCase()} - ${streamUrl}`)

    // Create abort controller for this load operation
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    const loadStream = async () => {
      try {
        // Check if operation was aborted
        if (signal.aborted) {
          debugLog("Stream loading aborted")
          return
        }

        // Clear previous source and HLS instance
        if (video.hls) {
          debugLog("Destroying previous HLS instance")
          video.hls.destroy()
          video.hls = null
        }

        video.removeAttribute("src")
        video.load()

        if (signal.aborted) return

        if (currentStream.protocol === "hls") {
          if (window.Hls && window.Hls.isSupported()) {
            debugLog("Using HLS.js for HLS stream")
            const hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
              maxBufferLength: 30,
              maxMaxBufferLength: 600,
              debug: false,
              // Add more robust error handling
              maxLoadingDelay: 4,
              maxBufferHole: 0.5,
              highBufferWatchdogPeriod: 2,
            })

            if (signal.aborted) {
              hls.destroy()
              return
            }

            hls.loadSource(streamUrl)
            hls.attachMedia(video)

            hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
              if (!signal.aborted) {
                debugLog("HLS manifest loaded successfully")
                setLoading(false)
                isLoadingRef.current = false
                errorCountRef.current = 0 // Reset error count on success
              }
            })

            hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
              if (!signal.aborted) {
                debugLog(`HLS Error: ${data.type} - ${data.details}`)
                console.error("HLS Error:", data)

                // Handle different types of errors
                if (data.fatal) {
                  let errorMessage = `HLS Error: ${data.details}`

                  // Provide more user-friendly error messages
                  if (data.details === "manifestLoadError") {
                    errorMessage = "Stream not available or blocked"
                  } else if (data.details === "levelLoadError") {
                    errorMessage = "Stream quality not available"
                  } else if (data.details === "fragLoadError") {
                    errorMessage = "Stream connection interrupted"
                  }

                  errorCountRef.current += 1
                  setError(errorMessage)
                  setLoading(false)
                  isLoadingRef.current = false
                  currentStreamRef.current = null // Reset to allow retry

                  // Only auto-retry if we haven't had too many consecutive errors
                  if (errorCountRef.current < 3 && !timeoutRef.current) {
                    timeoutRef.current = setTimeout(() => {
                      tryNextStream()
                    }, 2000)
                  } else if (errorCountRef.current >= 3) {
                    debugLog("Too many consecutive errors, stopping auto-retry")
                  }
                }
              }
            })

            video.hls = hls
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            debugLog("Using native HLS support")
            video.src = streamUrl
            video.crossOrigin = "anonymous"
            setLoading(false)
            isLoadingRef.current = false
          } else {
            debugLog("HLS not supported in this browser")
            setError("HLS not supported in this browser")
            setLoading(false)
            isLoadingRef.current = false
            currentStreamRef.current = null
            if (!timeoutRef.current) {
              timeoutRef.current = setTimeout(() => {
                tryNextStream()
              }, 2000)
            }
          }
        } else {
          debugLog(`Loading direct stream: ${streamUrl}`)
          video.src = streamUrl
          video.crossOrigin = "anonymous"
          setLoading(false)
          isLoadingRef.current = false
        }
      } catch (err) {
        if (!signal.aborted) {
          debugLog(`Stream loading error: ${err}`)
          console.error("Stream loading error:", err)
          errorCountRef.current += 1
          setError(`Failed to load stream: ${err}`)
          setLoading(false)
          isLoadingRef.current = false
          currentStreamRef.current = null // Reset to allow retry

          if (errorCountRef.current < 3 && !timeoutRef.current) {
            timeoutRef.current = setTimeout(() => {
              tryNextStream()
            }, 2000)
          }
        }
      }
    }

    loadStream()

    return () => {
      if (video.hls) {
        video.hls.destroy()
        video.hls = null
      }
    }
  }, [
    currentStream,
    tryNextStream,
    hlsReady,
    currentStreamIndex,
    testStreamIndex,
    useTestStream,
    debugLog,
    channel?.id,
    error,
    loading,
  ])

  // Handle play/pause
  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current

    if (isPlaying && !loading && !error) {
      if (!video.src && !video.hls) {
        debugLog("No video source available for playback")
        setError("No video source available")
        onPlayStateChange(false)
        return
      }

      debugLog("Attempting to play video")
      video.play().catch((err) => {
        debugLog(`Play failed: ${err.message}`)
        console.error("Play failed:", err)
        setError(`Playback failed: ${err.message}`)
        onPlayStateChange(false)
      })
    } else if (!isPlaying && !loading) {
      debugLog("Pausing video")
      video.pause()
    }
  }, [isPlaying, loading, error, onPlayStateChange, debugLog])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingOperations()
    }
  }, [clearPendingOperations])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    }
  }, [])

  if (!channel) {
    return (
      <div className="aspect-video bg-black rounded-lg border border-hud-border flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-hud-primary font-mono text-xl">Select a channel to start watching</div>
          <div className="text-hud-secondary font-mono text-sm">Multi-Protocol Player Ready</div>
          <div className="space-y-2">
            <Button onClick={useTestStreams} className="hud-button text-sm">
              Try Test Streams
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="aspect-video bg-black rounded-lg border border-hud-border relative overflow-hidden hud-glow">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls={false}
          playsInline
          muted={muted}
          volume={volume}
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-hud-primary animate-spin mx-auto" />
              <div className="text-hud-primary font-mono">Loading Stream...</div>
              {currentStream && (
                <div className="space-y-2">
                  <Badge className={`bg-${getProtocolColor(currentStream.protocol)} text-black`}>
                    {getProtocolIcon(currentStream.protocol)} {currentStream.protocol.toUpperCase()}
                  </Badge>
                  <div className="text-xs text-hud-secondary font-mono max-w-xs truncate">
                    {useTestStream ? currentStream.name : getValidStreamUrl(currentStream)}
                  </div>
                  {errorCountRef.current > 0 && (
                    <div className="text-xs text-yellow-400 font-mono">Retry attempt {errorCountRef.current}/3</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
            <Alert className="max-w-md border-hud-accent bg-hud-accent/10">
              <AlertCircle className="h-4 w-4 text-hud-accent" />
              <AlertDescription className="text-hud-accent font-mono text-sm space-y-3">
                <div>{error}</div>
                {errorCountRef.current >= 3 && (
                  <div className="text-xs text-yellow-400">
                    Auto-retry disabled after 3 attempts. Use manual controls below.
                  </div>
                )}

                <div className="space-y-2">
                  {!useTestStream && (currentStreamIndex < allStreams.length - 1 || !useTestStream) && (
                    <Button size="sm" onClick={tryNextStream} className="hud-button text-xs mr-2">
                      Try Next Stream (
                      {useTestStream
                        ? TEST_STREAMS.length - testStreamIndex - 1
                        : allStreams.length - currentStreamIndex - 1}{" "}
                      remaining)
                    </Button>
                  )}

                  {!useTestStream && (
                    <Button
                      size="sm"
                      onClick={useTestStreams}
                      variant="outline"
                      className="border-hud-secondary text-hud-secondary hover:bg-hud-secondary/10 text-xs mr-2 bg-transparent"
                    >
                      Try Test Streams
                    </Button>
                  )}

                  {useTestStream && allStreams.length > 0 && (
                    <Button
                      size="sm"
                      onClick={useChannelStreams}
                      variant="outline"
                      className="border-hud-primary text-hud-primary hover:bg-hud-primary/10 text-xs mr-2 bg-transparent"
                    >
                      Back to Channel
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={resetPlayer}
                    variant="outline"
                    className="border-hud-accent text-hud-accent hover:bg-hud-accent/10 text-xs bg-transparent"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Channel Logo Overlay */}
        {!isPlaying && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <img
                src={channel.tvg_logo || "/placeholder.svg?height=64&width=64&query=tv channel"}
                alt="Channel Logo"
                className="w-16 h-16 mx-auto rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=64&width=64"
                }}
              />
              <div className="text-hud-primary font-mono text-xl">{channel.channel_name}</div>
              <div className="text-hud-secondary font-mono text-sm">
                {useTestStream ? "Test Stream Mode" : channel.is_live ? "LIVE STREAM" : "Stream Offline"}
              </div>
              {currentStream && (
                <Badge className={`bg-${getProtocolColor(currentStream.protocol)} text-black`}>
                  {getProtocolIcon(currentStream.protocol)} {currentStream.protocol.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                size="icon"
                onClick={() => onPlayStateChange(!isPlaying)}
                disabled={loading}
                className="hud-button w-12 h-12"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
              <div className="text-hud-primary font-mono">
                <div className="text-lg font-bold">{channel.channel_name}</div>
                <div className="text-sm text-hud-secondary">{useTestStream ? "Test Stream" : channel.group_title}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Stream Info */}
              {currentStream && (
                <div className="flex items-center space-x-2">
                  <Badge className={`bg-${getProtocolColor(currentStream.protocol)} text-black text-xs`}>
                    #{useTestStream ? testStreamIndex + 1 : currentStreamIndex + 1}{" "}
                    {getProtocolIcon(currentStream.protocol)} {currentStream.protocol.toUpperCase()}
                  </Badge>
                  {useTestStream ? (
                    <Badge className="bg-blue-400 text-black text-xs">TEST</Badge>
                  ) : (
                    allStreams.length > 1 && (
                      <Badge className="bg-blue-400 text-black text-xs">{allStreams.length} URLs</Badge>
                    )
                  )}
                  {!hlsReady && currentStream.protocol === "hls" && (
                    <Badge className="bg-yellow-400 text-black text-xs">HLS Loading...</Badge>
                  )}
                  {errorCountRef.current > 0 && (
                    <Badge className="bg-red-400 text-black text-xs">Errors: {errorCountRef.current}</Badge>
                  )}
                </div>
              )}

              <Button
                size="icon"
                onClick={toggleMute}
                variant="ghost"
                className="text-hud-primary hover:bg-hud-primary/10"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Button
                size="icon"
                onClick={toggleFullscreen}
                variant="ghost"
                className="text-hud-primary hover:bg-hud-primary/10"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Status Display - No state updates */}
      <div className="bg-black/50 border border-hud-border rounded p-3">
        <div className="text-hud-primary font-mono text-xs mb-2">Player Status:</div>
        <div className="grid grid-cols-3 gap-4 text-xs font-mono text-hud-secondary">
          <div>Loading: {loading ? "Yes" : "No"}</div>
          <div>Error: {error ? "Yes" : "No"}</div>
          <div>HLS Ready: {hlsReady ? "Yes" : "No"}</div>
          <div>Stream: {currentStream?.protocol.toUpperCase() || "None"}</div>
          <div>Errors: {errorCountRef.current}/3</div>
          <div>Index: {useTestStream ? testStreamIndex : currentStreamIndex}</div>
        </div>
      </div>
    </div>
  )
}

// Extend Window interface for HLS.js
declare global {
  interface Window {
    Hls: any
  }
  interface HTMLVideoElement {
    hls?: any
  }
}
