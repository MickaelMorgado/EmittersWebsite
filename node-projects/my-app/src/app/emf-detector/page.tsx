"use client"

import { Wifi } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import DualRangeSlider from "./DualRangeSlider"
import SevenSegmentDisplay from "./SevenSegmentDisplay"
import "./sevenSegmentFont.css"

interface ConnectionInfo {
  type?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export default function EMFDetectorPage() {
  const [connection, setConnection] = useState<ConnectionInfo>({})
  const [intensity, setIntensity] = useState(0)
  const [actualSpeed, setActualSpeed] = useState<number | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [fakeSpeed, setFakeSpeed] = useState(0)
  const [maxSpeed, setMaxSpeed] = useState(500) // Default max latency 500ms
  const [minThreshold, setMinThreshold] = useState(0) // Min ping for intensity mapping
  const [maxThreshold, setMaxThreshold] = useState(200) // Max ping for intensity mapping
  const audioContextRef = useRef<AudioContext | null>(null)
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpeedRef = useRef(0)
  const testingRef = useRef(false)
  const [realPing, setRealPing] = useState<number | null>(null)

  
  const playBeep = (int: number) => {
    const ctx = audioContextRef.current
    if (!ctx) return

    // Very short pulse; higher int => slightly shorter
    const duration = Math.max(0.0, 0.030 - int * 0.002)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Square pulse in upper mids: “electrical click”
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(Math.random() * 40 + 20, ctx.currentTime) // try 2–4 kHz

    const now = ctx.currentTime
    const baseVol = 100
    const vol = baseVol + int * 1.8

    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(vol, now + 0.0005)       // ultra‑fast attack
    gain.gain.linearRampToValueAtTime(0.00001, now + duration) // quick decay

    osc.start(now)
    osc.stop(now + duration)
  }




  const updateBeepRate = (int: number) => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current)
    }
    if (int > 0) {
      const interval = Math.max(0, 600 - int * 600)
      beepIntervalRef.current = setInterval(() => playBeep(int), interval)
    }
  }

  // Effect to handle Debug Mode updates immediately
  useEffect(() => {
    if (debugMode) {
      setActualSpeed(fakeSpeed)
      // Invert Audio: Low Latency = High Intensity (Loud/Fast)
      // If fakeSpeed is 0 (Close), int is 1.
      const int = Math.max(0, Math.min(1, (maxSpeed - fakeSpeed) / maxSpeed))
      setIntensity(int)
    }
  }, [debugMode, fakeSpeed, maxSpeed, setIntensity, setActualSpeed])

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume()
    }

    const conn =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (!conn) {
      console.log("Network Information API not supported")
      return
    }

    const updateUI = (c: any) => {
      setConnection({
        type: c.type || "unknown",
        effectiveType: c.effectiveType || "unknown",
        downlink: typeof c.downlink === "number" ? c.downlink : 0,
        rtt: typeof c.rtt === "number" ? c.rtt : 0,
      })
    }

    updateUI(conn)

    const handleChange = () => updateUI(conn)
    conn.addEventListener("change", handleChange)

    const runSpeedTest = async () => {
      // Prevent overlapping tests
      if (testingRef.current) return

      testingRef.current = true
      try {
        // Real network latency test (Ping/RTT)
        // Using small payload to just measure round trip time
        const testUrl = `https://speed.cloudflare.com/__down?bytes=0`
        
        const startTime = performance.now()
        const response = await fetch(testUrl, { cache: 'no-store' })
        await response.blob() // Wait for body (even if empty) to ensure completion
        const endTime = performance.now()

        const rttMs = endTime - startTime
        setRealPing(rttMs)
        
        if (!debugMode) {
            // Raw Latency Logic: Low Latency = Low Value (Quiet)
            // High Latency = High Value (Loud)
            setActualSpeed(rttMs)
            
            // Map ping to intensity using threshold range
            // minThreshold = max intensity (1), maxThreshold = min intensity (0)
            const range = maxThreshold - minThreshold
            const int = range > 0 ? Math.max(0, Math.min(1, (maxThreshold - rttMs) / range)) : 0
            setIntensity(int)
        }
        
      } catch (error) {
        console.error("Latency test failed:", error)
        if (!debugMode) {
          setIntensity(0) // Set intensity to 0 when no connection
          setActualSpeed(null) // Set speed to null to show 000
        }
        setRealPing(null)
      } finally {
        testingRef.current = false
      }
    }

    let interval: NodeJS.Timeout | null = null

    // Always run the speed test to track Real Ping
    runSpeedTest()
    interval = setInterval(runSpeedTest, 250)

    return () => {
      conn.removeEventListener("change", handleChange)
      if (interval) {
        clearInterval(interval)
      }
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [debugMode, maxSpeed])

  useEffect(() => {
    if (debugMode) {
      setActualSpeed(fakeSpeed)
      // Map fake ping to intensity using threshold range
      const range = maxThreshold - minThreshold
      const int = range > 0 ? Math.max(0, Math.min(1, (maxThreshold - fakeSpeed) / range)) : 0
      setIntensity(int)
    }
  }, [fakeSpeed, debugMode, maxSpeed])

  useEffect(() => {
    updateBeepRate(intensity)
  }, [intensity])

  const formatDisplayValue = (value: number | null) => {
    if (value === null) return "000"
    // Display raw integer value (60ms shows as "60", not "600")
    const formatted = Math.round(value).toString()

    if (formatted.length < 4) {
      return formatted.padStart(4, " ")
    }
    return formatted.slice(0, 5) // Allow up to 5 digits for values like 10000
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  return (
    <div 
      onClick={toggleFullScreen}
      className="min-h-screen bg-[#1a1a1a] p-4 sm:p-8 landscape:p-0 flex items-center justify-center landscape:items-stretch select-none cursor-pointer"
    >
      <div className="w-full max-w-lg landscape:max-w-none landscape:w-full landscape:h-full">
        {/* Main Device Container */}
        <div className="bg-[#2a2a2a] rounded-xl landscape:rounded-none overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#333] landscape:border-0 landscape:min-h-screen landscape:flex landscape:flex-col">
          
          {/* Top Yellow Display Section */}
          <div className="bg-[#e37c2a] px-16 py-6 relative min-h-[160px] landscape:flex-1 flex items-center justify-between shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]">
            {/* Left Info Area */}
            <div className="flex flex-col justify-between h-full text-[#1a1a1a] space-y-2">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5" strokeWidth={3} />
              <span className="text-[10px] font-bold tracking-widest">ms</span>
              </div>
              <div className="seven-segment text-xl tracking-wider">
                {realPing ? String(Math.round(realPing)).padStart(3, '0') : "000"}
              </div>
              <div className="text-[10px] font-bold tracking-widest flex items-center gap-1">
                <span>AF</span>
                <span className="inline-block w-8 h-[2px] bg-[#1a1a1a]/30"></span>
              </div>
            </div>

            {/* Right Large Display Area */}
            <div className="relative">
              {/* Background 8888 for ghost effect */}
              <div className="absolute top-0 right-0 text-[#1a1a1a]/10 select-none z-0">
                <SevenSegmentDisplay
                  value="8888"
                  className="text-[6rem] sm:text-[8rem] landscape:text-[16rem] leading-none block"
                />
              </div>
              
              {/* Actual Value */}
              <div className="relative z-10 text-[#1a1a1a]">
                 <SevenSegmentDisplay
                  value={formatDisplayValue(actualSpeed)}
                  className="text-[6rem] sm:text-[8rem] landscape:text-[16rem] leading-none block"
                />
              </div>
            </div>

            {/* Subtle Screen Texture/Glare Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
          </div>

          {/* Bottom Bezel Section */}
          <div className="bg-[#3a3a3a] p-4 border-t-4 border-[#252525] relative">
            <div className="flex justify-center items-center">
              <div className="text-[#a0a0a0] text-2xl font-bold tracking-[0.2em] font-sans uppercase">
                LINKA·01
              </div>
            </div>
          </div>

        </div>

        {/* Controls Container */}
        <div className="mt-8 bg-[#2a2a2a] border border-[#333] rounded-lg p-6 text-[#888]">
          <div className="text-xs font-mono space-y-3">
            <div className="flex items-center justify-between">
              <span>Ping: {actualSpeed ? Math.round(actualSpeed) : "0"}</span>
              <div className="flex gap-2 text-right">
                <span>RTT: {connection.rtt || 0}ms</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFakeSpeed(intensity * maxSpeed)
                  }
                  setDebugMode(e.target.checked)
                }}
                className="w-4 h-4"
              />
              <span>Debug Mode</span>
            </label>

            {debugMode && (
              <div className="space-y-2 pl-6 pt-2 border-t border-[#333]">
                <label className="block">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Fake Ping</span>
                    <span>{fakeSpeed}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxSpeed} 
                    value={fakeSpeed}
                    onChange={(e) => setFakeSpeed(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              </div>
            )}

            {/* Intensity Mapping Range */}
            <div className="pt-2 border-t border-[#333] space-y-3">
              <div className="text-xs font-bold">Intensity Mapping Range</div>
              
              <DualRangeSlider
                min={0}
                max={2000}
                minValue={minThreshold}
                maxValue={maxThreshold}
                onChange={(newMin, newMax) => {
                  setMinThreshold(newMin)
                  setMaxThreshold(newMax)
                }}
                label="Threshold Range"
              />

              <div className="text-[10px] text-[#666] mt-1 text-center">
                Map ping range to full audio intensity. E.g., if ping is always 40-80ms, set range to 40-80.
              </div>
            </div>

            {/* Max Display Range */}
            <div className="pt-2 border-t border-[#333]">
              <div className="flex justify-between text-xs mb-1">
                <span>Max Display Range (ms)</span>
                <span>{maxSpeed} ms</span>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                value={maxSpeed}
                onChange={(e) => setMaxSpeed(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
