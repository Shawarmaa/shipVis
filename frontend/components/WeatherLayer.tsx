'use client'

import { useEffect, useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Rotterdam coordinates from the marine data
const ROTTERDAM_COORDS: [number, number] = [51.9225, 4.4792]

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

// Create a custom weather icon
const createWeatherIcon = (iconCode: string, temp: number) => {
  return L.divIcon({
    html: `
      <div style="
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px;
        border-radius: 8px;
        text-align: center;
        font-family: sans-serif;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        min-width: 80px;
      ">
        <img src="https://openweathermap.org/img/w/${iconCode}.png" style="width: 32px; height: 32px;" />
        <div style="font-size: 14px; font-weight: bold;">${Math.round(temp - 273.15)}°C</div>
      </div>
    `,
    className: 'weather-marker',
    iconSize: [80, 60],
    iconAnchor: [40, 30]
  })
}

// Create wind direction arrow
const createWindArrow = (speed: number, direction: number) => {
  const windSpeedKmh = Math.round(speed * 3.6)
  return L.divIcon({
    html: `
      <div style="
        width: 40px;
        height: 40px;
        transform: rotate(${direction}deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 24px solid #3b82f6;
          transform: translateY(-4px);
        "></div>
        <div style="
          position: absolute;
          top: 28px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 10px;
          white-space: nowrap;
        ">${windSpeedKmh} km/h</div>
      </div>
    `,
    className: 'wind-arrow',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  })
}

interface WeatherLayerProps {
  visible: boolean
}

export default function WeatherLayer({ visible }: WeatherLayerProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const map = useMap()

  useEffect(() => {
    if (visible && !weatherData) {
      setLoading(true)
      // Load weather data from the public folder
      fetch('/weather_data.json')
        .then(response => response.json())
        .then((data: WeatherData) => {
          setWeatherData(data)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error loading weather data:', error)
          setLoading(false)
        })
    }
  }, [visible, weatherData])

  useEffect(() => {
    if (visible && weatherData && map) {
      // Fly to Rotterdam when weather layer is activated
      map.flyTo(ROTTERDAM_COORDS, 10, { duration: 1.5 })
    }
  }, [visible, weatherData, map])

  if (!visible || !weatherData) {
    return null
  }

  // Get current weather (first item in the list)
  const currentWeather = weatherData.list[0]

  return (
    <>
      {/* Main weather marker */}
      <Marker
        position={ROTTERDAM_COORDS}
        icon={createWeatherIcon(currentWeather.weather[0].icon, currentWeather.main.temp)}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-lg">{weatherData.city.name} Weather</h3>
            <div className="mt-2 space-y-1">
              <div><strong>Condition:</strong> {currentWeather.weather[0].description}</div>
              <div><strong>Temperature:</strong> {Math.round(currentWeather.main.temp - 273.15)}°C</div>
              <div><strong>Feels like:</strong> {Math.round(currentWeather.main.feels_like - 273.15)}°C</div>
              <div><strong>Humidity:</strong> {currentWeather.main.humidity}%</div>
              <div><strong>Pressure:</strong> {currentWeather.main.pressure} hPa</div>
              <div><strong>Wind:</strong> {Math.round(currentWeather.wind.speed * 3.6)} km/h</div>
              <div><strong>Visibility:</strong> {currentWeather.visibility / 1000} km</div>
              {currentWeather.rain && (
                <div><strong>Rain (3h):</strong> {currentWeather.rain['3h']} mm</div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Updated: {new Date(currentWeather.dt * 1000).toLocaleString()}
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Wind direction arrow */}
      <Marker
        position={[ROTTERDAM_COORDS[0] + 0.02, ROTTERDAM_COORDS[1] + 0.02]}
        icon={createWindArrow(currentWeather.wind.speed, currentWeather.wind.deg)}
      >
        <Popup>
          <div className="p-2">
            <h4 className="font-bold">Wind Information</h4>
            <div className="mt-1 space-y-1">
              <div><strong>Speed:</strong> {Math.round(currentWeather.wind.speed * 3.6)} km/h</div>
              <div><strong>Direction:</strong> {currentWeather.wind.deg}°</div>
              {currentWeather.wind.gust && (
                <div><strong>Gust:</strong> {Math.round(currentWeather.wind.gust * 3.6)} km/h</div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  )
}