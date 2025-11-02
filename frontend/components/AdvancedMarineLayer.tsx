'use client'

import { useEffect, useState, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { Slider } from '@/components/ui/slider'

// Rotterdam coordinates and marine area
const ROTTERDAM_COORDS: [number, number] = [51.9225, 4.4792]
const MARINE_BOUNDS = [
  [51.6, 3.8], // Southwest
  [52.3, 5.5]  // Northeast
]

interface MarineDataHour {
  currentDirection: Record<string, number>
  currentSpeed: Record<string, number>
  seaLevel: Record<string, number>
  time: string
  waveDirection: Record<string, number>
  waveHeight: Record<string, number>
}

interface MarineData {
  hours: MarineDataHour[]
}

// Wave height color mapping
const getWaveHeightColor = (height: number): string => {
  if (height < 0.5) return '#1e40af'      // Deep blue - calm
  if (height < 1.0) return '#3b82f6'      // Blue - light waves
  if (height < 1.5) return '#06b6d4'      // Cyan - moderate
  if (height < 2.0) return '#10b981'      // Green - significant
  if (height < 2.5) return '#f59e0b'      // Yellow - rough
  if (height < 3.0) return '#f97316'      // Orange - very rough
  return '#dc2626'                        // Red - high
}

// Current speed color mapping
const getCurrentSpeedColor = (speed: number): string => {
  if (speed < 0.1) return 'rgba(59, 130, 246, 0.3)'    // Light blue - weak
  if (speed < 0.3) return 'rgba(16, 185, 129, 0.5)'    // Green - moderate
  if (speed < 0.6) return 'rgba(245, 158, 11, 0.7)'    // Yellow - strong
  return 'rgba(220, 38, 38, 0.8)'                      // Red - very strong
}

interface AdvancedMarineLayerProps {
  visible: boolean
}

export default function AdvancedMarineLayer({ visible }: AdvancedMarineLayerProps) {
  const [marineData, setMarineData] = useState<MarineData | null>(null)
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0)
  const [selectedSource, setSelectedSource] = useState<string>('sg')
  const [showWaves, setShowWaves] = useState(true)
  const [showCurrents, setShowCurrents] = useState(true)
  const [showSeaLevel, setShowSeaLevel] = useState(true)
  
  const map = useMap()
  const waveLayersRef = useRef<L.Circle[] | null>(null)
  const currentLayersRef = useRef<L.Marker[] | null>(null)
  const seaLevelLayersRef = useRef<L.Circle[] | null>(null)

  useEffect(() => {
    if (visible && !marineData) {
      fetch('/marine_data.json')
        .then(response => response.json())
        .then((data: MarineData) => {
          setMarineData(data)
        })
        .catch(error => {
          console.error('Error loading marine data:', error)
        })
    }
  }, [visible, marineData])

  useEffect(() => {
    if (!visible || !marineData || !map) {
      // Clean up all layers when not visible
      if (waveLayersRef.current) {
        waveLayersRef.current.forEach(layer => map.removeLayer(layer))
        waveLayersRef.current = null
      }
      if (currentLayersRef.current) {
        currentLayersRef.current.forEach(layer => map.removeLayer(layer))
        currentLayersRef.current = null
      }
      if (seaLevelLayersRef.current) {
        seaLevelLayersRef.current.forEach(layer => map.removeLayer(layer))
        seaLevelLayersRef.current = null
      }
      return
    }

    const currentData = marineData.hours[selectedTimeIndex]
    
    // Clean up existing layers
    if (waveLayersRef.current) {
      waveLayersRef.current.forEach(layer => map.removeLayer(layer))
    }
    if (currentLayersRef.current) {
      currentLayersRef.current.forEach(layer => map.removeLayer(layer))
    }
    if (seaLevelLayersRef.current) {
      seaLevelLayersRef.current.forEach(layer => map.removeLayer(layer))
    }

    const waveHeight = currentData.waveHeight[selectedSource] || 0
    const waveDirection = currentData.waveDirection[selectedSource] || 0
    const currentSpeed = currentData.currentSpeed[selectedSource] || 0
    const currentDirection = currentData.currentDirection[selectedSource] || 0
    const seaLevel = currentData.seaLevel[selectedSource] || 0

    // Create advanced wave visualization
    if (showWaves && waveHeight > 0) {
      const waveLayers = []
      
      // Create multiple concentric wave circles for realistic effect
      for (let i = 0; i < 3; i++) {
        const radius = (waveHeight * 1000) + (i * 500) // Base radius + offset
        const opacity = 0.7 - (i * 0.2) // Decreasing opacity
        
        const waveCircle = L.circle(ROTTERDAM_COORDS, {
          radius: radius,
          fillColor: getWaveHeightColor(waveHeight),
          fillOpacity: opacity * 0.3,
          color: getWaveHeightColor(waveHeight),
          weight: 2,
          opacity: opacity
        })
        
        waveCircle.bindPopup(`
          <div class="p-2">
            <h4 class="font-bold">Wave Conditions</h4>
            <div>Height: ${waveHeight.toFixed(2)} m</div>
            <div>Direction: ${waveDirection.toFixed(0)}°</div>
            <div>Source: ${selectedSource.toUpperCase()}</div>
          </div>
        `)
        
        waveLayers.push(waveCircle)
        waveCircle.addTo(map)
      }
      
      waveLayersRef.current = waveLayers
    }

    // Create advanced current flow visualization
    if (showCurrents && currentSpeed > 0) {
      const currentMarkers = []
      
      // Create a grid of current arrows across the marine area
      for (let lat = MARINE_BOUNDS[0][0]; lat <= MARINE_BOUNDS[1][0]; lat += 0.15) {
        for (let lng = MARINE_BOUNDS[0][1]; lng <= MARINE_BOUNDS[1][1]; lng += 0.2) {
          const arrowSize = Math.max(15, Math.min(40, currentSpeed * 150))
          
          const currentIcon = L.divIcon({
            html: `
              <div style="
                width: ${arrowSize}px;
                height: ${arrowSize}px;
                transform: rotate(${currentDirection}deg);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 0;
                  height: 0;
                  border-left: ${arrowSize/4}px solid transparent;
                  border-right: ${arrowSize/4}px solid transparent;
                  border-bottom: ${arrowSize*0.7}px solid ${getCurrentSpeedColor(currentSpeed)};
                  filter: drop-shadow(0 0 3px rgba(0,0,0,0.5));
                "></div>
              </div>
            `,
            className: 'current-arrow-advanced',
            iconSize: [arrowSize, arrowSize],
            iconAnchor: [arrowSize/2, arrowSize/2]
          })
          
          const currentMarker = L.marker([lat, lng], { icon: currentIcon })
          currentMarker.bindPopup(`
            <div class="p-2">
              <h4 class="font-bold">Ocean Current</h4>
              <div>Speed: ${currentSpeed.toFixed(3)} m/s</div>
              <div>Direction: ${currentDirection.toFixed(0)}°</div>
              <div>Source: ${selectedSource.toUpperCase()}</div>
            </div>
          `)
          
          currentMarkers.push(currentMarker)
          currentMarker.addTo(map)
        }
      }
      
      currentLayersRef.current = currentMarkers
    }

    // Create sea level visualization with radial effect
    if (showSeaLevel) {
      const seaLevelColor = seaLevel >= 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(220, 38, 38, 0.4)'
      const borderColor = seaLevel >= 0 ? '#3b82f6' : '#dc2626'
      
      // Create concentric circles for sea level effect
      const seaLevelCircles = []
      const baseRadius = 20000 // 20km radius
      
      for (let i = 0; i < 3; i++) {
        const radius = baseRadius - (i * 5000)
        const opacity = (Math.abs(seaLevel) * 3) * (1 - i * 0.3)
        
        const seaLevelCircle = L.circle(ROTTERDAM_COORDS, {
          radius: radius,
          fillColor: seaLevelColor,
          fillOpacity: Math.min(opacity, 0.6),
          color: borderColor,
          weight: 1,
          opacity: 0.4
        }).addTo(map)
        
        if (i === 0) {
          seaLevelCircle.bindPopup(`
            <div class="p-2">
              <h4 class="font-bold">Sea Level</h4>
              <div>Level: ${seaLevel >= 0 ? '+' : ''}${seaLevel.toFixed(2)} m</div>
              <div>Status: ${seaLevel > 0 ? 'Above mean' : seaLevel < 0 ? 'Below mean' : 'At mean'}</div>
              <div>Source: ${selectedSource.toUpperCase()}</div>
            </div>
          `)
        }
        
        seaLevelCircles.push(seaLevelCircle)
      }
      
      seaLevelLayersRef.current = seaLevelCircles
    }

    // Fly to Rotterdam marine area when activated for the first time
    if (selectedTimeIndex === 0) {
      map.flyTo(ROTTERDAM_COORDS, 10, { duration: 1.5 })
    }

  }, [visible, marineData, selectedTimeIndex, selectedSource, showWaves, showCurrents, showSeaLevel, map])

  if (!visible || !marineData) {
    return null
  }

  const currentData = marineData.hours[selectedTimeIndex]
  
  // Available data sources
  const dataSources = [
    { key: 'sg', name: 'Stormglass' },
    { key: 'ecmwf', name: 'ECMWF' },
    { key: 'metno', name: 'Met Norway' },
    { key: 'meteo', name: 'Meteoconsult' },
    { key: 'noaa', name: 'NOAA' }
  ]

  return (
    <>
      {/* Marine Control Panel */}
      <div className="absolute bottom-20 right-4 z-[1001] bg-black/90 backdrop-blur-sm p-3 rounded-lg text-white shadow-lg max-w-xs">
        <h3 className="font-bold text-sm mb-2">🌊 Marine Controls</h3>
        
        {/* Data Source Selection */}
        <div className="mb-3">
          <label className="block text-xs mb-1">Data Source:</label>
          <select 
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full p-1 border rounded text-xs bg-gray-800 text-white border-gray-600"
          >
            {dataSources.map(source => (
              <option key={source.key} value={source.key}>{source.name}</option>
            ))}
          </select>
        </div>

        {/* Time Slider */}
        <div className="mb-3">
          <label className="block text-xs mb-1">Time:</label>
          <Slider
            value={[selectedTimeIndex]}
            onValueChange={(values) => setSelectedTimeIndex(values[0])}
            min={0}
            max={marineData.hours.length - 1}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-gray-300 mt-1">
            {new Date(currentData.time).toLocaleString()}
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="space-y-2">
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showWaves}
              onChange={(e) => setShowWaves(e.target.checked)}
              className="mr-2 accent-cyan-500"
            />
            Wave Patterns
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showCurrents}
              onChange={(e) => setShowCurrents(e.target.checked)}
              className="mr-2 accent-cyan-500"
            />
            Ocean Currents
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showSeaLevel}
              onChange={(e) => setShowSeaLevel(e.target.checked)}
              className="mr-2 accent-cyan-500"
            />
            Sea Level
          </label>
        </div>

        {/* Current Conditions Summary */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="text-xs space-y-1">
            <div>🌊 {(currentData.waveHeight[selectedSource] || 0).toFixed(2)}m waves</div>
            <div>🌀 {(currentData.currentSpeed[selectedSource] || 0).toFixed(3)} m/s current</div>
            <div>📊 {currentData.seaLevel[selectedSource] >= 0 ? '+' : ''}{(currentData.seaLevel[selectedSource] || 0).toFixed(2)}m sea level</div>
          </div>
        </div>
      </div>
    </>
  )
}