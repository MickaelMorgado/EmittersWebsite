import type React from "react"

interface SevenSegmentDisplayProps {
  value: string
  className?: string
}

const SevenSegmentDisplay: React.FC<SevenSegmentDisplayProps> = ({ value, className }) => {
  return (
    <div
      className={`seven-segment text-8xl sm:text-9xl text-center block ${className || ""}`}
      aria-label={`Display value ${value}`}
      style={{
        fontFeatureSettings: '"tnum"',
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      {value.split("").map((char, idx) => (
        <span
          key={idx}
          className="digit inline-block"
          style={{
            width: "0.55em",
            textAlign: "center",
          }}
        >
          {char}
        </span>
      ))}
    </div>
  )
}

export default SevenSegmentDisplay
