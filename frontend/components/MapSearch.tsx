'use client'

import { useState, useMemo } from 'react'
import Select from 'react-select'
import { Search, MapPin, Ship } from 'lucide-react'
import { Port } from '@/lib/portData'
import { ShipData } from '@/lib/types'

interface SearchOption {
  value: string
  label: string
  type: 'port' | 'vessel'
  data: Port | ShipData
  coordinates: [number, number]
}

interface MapSearchProps {
  ports: Port[]
  vessels: Map<number, ShipData>
  onLocationSelect: (coordinates: [number, number], zoom?: number) => void
  className?: string
}

export default function MapSearch({ ports, vessels, onLocationSelect, className = "" }: MapSearchProps) {
  const [isOpen, setIsOpen] = useState(false)

  const searchOptions = useMemo((): SearchOption[] => {
    const portOptions: SearchOption[] = ports.map(port => ({
      value: `port-${port.id}`,
      label: `${port.name} (${port.country})`,
      type: 'port',
      data: port,
      coordinates: port.coordinates
    }))

    const vesselOptions: SearchOption[] = Array.from(vessels.values()).map(vessel => ({
      value: `vessel-${vessel.mmsi}`,
      label: `${vessel.ship_name || 'Unknown'} (MMSI: ${vessel.mmsi})`,
      type: 'vessel',
      data: vessel,
      coordinates: [vessel.latitude, vessel.longitude]
    }))

    return [...portOptions, ...vesselOptions]
  }, [ports, vessels])

  const handleSelect = (option: SearchOption | null) => {
    if (option) {
      const zoom = option.type === 'port' ? 12 : 15
      onLocationSelect(option.coordinates, zoom)
      setIsOpen(false)
    }
  }

  const formatOptionLabel = (option: SearchOption) => (
    <div className="flex items-center gap-2 p-1">
      {option.type === 'port' ? (
        <MapPin size={16} className="text-amber-500" />
      ) : (
        <Ship size={16} className="text-blue-500" />
      )}
      <div>
        <div className="font-medium">{option.label}</div>
        {option.type === 'vessel' && (
          <div className="text-xs text-gray-500">
            {(option.data as ShipData).speed.toFixed(1)} kts • {(option.data as ShipData).course}°
          </div>
        )}
      </div>
    </div>
  )

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: 'white',
      minHeight: '42px',
      '&:hover': {
        borderColor: 'rgba(255, 255, 255, 0.4)'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      zIndex: 1001
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      color: 'white',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'rgba(255, 255, 255, 0.7)'
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'white'
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'white'
    })
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative right-5">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
        <Select
          options={searchOptions}
          placeholder="Search vessels & ports..."
          isSearchable
          isClearable
          onChange={handleSelect}
          formatOptionLabel={formatOptionLabel}
          styles={{
            ...customStyles,
            control: (provided: any) => ({
              ...customStyles.control(provided),
              paddingLeft: '1.5rem'
            })
          }}
          className=""
          classNamePrefix="react-select"
          filterOption={(option, inputValue) => {
            const searchText = inputValue.toLowerCase()
            const optionData = option.data as SearchOption
            
            // Search in label
            if (optionData.label.toLowerCase().includes(searchText)) return true
            
            // Search in vessel details
            if (optionData.type === 'vessel') {
              const vessel = optionData.data as ShipData
              return (
                vessel.mmsi.toString().includes(searchText) ||
                vessel.call_sign?.toLowerCase().includes(searchText) ||
                vessel.destination?.toLowerCase().includes(searchText)
              )
            }
            
            // Search in port details
            if (optionData.type === 'port') {
              const port = optionData.data as Port
              return (
                port.country.toLowerCase().includes(searchText) ||
                port.facilities.some(f => f.toLowerCase().includes(searchText))
              )
            }
            
            return false
          }}
        />
      </div>
    </div>
  )
}