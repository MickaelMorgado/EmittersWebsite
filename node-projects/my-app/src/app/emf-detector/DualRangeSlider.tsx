import { useEffect, useRef, useState } from 'react'

interface DualRangeSliderProps {
  min: number
  max: number
  minValue: number
  maxValue: number
  onChange: (min: number, max: number) => void
  label?: string
}

export default function DualRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onChange,
  label
}: DualRangeSliderProps) {
  const [isDraggingMin, setIsDraggingMin] = useState(false)
  const [isDraggingMax, setIsDraggingMax] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const getPercentage = (value: number) => {
    return ((value - min) / (max - min)) * 100
  }

  const getValueFromPosition = (clientX: number) => {
    if (!trackRef.current) return null
    
    const rect = trackRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    return Math.round(min + (percentage / 100) * (max - min))
  }

  const handleMove = (clientX: number) => {
    const value = getValueFromPosition(clientX)
    if (value === null) return

    if (isDraggingMin) {
      const newMin = Math.min(value, maxValue - 1)
      onChange(newMin, maxValue)
    } else if (isDraggingMax) {
      const newMax = Math.max(value, minValue + 1)
      onChange(minValue, newMax)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      e.preventDefault() // Prevent scrolling while dragging
      handleMove(e.touches[0].clientX)
    }
  }

  const handleEnd = () => {
    setIsDraggingMin(false)
    setIsDraggingMax(false)
  }

  useEffect(() => {
    if (isDraggingMin || isDraggingMax) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleEnd)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleEnd)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDraggingMin, isDraggingMax, minValue, maxValue])

  const minPercent = getPercentage(minValue)
  const maxPercent = getPercentage(maxValue)

  const handleMinStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation() // Prevent fullscreen toggle
    setIsDraggingMin(true)
  }

  const handleMaxStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation() // Prevent fullscreen toggle
    setIsDraggingMax(true)
  }

  const handleTrackClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent fullscreen toggle
  }

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      {label && (
        <div className="flex justify-between text-xs mb-2">
          <span>{label}</span>
          <span>{minValue} - {maxValue} ms</span>
        </div>
      )}
      
      <div className="relative h-8 flex items-center">
        {/* Track */}
        <div
          ref={trackRef}
          className="absolute w-full h-2 bg-[#333] rounded-full cursor-pointer"
          onClick={handleTrackClick}
        >
          {/* Active range highlight */}
          <div
            className="absolute h-full bg-[#e37c2a] rounded-full pointer-events-none"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />
        </div>

        {/* Min handle */}
        <div
          className="absolute w-5 h-5 bg-[#e37c2a] border-2 border-[#1a1a1a] rounded-full cursor-grab active:cursor-grabbing z-10 hover:scale-110 transition-transform touch-none"
          style={{ left: `calc(${minPercent}% - 10px)` }}
          onMouseDown={handleMinStart}
          onTouchStart={handleMinStart}
        />

        {/* Max handle */}
        <div
          className="absolute w-5 h-5 bg-[#e37c2a] border-2 border-[#1a1a1a] rounded-full cursor-grab active:cursor-grabbing z-10 hover:scale-110 transition-transform touch-none"
          style={{ left: `calc(${maxPercent}% - 10px)` }}
          onMouseDown={handleMaxStart}
          onTouchStart={handleMaxStart}
        />
      </div>
    </div>
  )
}
