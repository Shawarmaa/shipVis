'use client'

import { useEffect, useState, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { Slider } from '@/components/ui/slider'

// Rotterdam coordinates and surrounding area
const ROTTERDAM_COORDS: [number, number] = [51.9225, 4.4792]
const WEATHER_BOUNDS = [
  [51.7, 4.2], // Southwest
  [52.2, 5.0]  // Northeast
]

interface WeatherData {
  cod: string
  message: number
  cnt: number
  list: Array<{
    dt: number
    main: {
      temp: number
      feels_like: number
      temp_min: number
      temp_max: number
      pressure: number
      sea_level: number
      grnd_level: number
      humidity: number
      temp_kf: number
    }
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
    clouds: {
      all: number
    }
    wind: {
      speed: number
      deg: number
      gust?: number
    }
    visibility: number
    pop: number
    rain?: {
      '3h': number
    }
    sys: {
      pod: string
    }
    dt_txt: string
  }>
  city: {
    id: number
    name: string
    coord: {
      lat: number
      lon: number
    }
    country: string
    population: number
    timezone: number
    sunrise: number
    sunset: number
  }
}

// Temperature color scale
const getTemperatureColor = (tempCelsius: number): string => {
  if (tempCelsius < -10) return '#000080' // Dark blue
  if (tempCelsius < 0) return '#0000FF'   // Blue
  if (tempCelsius < 5) return '#00FFFF'   // Cyan
  if (tempCelsius < 10) return '#00FF00'  // Green
  if (tempCelsius < 15) return '#FFFF00'  // Yellow
  if (tempCelsius < 20) return '#FF8000'  // Orange
  if (tempCelsius < 25) return '#FF0000'  // Red
  if (tempCelsius < 30) return '#FF00FF'  // Magenta
  return '#800080' // Purple
}

// Cloud opacity based on cloud coverage percentage
const getCloudOpacity = (cloudCoverage: number): number => {
  return Math.min(cloudCoverage / 100 * 0.7, 0.7) // Max 70% opacity
}

// Rain intensity color
const getRainColor = (rainAmount: number): string => {
  if (rainAmount === 0) return 'transparent'
  if (rainAmount < 0.5) return 'rgba(0, 100, 255, 0.2)'
  if (rainAmount < 2) return 'rgba(0, 100, 255, 0.4)'
  if (rainAmount < 5) return 'rgba(0, 50, 255, 0.6)'
  return 'rgba(0, 0, 255, 0.8)'
}

interface AdvancedWeatherLayerProps {
  visible: boolean
}

export default function AdvancedWeatherLayer({ visible }: AdvancedWeatherLayerProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0)
  const [showTemperature, setShowTemperature] = useState(true)
  const [showClouds, setShowClouds] = useState(true)
  const [showRain, setShowRain] = useState(true)
  const [showWind, setShowWind] = useState(true)
  
  const map = useMap()
  const temperatureLayersRef = useRef<L.Circle[] | null>(null)
  const cloudLayersRef = useRef<L.Circle[] | null>(null)
  const rainLayersRef = useRef<L.Circle[] | null>(null)
  const windLayersRef = useRef<L.Marker[] | null>(null)

  useEffect(() => {
    if (visible && !weatherData) {
      fetch('/weather_data.json')
        .then(response => response.json())
        .then((data: WeatherData) => {
          setWeatherData(data)
        })
        .catch(error => {
          console.error('Error loading weather data:', error)
        })
    }
  }, [visible, weatherData])

  useEffect(() => {
    if (!visible || !weatherData || !map) {
      // Clean up all layers when not visible
      if (temperatureLayersRef.current) {
        temperatureLayersRef.current.forEach(layer => map.removeLayer(layer))
        temperatureLayersRef.current = null
      }
      if (cloudLayersRef.current) {
        cloudLayersRef.current.forEach(layer => map.removeLayer(layer))
        cloudLayersRef.current = null
      }
      if (rainLayersRef.current) {
        rainLayersRef.current.forEach(layer => map.removeLayer(layer))
        rainLayersRef.current = null
      }
      if (windLayersRef.current) {
        windLayersRef.current.forEach(marker => map.removeLayer(marker))
        windLayersRef.current = null
      }
      return
    }

    const currentWeather = weatherData.list[selectedTimeIndex]
    const tempCelsius = currentWeather.main.temp - 273.15

    // Clean up existing layers
    if (temperatureLayersRef.current) {
      temperatureLayersRef.current.forEach(layer => map.removeLayer(layer))
    }
    if (cloudLayersRef.current) {
      cloudLayersRef.current.forEach(layer => map.removeLayer(layer))
    }
    if (rainLayersRef.current) {
      rainLayersRef.current.forEach(layer => map.removeLayer(layer))
    }
    if (windLayersRef.current) {
      windLayersRef.current.forEach(marker => map.removeLayer(marker))
    }

    // Create temperature heatmap overlay with radial gradients
    if (showTemperature) {
      const tempColor = getTemperatureColor(tempCelsius)
      
      // Create multiple overlapping circles for smooth gradient effect
      const tempCircles = []
      const baseRadius = 15000 // 15km radius
      
      for (let i = 0; i < 4; i++) {
        const radius = baseRadius - (i * 3000)
        const opacity = 0.4 - (i * 0.08)
        
        const tempCircle = L.circle(ROTTERDAM_COORDS, {
          radius: radius,
          fillColor: tempColor,
          fillOpacity: opacity,
          color: tempColor,
          weight: 1,
          opacity: opacity * 0.8
        }).addTo(map)
        
        if (i === 0) {
          tempCircle.bindPopup(`
            <div class="p-2">
              <h4 class="font-bold">Temperature Zone</h4>
              <div>Temperature: ${tempCelsius.toFixed(1)}°C</div>
              <div>Feels like: ${(currentWeather.main.feels_like - 273.15).toFixed(1)}°C</div>
              <div>Humidity: ${currentWeather.main.humidity}%</div>
            </div>
          `)
        }
        
        tempCircles.push(tempCircle)
      }
      
      temperatureLayersRef.current = tempCircles
    }

    // Create cloud coverage overlay with organic shapes
    if (showClouds && currentWeather.clouds.all > 10) {
      const cloudOpacity = getCloudOpacity(currentWeather.clouds.all)
      
      // Create multiple organic cloud shapes using circles
      const cloudShapes = []
      const cloudClusters = 5 // Number of cloud clusters
      
      for (let cluster = 0; cluster < cloudClusters; cluster++) {
        // Random position around Rotterdam
        const offsetLat = (Math.random() - 0.5) * 0.4
        const offsetLng = (Math.random() - 0.5) * 0.6
        const clusterCenter: [number, number] = [
          ROTTERDAM_COORDS[0] + offsetLat,
          ROTTERDAM_COORDS[1] + offsetLng
        ]
        
        // Create multiple overlapping circles for each cloud cluster
        for (let i = 0; i < 3; i++) {
          const microOffsetLat = (Math.random() - 0.5) * 0.05
          const microOffsetLng = (Math.random() - 0.5) * 0.08
          const cloudCenter: [number, number] = [
            clusterCenter[0] + microOffsetLat,
            clusterCenter[1] + microOffsetLng
          ]
          
          const radius = 3000 + Math.random() * 4000 // Random cloud size
          const cloudCircle = L.circle(cloudCenter, {
            radius: radius,
            fillColor: '#ffffff',
            fillOpacity: cloudOpacity * (0.3 + Math.random() * 0.4),
            color: '#e5e7eb',
            weight: 1,
            opacity: 0.2
          })
          
          cloudShapes.push(cloudCircle)
          cloudCircle.addTo(map)
        }
      }
      
      if (cloudShapes.length > 0) {
        cloudShapes[0].bindPopup(`
          <div class="p-2">
            <h4 class="font-bold">Cloud Coverage</h4>
            <div>Coverage: ${currentWeather.clouds.all}%</div>
            <div>Visibility: ${(currentWeather.visibility / 1000).toFixed(1)} km</div>
          </div>
        `)
      }
      
      cloudLayersRef.current = cloudShapes
    }

    // Create precipitation overlay with organic patterns
    if (showRain && currentWeather.rain) {
      const rainAmount = currentWeather.rain['3h']
      const rainColor = getRainColor(rainAmount)
      
      if (rainColor !== 'transparent') {
        // Create multiple overlapping rain zones for natural effect
        const rainShapes = []
        const rainZones = 3
        
        for (let i = 0; i < rainZones; i++) {
          const offsetLat = (Math.random() - 0.5) * 0.3
          const offsetLng = (Math.random() - 0.5) * 0.4
          const rainCenter: [number, number] = [
            ROTTERDAM_COORDS[0] + offsetLat,
            ROTTERDAM_COORDS[1] + offsetLng
          ]
          
          const radius = 8000 + Math.random() * 6000
          const rainOpacity = 0.3 + (rainAmount / 10) * 0.4
          
          const rainCircle = L.circle(rainCenter, {
            radius: radius,
            fillColor: '#0066ff',
            fillOpacity: rainOpacity * (0.7 + Math.random() * 0.3),
            color: '#004499',
            weight: 1,
            opacity: 0.5
          })
          
          rainShapes.push(rainCircle)
          rainCircle.addTo(map)
        }
        
        if (rainShapes.length > 0) {
          rainShapes[0].bindPopup(`
            <div class="p-2">
              <h4 class="font-bold">Precipitation</h4>
              <div>Rain (3h): ${rainAmount} mm</div>
              <div>Probability: ${(currentWeather.pop * 100).toFixed(0)}%</div>
            </div>
          `)
        }
        
        rainLayersRef.current = rainShapes
      }
    }

    // Create advanced wind visualization
    if (showWind && currentWeather.wind.speed > 0) {
      const windMarkers = []
      const windSpeed = currentWeather.wind.speed
      const windDirection = currentWeather.wind.deg
      
      // Create multiple wind arrows across the region
      for (let lat = WEATHER_BOUNDS[0][0]; lat <= WEATHER_BOUNDS[1][0]; lat += 0.1) {
        for (let lng = WEATHER_BOUNDS[0][1]; lng <= WEATHER_BOUNDS[1][1]; lng += 0.15) {
          const windIcon = L.divIcon({
            html: `
              <div style="
                width: 30px;
                height: 30px;
                transform: rotate(${windDirection}deg);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 0;
                  height: 0;
                  border-left: 6px solid transparent;
                  border-right: 6px solid transparent;
                  border-bottom: ${Math.min(20, windSpeed * 3)}px solid rgba(255, 255, 255, 0.8);
                  filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
                "></div>
              </div>
            `,
            className: 'wind-arrow-advanced',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
          
          const windMarker = L.marker([lat, lng], { icon: windIcon })
          windMarker.bindPopup(`
            <div class="p-2">
              <h4 class="font-bold">Wind Information</h4>
              <div>Speed: ${(windSpeed * 3.6).toFixed(1)} km/h</div>
              <div>Direction: ${windDirection}°</div>
              ${currentWeather.wind.gust ? `<div>Gust: ${(currentWeather.wind.gust * 3.6).toFixed(1)} km/h</div>` : ''}
            </div>
          `)
          
          windMarkers.push(windMarker)
          windMarker.addTo(map)
        }
      }
      
      windLayersRef.current = windMarkers
    }

    // Fly to Rotterdam area when weather layer is activated for the first time
    if (selectedTimeIndex === 0) {
      map.flyTo(ROTTERDAM_COORDS, 11, { duration: 1.5 })
    }

  }, [visible, weatherData, selectedTimeIndex, showTemperature, showClouds, showRain, showWind, map])

  if (!visible || !weatherData) {
    return null
  }

  const currentWeather = weatherData.list[selectedTimeIndex]
  const tempCelsius = currentWeather.main.temp - 273.15

  return (
    <>
      {/* Weather Control Panel */}
      <div className="absolute bottom-20 left-4 z-[1001] bg-black/90 backdrop-blur-sm p-3 rounded-lg text-white shadow-lg max-w-xs">
        <h3 className="font-bold text-sm mb-2">🌤️ Weather Controls</h3>
        
        {/* Time Slider */}
        <div className="mb-3">
          <label className="block text-xs mb-1">Forecast Time:</label>
          <Slider
            value={[selectedTimeIndex]}
            onValueChange={(values) => setSelectedTimeIndex(values[0])}
            min={0}
            max={weatherData.list.length - 1}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-gray-300 mt-1">
            {new Date(currentWeather.dt * 1000).toLocaleString()}
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="space-y-2">
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showTemperature}
              onChange={(e) => setShowTemperature(e.target.checked)}
              className="mr-2 accent-blue-500"
            />
            Temperature Zones
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showClouds}
              onChange={(e) => setShowClouds(e.target.checked)}
              className="mr-2 accent-blue-500"
            />
            Cloud Coverage
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showRain}
              onChange={(e) => setShowRain(e.target.checked)}
              className="mr-2 accent-blue-500"
            />
            Precipitation
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showWind}
              onChange={(e) => setShowWind(e.target.checked)}
              className="mr-2 accent-blue-500"
            />
            Wind Patterns
          </label>
        </div>

        {/* Current Conditions Summary */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="text-xs space-y-1">
            <div className="font-medium">{currentWeather.weather[0].description}</div>
            <div>🌡️ {tempCelsius.toFixed(1)}°C</div>
            <div>💨 {(currentWeather.wind.speed * 3.6).toFixed(1)} km/h</div>
            <div>☁️ {currentWeather.clouds.all}%</div>
            {currentWeather.rain && <div>🌧️ {currentWeather.rain['3h']} mm</div>}
          </div>
        </div>
      </div>
    </>
  )
}