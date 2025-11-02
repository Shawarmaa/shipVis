export interface Port {
  id: string
  name: string
  coordinates: [number, number] // [lat, lng]
  country: string
  type: 'major' | 'medium' | 'small'
  facilities: string[]
  description?: string
}

export const samplePorts: Port[] = [
  {
    id: 'port-ny',
    name: 'Port of New York',
    coordinates: [40.6892, -74.0445],
    country: 'USA',
    type: 'major',
    facilities: ['Container Terminal', 'Cruise Terminal', 'Fuel Dock'],
    description: 'Major port serving the New York metropolitan area'
  },
  {
    id: 'port-boston',
    name: 'Port of Boston',
    coordinates: [42.3601, -71.0589],
    country: 'USA',
    type: 'major',
    facilities: ['Container Terminal', 'Ferry Terminal'],
    description: 'Historic port in Massachusetts'
  },
  {
    id: 'port-miami',
    name: 'Port of Miami',
    coordinates: [25.7617, -80.1918],
    country: 'USA',
    type: 'major',
    facilities: ['Cruise Terminal', 'Container Terminal', 'Fuel Dock'],
    description: 'Major cruise and cargo port in Florida'
  },
  {
    id: 'port-charleston',
    name: 'Port of Charleston',
    coordinates: [32.7767, -79.9311],
    country: 'USA',
    type: 'medium',
    facilities: ['Container Terminal', 'Bulk Terminal'],
    description: 'Important container port in South Carolina'
  },
  {
    id: 'port-savannah',
    name: 'Port of Savannah',
    coordinates: [32.0835, -81.0998],
    country: 'USA',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Auto Terminal'],
    description: 'One of the fastest-growing container ports in the US'
  }
]