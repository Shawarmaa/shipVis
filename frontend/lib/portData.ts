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
  // Major International Ports
  {
    id: 'NLRTM',
    name: 'Port of Rotterdam',
    coordinates: [51.9225, 4.4792],
    country: 'Netherlands',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Chemical Terminal', 'Oil Terminal', 'LNG Terminal', 'Auto Terminal'],
    description: 'Europe\'s largest port by cargo tonnage'
  },
  {
    id: 'NLAMS',
    name: 'Port of Amsterdam',
    coordinates: [52.3676, 4.9041],
    country: 'Netherlands',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Cruise Terminal', 'Ferry Terminal', 'Oil Terminal'],
    description: 'Major European seaport and cruise destination'
  },
  {
    id: 'DEHAM',
    name: 'Port of Hamburg',
    coordinates: [53.5511, 9.9937],
    country: 'Germany',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Cruise Terminal', 'Ferry Terminal', 'Auto Terminal'],
    description: 'Germany\'s largest seaport and third-largest in Europe'
  },
  {
    id: 'DEBRE',
    name: 'Port of Bremen',
    coordinates: [53.0793, 8.8017],
    country: 'Germany',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Auto Terminal', 'General Cargo'],
    description: 'Major German river port on the Weser River'
  },
  {
    id: 'ITGOA',
    name: 'Port of Genoa',
    coordinates: [44.4056, 8.9463],
    country: 'Italy',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Cruise Terminal', 'Ferry Terminal', 'Oil Terminal'],
    description: 'Italy\'s largest port by cargo volume'
  },
  {
    id: 'USHOU',
    name: 'Port of Houston',
    coordinates: [29.7604, -95.3698],
    country: 'USA',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Oil Terminal', 'Chemical Terminal', 'General Cargo'],
    description: 'Largest port in the United States by tonnage'
  },
  {
    id: 'GRTHE',
    name: 'Port of Thessaloniki',
    coordinates: [40.6401, 22.9352],
    country: 'Greece',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Ferry Terminal', 'Oil Terminal'],
    description: 'Greece\'s second-largest port and main northern gateway'
  },
  {
    id: 'ESLPA',
    name: 'Port of Las Palmas',
    coordinates: [28.1460, -15.4117],
    country: 'Spain',
    type: 'major',
    facilities: ['Container Terminal', 'Cruise Terminal', 'Ferry Terminal', 'Fuel Dock', 'Repair Facilities'],
    description: 'Largest port in the Canary Islands'
  },
  {
    id: 'USNOR',
    name: 'Port of Norfolk',
    coordinates: [36.8468, -76.2951],
    country: 'USA',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Coal Terminal', 'Auto Terminal', 'Naval Base'],
    description: 'Major East Coast container port and naval station'
  },
  {
    id: 'PLgdy',
    name: 'Port of Gdynia',
    coordinates: [54.5189, 18.5305],
    country: 'Poland',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Ferry Terminal', 'Grain Terminal'],
    description: 'Major Baltic Sea port in northern Poland'
  },
  {
    id: 'GBABE',
    name: 'Port of Aberdeen',
    coordinates: [57.1497, -2.0943],
    country: 'United Kingdom',
    type: 'major',
    facilities: ['Container Terminal', 'Oil Terminal', 'Offshore Support', 'Ferry Terminal', 'Fishing Port'],
    description: 'Scotland\'s largest port and offshore energy hub'
  },
  {
    id: 'AEDXB',
    name: 'Port Jebel Ali (Dubai)',
    coordinates: [25.0118, 55.1050],
    country: 'United Arab Emirates',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Free Zone', 'Ship Repair', 'Cruise Terminal'],
    description: 'World\'s 9th busiest container port'
  },
  {
    id: 'AUMEL',
    name: 'Port of Melbourne',
    coordinates: [-37.8136, 144.9631],
    country: 'Australia',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Auto Terminal', 'Cruise Terminal'],
    description: 'Australia\'s largest container port'
  },
  {
    id: 'BGBOJ',
    name: 'Port of Burgas',
    coordinates: [42.5048, 27.4626],
    country: 'Bulgaria',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Oil Terminal', 'Ferry Terminal'],
    description: 'Major Black Sea port and oil refining center'
  },
  {
    id: 'SKBTS',
    name: 'Port of Bratislava',
    coordinates: [48.1486, 17.1077],
    country: 'Slovakia',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'River Port', 'General Cargo'],
    description: 'Major Danube River port and inland waterway hub'
  },
  
  // Medium Regional Ports
  {
    id: 'NOHAU',
    name: 'Port of Haugesund',
    coordinates: [59.4138, 5.2681],
    country: 'Norway',
    type: 'medium',
    facilities: ['Container Terminal', 'Ferry Terminal', 'Offshore Support', 'Fishing Port'],
    description: 'Advanced container terminal on Norway\'s west coast'
  },
  {
    id: 'GBBLY',
    name: 'Port of Blyth',
    coordinates: [55.1264, -1.5086],
    country: 'United Kingdom',
    type: 'medium',
    facilities: ['Bulk Terminal', 'Offshore Wind Support', 'Biomass Terminal', 'General Cargo'],
    description: 'Offshore renewable energy support base'
  },
  {
    id: 'BOSTON',
    name: 'Port of Boston',
    coordinates: [42.3601, -71.0589],
    country: 'USA',
    type: 'major',
    facilities: ['Container Terminal', 'Cruise Terminal', 'Ferry Terminal', 'LNG Terminal'],
    description: 'Historic major port serving New England'
  },
  {
    id: 'CHARLESTON',
    name: 'Port of Charleston',
    coordinates: [32.7767, -79.9311],
    country: 'USA',
    type: 'major',
    facilities: ['Container Terminal', 'Bulk Terminal', 'Auto Terminal', 'Break Bulk'],
    description: 'Major Southeast US container port'
  },
  {
    id: 'MIAMI',
    name: 'Port of Miami',
    coordinates: [25.7617, -80.1918],
    country: 'USA',
    type: 'major',
    facilities: ['Cruise Terminal', 'Container Terminal', 'Ferry Terminal', 'Fuel Dock'],
    description: 'World\'s busiest cruise port'
  }
]