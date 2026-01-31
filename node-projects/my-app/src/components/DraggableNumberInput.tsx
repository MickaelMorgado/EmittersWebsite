import React, { useState, useRef, useEffect } from 'react'

interface DraggableNumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
  inputClassName?: string
  dragSensitivity?: number
  decimals?: number
  placeholder?: string
}

export default function DraggableNumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 0.1,
  label,
  className = '',
  inputClassName = '',
  dragSensitivity = 0.01,
  decimals = 1,
  placeholder = '0.0'
}: DraggableNumberInputProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartValue, setDragStartValue] = useState(0)
  const [dragStartX, setDragStartX] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle mouse down on the input or label
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStartValue(value)
    setDragStartX(e.clientX)
    
    // Focus the input to enable keyboard input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - dragStartX
    const deltaValue = deltaX * dragSensitivity
    
    let newValue = dragStartValue + deltaValue
    
    // Apply step increment
    if (step > 0) {
      newValue = Math.round(newValue / step) * step
    }
    
    // Apply min/max constraints
    newValue = Math.max(min, Math.min(max, newValue))
    
    onChange(newValue)
  }

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStartValue(0)
    setDragStartX(0)
  }

  // Handle wheel events for fine-tuning - DISABLED to prevent accidental changes
  const handleWheel = (e: React.WheelEvent) => {
    // Wheel scrolling is disabled to prevent accidental value changes
    // Users can still use keyboard shortcuts for fine adjustments
    e.preventDefault()
    return
  }

  // Handle input change for direct typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // Auto-convert ".5" to "0.5" when user types decimal
    if (inputValue.startsWith('.')) {
      inputValue = '0' + inputValue
      if (inputRef.current) {
        inputRef.current.value = inputValue
      }
    }
    
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue))
      onChange(clampedValue)
    }
  }

  // Handle focus to select all text
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  // Add global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStartValue, dragStartX, dragSensitivity, min, max, step, onChange])

  // Format display value with more precision
  const displayValue = isNaN(value) ? placeholder : value.toFixed(Math.max(decimals, 3))

  return (
    <div 
      ref={containerRef}
      className={`draggable-input-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        padding: '0',
        backgroundColor: '#222',
        cursor: isDragging ? 'ew-resize' : 'pointer',
        transition: 'all 0.1s ease',
        ...(isDragging && {
          backgroundColor: '#2a2a2a',
          boxShadow: '0 0 8px rgba(192, 240, 82, 0.3)'
        })
      }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      {label && (
        <span 
          className="draggable-input-label"
          style={{
            fontSize: '10px',
            color: '#888',
            fontWeight: '600',
            minWidth: '14px',
            textAlign: 'center',
            backgroundColor: '#1a1a1a',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {label}
        </span>
      )}
      
      <input
        ref={inputRef}
        type="number"
        step={step}
        min={min}
        max={max}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        className={`draggable-input ${inputClassName}`}
        style={{
          flex: '1',
          fontSize: '11px',
          backgroundColor: 'transparent',
          border: 'none',
          color: '#fff',
          textAlign: 'center',
          outline: 'none',
          fontFamily: 'monospace',
          height: '28px',
          ...(isDragging && {
            color: '#c0f052'
          })
        }}
        title="Click and drag horizontally to change value • Scroll to adjust • Type to enter exact value"
      />
      
      {/* Visual drag indicator */}
      {isDragging && (
        <div 
          style={{
            width: '3px',
            height: '14px',
            backgroundColor: '#c0f052',
            borderRadius: '2px',
            opacity: 0.8,
            marginRight: '4px'
          }}
        />
      )}
    </div>
  )
}