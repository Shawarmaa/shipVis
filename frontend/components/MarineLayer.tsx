'use client'

import { useEffect, useState } from 'react'
import { Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'

// Rotterdam coordinates from the marine data
const ROTTERDAM_COORDS: [number, number] = [51.9225, 4.4792]

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

// Create wave height visualization icon
const createWaveIcon = (waveHeight: number, waveDirection: number) => {
  const size = Math.max(20, Math.min(60, waveHeight * 20)) // Scale based on wave height
  const color = waveHeight > 2 ? '#dc2626' : waveHeight > 1.5 ? '#f59e0b' : '#10b981'
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${waveHeight.toFixed(1)}m
      </div>
    `,
    className: 'wave-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  })
}

// Create current direction arrow
const createCurrentArrow = (speed: number, direction: number) => {
  const arrowSize = Math.max(20, Math.min(40, speed * 200)) // Scale based on current speed
  return L.divIcon({
    html: `
      <div style="
        width: ${arrowSize}px;
        height: ${arrowSize}px;
        transform: rotate(${direction}deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 0;
          height: 0;
          border-left: ${arrowSize/4}px solid transparent;
          border-right: ${arrowSize/4}px solid transparent;
          border-bottom: ${arrowSize*0.7}px solid #0ea5e9;
          transform: translateY(-2px);
        "></div>
        <div style="
          position: absolute;
          top: ${arrowSize-5}px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 1px 3px;
          border-radius: 3px;
          font-size: 8px;
          white-space: nowrap;
        ">${speed.toFixed(2)} m/s</div>
      </div>
    `,
    className: 'current-arrow',
    iconSize: [arrowSize, arrowSize],
    iconAnchor: [arrowSize/2, arrowSize/2]
  })
}

// Create sea level indicator
const createSeaLevelIcon = (seaLevel: number) => {
  const color = seaLevel > 0 ? '#3b82f6' : '#ef4444'
  const symbol = seaLevel > 0 ? '↑' : '↓'
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        color: white;
        padding: 4px 8px;
        border-radius: 8px;
        text-align: center;
        font-family: sans-serif;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        min-width: 60px;
      ">
        ${symbol} ${Math.abs(seaLevel).toFixed(2)}m
      </div>
    `,
    className: 'sea-level-marker',
    iconSize: [60, 24],
    iconAnchor: [30, 12]
  })
}

interface MarineLayerProps {
  visible: boolean
}

export default function MarineLayer({ visible }: MarineLayerProps) {
  const [marineData, setMarineData] = useState<MarineData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSource, setSelectedSource] = useState<string>('sg') // Default to Stormglass
  const map = useMap()

  useEffect(() => {
    if (visible && !marineData) {
      setLoading(true)
      // Load marine data from the public folder
      fetch('/marine_data.json')
        .then(response => response.json())
        .then((data: MarineData) => {
          setMarineData(data)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error loading marine data:', error)
          setLoading(false)
        })
    }
  }, [visible, marineData])

  useEffect(() => {
    if (visible && marineData && map) {
      // Fly to Rotterdam when marine layer is activated
      map.flyTo(ROTTERDAM_COORDS, 10, { duration: 1.5 })
    }
  }, [visible, marineData, map])

  if (!visible || !marineData) {
    return null
  }

  // Get current marine data (first hour)
  const currentData = marineData.hours[0]

  // Get data from selected source
  const waveHeight = currentData.waveHeight[selectedSource] || 0
  const waveDirection = currentData.waveDirection[selectedSource] || 0
  const currentSpeed = currentData.currentSpeed[selectedSource] || 0
  const currentDirection = currentData.currentDirection[selectedSource] || 0
  const seaLevel = currentData.seaLevel[selectedSource] || 0

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
      {/* Wave height visualization */}
      <Marker
        position={ROTTERDAM_COORDS}
        icon={createWaveIcon(waveHeight, waveDirection)}
      >
        <Popup>
          <div className="p-2 min-w-[200px]">
            <h3 className="font-bold text-lg">Marine Conditions</h3>
            <div className="mt-2 mb-3">
              <label className="block text-sm font-medium mb-1">Data Source:</label>
              <select 
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full p-1 border rounded text-sm"
              >
                {dataSources.map(source => (
                  <option key={source.key} value={source.key}>{source.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <div><strong>Wave Height:</strong> {waveHeight.toFixed(2)} m</div>
              <div><strong>Wave Direction:</strong> {waveDirection.toFixed(0)}°</div>
              <div><strong>Current Speed:</strong> {currentSpeed.toFixed(3)} m/s</div>
              <div><strong>Current Direction:</strong> {currentDirection.toFixed(0)}°</div>
              <div><strong>Sea Level:</strong> {seaLevel >= 0 ? '+' : ''}{seaLevel.toFixed(2)} m</div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Time: {new Date(currentData.time).toLocaleString()}
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Current direction arrow */}
      {currentSpeed > 0 && (
        <Marker
          position={[ROTTERDAM_COORDS[0] + 0.015, ROTTERDAM_COORDS[1] + 0.015]}
          icon={createCurrentArrow(currentSpeed, currentDirection)}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-bold">Ocean Current</h4>
              <div className="mt-1 space-y-1">
                <div><strong>Speed:</strong> {currentSpeed.toFixed(3)} m/s</div>
                <div><strong>Direction:</strong> {currentDirection.toFixed(0)}°</div>
                <div><strong>Source:</strong> {dataSources.find(s => s.key === selectedSource)?.name}</div>
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Sea level indicator */}
      <Marker
        position={[ROTTERDAM_COORDS[0] - 0.015, ROTTERDAM_COORDS[1] - 0.015]}
        icon={createSeaLevelIcon(seaLevel)}
      >
        <Popup>
          <div className="p-2">
            <h4 className="font-bold">Sea Level</h4>
            <div className="mt-1 space-y-1">
              <div><strong>Level:</strong> {seaLevel >= 0 ? '+' : ''}{seaLevel.toFixed(2)} m</div>
              <div><strong>Status:</strong> {seaLevel > 0 ? 'Above mean' : 'Below mean'}</div>
              <div><strong>Source:</strong> {dataSources.find(s => s.key === selectedSource)?.name}</div>
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Wave height area visualization */}
      <Circle
        center={ROTTERDAM_COORDS}
        radius={waveHeight * 1000} // Scale radius based on wave height
        pathOptions={{
          color: waveHeight > 2 ? '#dc2626' : waveHeight > 1.5 ? '#f59e0b' : '#10b981',
          fillColor: waveHeight > 2 ? '#dc2626' : waveHeight > 1.5 ? '#f59e0b' : '#10b981',
          fillOpacity: 0.1,
          weight: 2
        }}
      />
    </>
  )
}