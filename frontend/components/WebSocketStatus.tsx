'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Wifi } from 'lucide-react'

interface WebSocketStatusProps {
  status: string
  error?: string
  vessels: Map<any, any>
  shipsStatus: string
  shipsError?: string
  shipsVessels: Map<any, any>
  filteredStatus: string
  filteredError?: string
  filteredVessels: Map<any, any>
  allShipsEnabled?: boolean
}

export default function WebSocketStatus({
  status,
  error,
  vessels,
  shipsStatus,
  shipsError,
  shipsVessels,
  filteredStatus,
  filteredError,
  filteredVessels,
  allShipsEnabled = false
}: WebSocketStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const isConnected = status === 'connected' && shipsStatus === 'connected' && filteredStatus === 'connected'

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-black/80 backdrop-blur-sm p-2 rounded-lg text-white shadow-lg hover:bg-black/90 transition-colors flex items-center"
      >
        <Wifi 
          size={14} 
          className={`mr-1 ${isConnected ? 'text-green-400' : 'text-red-400'}`} 
        />
        <span className="text-xs font-medium">Status</span>
        {isExpanded ? <ChevronDown size={14} className="ml-1" /> : <ChevronUp size={14} className="ml-1" />}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-2 bg-black/80 backdrop-blur-sm p-3 rounded-lg text-white max-w-xs">
          <div className="text-sm space-y-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs">All Ships:</span>
                <span className={`px-2 py-0.5 rounded text-xs ${allShipsEnabled ? getStatusColor(status) : 'bg-gray-600'}`}>
                  {allShipsEnabled ? status : 'disabled'}
                </span>
              </div>
              {error && allShipsEnabled && <p className="text-red-400 text-xs">{error}</p>}
              <p className="text-xs">Vessels: {allShipsEnabled ? vessels.size : 0}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Rotterdam:</span>
                <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(shipsStatus)}`}>
                  {shipsStatus}
                </span>
              </div>
              {shipsError && <p className="text-red-400 text-xs">{shipsError}</p>}
              <p className="text-xs">Port-bound: {shipsVessels.size}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Filtered:</span>
                <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(filteredStatus)}`}>
                  {filteredStatus}
                </span>
              </div>
              {filteredError && <p className="text-red-400 text-xs">{filteredError}</p>}
              <p className="text-xs">Filtered: {filteredVessels.size}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}