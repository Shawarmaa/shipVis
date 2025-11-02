'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface DataLegendProps {
  activeLayers: Set<string>
}

export default function DataLegend({ activeLayers }: DataLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't show legend if only vessels are active
  if (activeLayers.size === 1 && activeLayers.has('vessels')) {
    return null
  }

  const hasWeather = activeLayers.has('weather')
  const hasMarine = activeLayers.has('marine')

  if (!hasWeather && !hasMarine) {
    return null
  }

  return (
    <div className="absolute bottom-4 left-4 z-[1001]">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-black/80 backdrop-blur-sm p-2 rounded-lg text-white shadow-lg hover:bg-black/90 transition-colors flex items-center"
      >
        <span className="text-xs font-medium mr-1">Legend</span>
        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-2 bg-black/80 backdrop-blur-sm p-3 rounded-lg text-white shadow-lg max-w-xs">
          {hasWeather && (
            <div className={hasMarine ? "mb-4" : ""}>
              <h4 className="font-bold text-xs mb-2">🌤️ Weather</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-2 bg-gradient-to-r from-blue-500 to-red-500 mr-2"></div>
                  <span>Temperature Zones</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-white/60 rounded mr-2"></div>
                  <span>Cloud Coverage</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400/60 rounded mr-2"></div>
                  <span>Precipitation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-0 h-0 border-l-1 border-r-1 border-l-transparent border-r-transparent border-b-3 border-b-white mr-2"></div>
                  <span>Wind Patterns</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  OpenWeatherMap
                </div>
              </div>
            </div>
          )}

          {hasMarine && (
            <div>
              <h4 className="font-bold text-xs mb-2">🌊 Marine</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-blue-500 rounded-full mr-2"></div>
                  <span>Wave Patterns</span>
                </div>
                <div className="flex items-center">
                  <div className="w-0 h-0 border-l-1 border-r-1 border-l-transparent border-r-transparent border-b-3 border-b-cyan-500 mr-2"></div>
                  <span>Ocean Currents</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-2 bg-gradient-to-r from-blue-500 to-red-500 mr-2"></div>
                  <span>Sea Level</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Multi-source marine data
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}