'use client'

import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import PortMarker from './PortMarker'
import VesselClusterGroup from './VesselClusterGroup'
import MapSearch from './MapSearch'
import VesselSidebar from './VesselSidebar'
import { samplePorts, Port } from '@/lib/portData'
import { ShipData } from '@/lib/types'

// Fix for default markers in react-leaflet
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png'

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src || markerIcon,
  shadowUrl: markerShadow.src || markerShadow,
  iconRetinaUrl: markerRetina.src || markerRetina,
})

// Component to handle fullscreen toggle
function FullscreenControl({ isFullscreen, onToggle }: { isFullscreen: boolean, onToggle: () => void }) {
  const map = useMap()

  useEffect(() => {
    if (isFullscreen) {
      map.invalidateSize()
    }
  }, [isFullscreen, map])

  return null
}

// Component to handle map navigation
function MapController({ flyToLocation }: { flyToLocation: [number, number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (flyToLocation) {
      map.flyTo([flyToLocation[0], flyToLocation[1]], flyToLocation[2], {
        duration: 1.5
      })
    }
  }, [flyToLocation, map])

  return null
}

interface NauticalMapProps {
  center?: [number, number]
  zoom?: number
  className?: string
  vessels?: Map<number, ShipData>
}

export default function NauticalMap({ 
  center = [40.7128, -74.0060], // Default to New York Harbor
  zoom = 10,
  className = "h-screen w-full",
  vessels = new Map()
}: NauticalMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedPort, setSelectedPort] = useState<Port | null>(null)
  const [selectedVessel, setSelectedVessel] = useState<ShipData | null>(null)
  const [flyToLocation, setFlyToLocation] = useState<[number, number, number] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Memoize callback functions to prevent unnecessary re-renders
  const handleLocationSelect = useCallback((coordinates: [number, number], zoom = 12) => {
    setFlyToLocation([coordinates[0], coordinates[1], zoom])
  }, [])

  const handleVesselClick = useCallback((vessel: ShipData) => {
    setSelectedVessel(vessel)
    setSidebarOpen(true)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
    setSelectedVessel(null)
  }, [])

  const handlePortClick = useCallback((port: Port) => {
    setSelectedPort(port)
  }, [])

  // Memoize port markers to prevent recreation on every render
  const portMarkers = useMemo(() => 
    samplePorts.map(port => (
      <PortMarker 
        key={port.id} 
        port={port} 
        onClick={handlePortClick}
      />
    )), [handlePortClick]
  )

  return (
    <div className={className} style={{ position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        boxZoom={true}
        keyboard={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
          minZoom={2}
        />
        <FullscreenControl isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
        <MapController flyToLocation={flyToLocation} />
        
        {/* Render all ports */}
        {portMarkers}
        
        {/* Render clustered vessels */}
        <VesselClusterGroup 
          vessels={vessels} 
          onVesselClick={handleVesselClick}
        />
      </MapContainer>
      
      {/* Search component */}
      <div className={`absolute top-4 z-[1001] w-72 transition-all duration-300 ${
        sidebarOpen ? 'right-[25rem]' : 'right-20'
      }`}>
        <MapSearch
          ports={samplePorts}
          vessels={vessels}
          onLocationSelect={handleLocationSelect}
          className="w-full"
        />
      </div>
      
      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-[1001] bg-black/80 backdrop-blur-sm p-2 rounded-lg text-white hover:bg-black/90 transition-colors"
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
      
      {/* Vessel details sidebar */}
      <VesselSidebar 
        vessel={selectedVessel}
        onClose={handleSidebarClose}
        isOpen={sidebarOpen}
      />
    </div>
  )
}