'use client'

import { X, MapPin, Clock, Compass, Gauge, Ship } from 'lucide-react'
import { ShipData } from '@/lib/types'

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

const getStatusColor = (navStatus: number, speed: number): string => {
  if (speed < 0.1) return 'text-red-400'
  if (navStatus === 1 || navStatus === 5) return 'text-yellow-400' // At anchor or moored
  if (speed > 10) return 'text-green-400'
  return 'text-blue-400'
}

interface VesselSidebarProps {
  vessel: ShipData | null
  onClose: () => void
  isOpen: boolean
}

export default function VesselSidebar({ vessel, onClose, isOpen }: VesselSidebarProps) {
  if (!vessel) return null

  return (
    <div className={`fixed top-0 right-0 h-full w-96 bg-black/90 backdrop-blur-sm border-l border-white/20 z-[1001] transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="p-6 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Vessel Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Vessel Name & Type */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">
            {vessel.ship_name || 'Unknown Vessel'}
          </h3>
          <div className="flex items-center gap-2 text-gray-300">
            <Ship size={16} />
            <span>{getShipTypeName(vessel.ship_type)}</span>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              vessel.speed < 0.1 ? 'bg-red-400' : 
              vessel.nav_status === 1 || vessel.nav_status === 5 ? 'bg-yellow-400' : 
              'bg-green-400'
            }`}></div>
            <span className={`font-medium ${getStatusColor(vessel.nav_status, vessel.speed)}`}>
              {getNavStatusName(vessel.nav_status)}
            </span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Gauge size={16} />
              <span className="text-sm">Speed</span>
            </div>
            <div className="text-xl font-bold text-white">
              {vessel.speed.toFixed(1)} <span className="text-sm font-normal">kts</span>
            </div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Compass size={16} />
              <span className="text-sm">Course</span>
            </div>
            <div className="text-xl font-bold text-white">
              {vessel.course}°
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">IDENTIFICATION</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">MMSI:</span>
                <span className="text-white font-mono">{vessel.mmsi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Call Sign:</span>
                <span className="text-white font-mono">{vessel.call_sign || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">NAVIGATION</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Heading:</span>
                <span className="text-white">{vessel.heading}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Course:</span>
                <span className="text-white">{vessel.course}°</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">POSITION</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Latitude:</span>
                <span className="text-white font-mono">{vessel.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Longitude:</span>
                <span className="text-white font-mono">{vessel.longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">DESTINATION</h4>
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-gray-400 mt-0.5" />
              <span className="text-white text-sm">
                {vessel.destination || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Docking Assessment */}
          {vessel.status && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">DOCKING ASSESSMENT</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    vessel.status === 'DOCK' ? 'bg-green-600/20 text-green-400 border border-green-600/30' :
                    vessel.status === 'DELAY' ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' :
                    vessel.status === 'NO_DOCK' ? 'bg-red-600/20 text-red-400 border border-red-600/30' :
                    'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                  }`}>
                    {vessel.status}
                  </span>
                </div>
                
                {vessel.risk_score !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Risk Score:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono">
                        {(vessel.risk_score * 100).toFixed(1)}%
                      </span>
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            vessel.risk_score < 0.3 ? 'bg-green-500' :
                            vessel.risk_score < 0.7 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${vessel.risk_score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {vessel.risk_factors && Object.keys(vessel.risk_factors).length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-300 text-sm block mb-2">Risk Factors:</span>
                    <div className="space-y-1 text-xs">
                      {Object.entries(vessel.risk_factors).map(([key, value], index) => (
                        <div key={index} className="flex justify-between text-gray-400">
                          <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">LAST UPDATE</h4>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-white text-sm">
                {new Date(vessel.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}