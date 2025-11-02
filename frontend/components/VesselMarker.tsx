'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { ShipData } from '@/lib/types'

// Get ship type name
const getShipTypeName = (shipType: number): string => {
  const shipTypes: { [key: number]: string } = {
    30: 'Fishing',
    31: 'Towing',
    32: 'Towing',
    33: 'Dredging',
    34: 'Diving',
    35: 'Military',
    36: 'Sailing',
    37: 'Pleasure',
    40: 'High Speed Craft',
    50: 'Pilot',
    51: 'Search and Rescue',
    52: 'Tug',
    53: 'Port Tender',
    54: 'Anti-Pollution',
    55: 'Law Enforcement',
    58: 'Medical',
    60: 'Passenger',
    70: 'Cargo',
    71: 'Cargo - Hazardous A',
    72: 'Cargo - Hazardous B',
    73: 'Cargo - Hazardous C',
    74: 'Cargo - Hazardous D',
    80: 'Tanker',
    81: 'Tanker - Hazardous A',
    82: 'Tanker - Hazardous B',
    83: 'Tanker - Hazardous C',
    84: 'Tanker - Hazardous D',
    90: 'Other'
  }
  return shipTypes[shipType] || 'Unknown'
}

// Get navigation status name
const getNavStatusName = (navStatus: number): string => {
  const navStatuses: { [key: number]: string } = {
    0: 'Under Way Using Engine',
    1: 'At Anchor',
    2: 'Not Under Command',
    3: 'Restricted Manoeuvrability',
    4: 'Constrained by Draught',
    5: 'Moored',
    6: 'Aground',
    7: 'Engaged in Fishing',
    8: 'Under Way Sailing',
    11: 'Power-driven Vessel Towing Astern',
    12: 'Power-driven Vessel Pushing Ahead',
    15: 'Undefined'
  }
  return navStatuses[navStatus] || 'Unknown'
}

// Create vessel icon based on ship type and status
const createVesselIcon = (vessel: ShipData) => {
  const getVesselColor = (shipType: number, speed: number) => {
    if (speed < 0.1) return '#FF4444' // Red for stopped
    if (speed < 5) return '#FFA500' // Orange for slow
    return '#00FF00' // Green for moving
  }

  const getVesselSymbol = (shipType: number) => {
    if (shipType >= 60 && shipType <= 69) return '🚢' // Passenger
    if (shipType >= 70 && shipType <= 79) return '📦' // Cargo
    if (shipType >= 80 && shipType <= 89) return '🛢️' // Tanker
    if (shipType >= 30 && shipType <= 39) return '🎣' // Fishing/Special
    return '⛵' // Default/Other
  }

  const color = getVesselColor(vessel.ship_type, vessel.speed)
  const symbol = getVesselSymbol(vessel.ship_type)
  
  return L.divIcon({
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        font-size: 12px;
        transform: rotate(${vessel.heading || vessel.course}deg);
        position: relative;
      ">
        ${symbol}
        <div style="
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 8px solid ${color};
        "></div>
      </div>
    `,
    className: 'custom-vessel-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

interface VesselMarkerProps {
  vessel: ShipData
  onClick?: (vessel: ShipData) => void
}

export default function VesselMarker({ vessel, onClick }: VesselMarkerProps) {
  const icon = createVesselIcon(vessel)

  return (
    <Marker
      position={[vessel.latitude, vessel.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(vessel)
      }}
    >
      <Popup className="vessel-popup">
        <div className="p-3 min-w-64">
          <h3 className="font-bold text-lg mb-2">{vessel.ship_name || 'Unknown Vessel'}</h3>
          <div className="space-y-1 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p><span className="font-medium">MMSI:</span> {vessel.mmsi}</p>
                <p><span className="font-medium">Call Sign:</span> {vessel.call_sign || 'N/A'}</p>
                <p><span className="font-medium">Type:</span> {getShipTypeName(vessel.ship_type)}</p>
              </div>
              <div>
                <p><span className="font-medium">Speed:</span> {vessel.speed.toFixed(1)} kts</p>
                <p><span className="font-medium">Course:</span> {vessel.course}°</p>
                <p><span className="font-medium">Heading:</span> {vessel.heading}°</p>
              </div>
            </div>
            <div className="mt-2">
              <p><span className="font-medium">Status:</span> {getNavStatusName(vessel.nav_status)}</p>
              <p><span className="font-medium">Destination:</span> {vessel.destination || 'Unknown'}</p>
              <p><span className="font-medium">Last Update:</span> {new Date(vessel.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}