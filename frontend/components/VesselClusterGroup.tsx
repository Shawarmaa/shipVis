'use client'

import { useEffect, useMemo, memo } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { useMap } from 'react-leaflet'
import { ShipData } from '@/lib/types'

// Get ship type symbol
const getVesselSymbol = (shipType: number) => {
  if (shipType >= 60 && shipType <= 69) return '🚢' // Passenger
  if (shipType >= 70 && shipType <= 79) return '📦' // Cargo
  if (shipType >= 80 && shipType <= 89) return '🛢️' // Tanker
  if (shipType >= 30 && shipType <= 39) return '🎣' // Fishing/Special
  return '⛵' // Default/Other
}

// Get vessel color based on speed
const getVesselColor = (speed: number) => {
  if (speed < 0.1) return '#FF4444' // Red for stopped
  if (speed < 5) return '#FFA500' // Orange for slow
  return '#00FF00' // Green for moving
}

// Create vessel icon
const createVesselIcon = (vessel: ShipData) => {
  const color = getVesselColor(vessel.speed)
  const symbol = getVesselSymbol(vessel.ship_type)
  
  return L.divIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        font-size: 10px;
        transform: rotate(${vessel.heading || vessel.course}deg);
        position: relative;
      ">
        ${symbol}
        <div style="
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-bottom: 6px solid ${color};
        "></div>
      </div>
    `,
    className: 'custom-vessel-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

interface VesselClusterGroupProps {
  vessels: Map<number, ShipData>
  onVesselClick?: (vessel: ShipData) => void
}

function VesselClusterGroupComponent({ vessels, onVesselClick }: VesselClusterGroupProps) {
  const map = useMap()

  // Memoize the cluster group to prevent recreation on every render
  const markerClusterGroup = useMemo(() => {
    return L.markerClusterGroup({
      // Clustering options
      maxClusterRadius: 50, // Pixels
      disableClusteringAtZoom: 15, // Disable clustering at high zoom
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      
      // Custom cluster icon creation with maritime theming
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        let size = 'small'
        let sizeClass = 'marker-cluster-small'
        let iconSize = 30
        let fontSize = '12px'
        
        if (count < 10) {
          size = 'small'
          sizeClass = 'marker-cluster-small'
          iconSize = 30
          fontSize = '12px'
        } else if (count < 100) {
          size = 'medium'
          sizeClass = 'marker-cluster-medium'
          iconSize = 40
          fontSize = '14px'
        } else {
          size = 'large'
          sizeClass = 'marker-cluster-large'
          iconSize = 50
          fontSize = '16px'
        }

        return L.divIcon({
          html: `
            <div style="
              width: ${iconSize}px;
              height: ${iconSize}px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${fontSize};
              position: relative;
              border-radius: 50%;
            ">
              <div style="
                position: absolute;
                top: 2px;
                right: 2px;
                font-size: 8px;
              ">⚓</div>
              ${count}
            </div>
          `,
          className: `marker-cluster ${sizeClass}`,
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize / 2, iconSize / 2]
        })
      }
    })
  }, [])

  // Update markers when vessels change
  useEffect(() => {
    // Clear existing markers
    markerClusterGroup.clearLayers()

    // Add new markers
    vessels.forEach(vessel => {
      const marker = L.marker([vessel.latitude, vessel.longitude], {
        icon: createVesselIcon(vessel)
      })

      // Add popup with vessel info
      marker.bindPopup(`
        <div class="p-2 min-w-48">
          <h3 class="font-bold text-sm mb-1">${vessel.ship_name || 'Unknown Vessel'}</h3>
          <div class="text-xs space-y-1">
            <p><span class="font-medium">MMSI:</span> ${vessel.mmsi}</p>
            <p><span class="font-medium">Speed:</span> ${vessel.speed.toFixed(1)} kts</p>
            <p><span class="font-medium">Course:</span> ${vessel.course}°</p>
            <p><span class="font-medium">Heading:</span> ${vessel.heading}°</p>
          </div>
        </div>
      `)

      // Add click handler
      marker.on('click', () => {
        onVesselClick?.(vessel)
      })

      markerClusterGroup.addLayer(marker)
    })
  }, [vessels, markerClusterGroup, onVesselClick])

  // Add/remove cluster group from map
  useEffect(() => {
    map.addLayer(markerClusterGroup)

    return () => {
      map.removeLayer(markerClusterGroup)
    }
  }, [map, markerClusterGroup])

  return null
}

// Memoize the component to prevent unnecessary re-renders
export default memo(VesselClusterGroupComponent, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if vessels Map reference changed
  return prevProps.vessels === nextProps.vessels && prevProps.onVesselClick === nextProps.onVesselClick
})