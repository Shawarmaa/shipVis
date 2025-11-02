'use client'

import { Marker, Popup } from 'react-leaflet'
import { memo } from 'react'
import L from 'leaflet'
import Link from 'next/link'
import { Port } from '@/lib/portData'

// Create custom port icons
const createPortIcon = (type: 'major' | 'medium' | 'small') => {
  const size = type === 'major' ? 32 : type === 'medium' ? 24 : 18
  const color = type === 'major' ? '#FFD700' : type === 'medium' ? '#FFA500' : '#87CEEB'
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        font-size: ${size * 0.6}px;
      ">
        ⚓
      </div>
    `,
    className: 'custom-port-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  })
}

interface PortMarkerProps {
  port: Port
  onClick?: (port: Port) => void
}

function PortMarkerComponent({ port, onClick }: PortMarkerProps) {
  const icon = createPortIcon(port.type)

  return (
    <Marker
      position={port.coordinates}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(port)
      }}
    >
      <Popup className="port-popup">
        <div className="p-2 min-w-48">
          <h3 className="font-bold text-lg mb-2">{port.name}</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Country:</span> {port.country}</p>
            <p><span className="font-medium">Type:</span> {port.type}</p>
            {port.description && (
              <p><span className="font-medium">Description:</span> {port.description}</p>
            )}
            <div>
              <span className="font-medium">Facilities:</span>
              <ul className="list-disc list-inside ml-2 mt-1">
                {port.facilities.map((facility, index) => (
                  <li key={index}>{facility}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(PortMarkerComponent)