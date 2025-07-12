'use client'

import React, { useState, useCallback } from 'react'
import { GoogleMap, LoadScript, Marker, Polygon, InfoWindow } from '@react-google-maps/api'
import { wasteServiceZones, generateZoneMarkers, getPolygonCenter } from '../lib/zones-data'
import ZoneMapFallback from './ZoneMapFallback'

// Map styling and configuration
const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

// Center on Northern Virginia area
const center = {
  lat: 38.9,
  lng: -77.25
}

const mapOptions = {
  zoom: 11,
  mapTypeId: 'roadmap' as google.maps.MapTypeId,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
}

interface ZoneMarker {
  id: string
  position: { lat: number; lng: number }
  title: string
  zone: string
  description: string
  color: string
}

interface ZoneMapProps {
  googleMapsApiKey: string
}

export default function ZoneMap({ googleMapsApiKey }: ZoneMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<ZoneMarker | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  // Move hooks to the top before any conditional returns
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Show fallback if no API key is provided or it's a demo key
  if (!googleMapsApiKey || googleMapsApiKey === 'demo-key' || googleMapsApiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return <ZoneMapFallback />
  }

  const zoneMarkers = generateZoneMarkers()

  const handleMarkerClick = (marker: ZoneMarker) => {
    setSelectedMarker(marker)
  }

  const handleInfoWindowClose = () => {
    setSelectedMarker(null)
  }

  // Color variations for different zones
  const getZoneColor = (index: number) => {
    const colors = [
      '#0288d1', // Blue
      '#00acc1', // Cyan
      '#00897b', // Teal
      '#43a047', // Green
      '#7cb342', // Light Green
      '#fb8c00'  // Orange
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="zone-map-container">
      <LoadScript googleMapsApiKey={googleMapsApiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          options={mapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {/* Render zone polygons */}
          {typeof window !== 'undefined' && window.google && window.google.maps && wasteServiceZones.features.map((feature, index) => {
            const paths = feature.geometry.coordinates[0].map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }))

            return (
              <Polygon
                key={`polygon-${index}`}
                paths={paths}
                options={{
                  fillColor: getZoneColor(index),
                  fillOpacity: 0.3,
                  strokeColor: getZoneColor(index),
                  strokeOpacity: 1,
                  strokeWeight: 2,
                  clickable: false
                }}
              />
            )
          })}

          {/* Render zone markers */}
          {typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Size && zoneMarkers.map((marker, index) => {
            const icon = window.google?.maps?.Size ? {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="${getZoneColor(index)}" stroke="white" stroke-width="2"/>
                  <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">${index + 1}</text>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16)
            } : undefined

            return (
              <Marker
                key={marker.id}
                position={marker.position}
                title={marker.title}
                icon={icon}
                onClick={() => handleMarkerClick(marker)}
              />
            )
          })}

          {/* Info window for selected marker */}
          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={handleInfoWindowClose}
            >
              <div className="zone-info-window">
                <h3 className="zone-info-title">{selectedMarker.title}</h3>
                <p className="zone-info-type">Subscription Service</p>
                <div className="zone-info-stats">
                  <div className="zone-stat">
                    <span className="zone-stat-label">Status:</span>
                    <span className="zone-stat-value">Active</span>
                  </div>
                  <div className="zone-stat">
                    <span className="zone-stat-label">Type:</span>
                    <span className="zone-stat-value">Residential</span>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Zone legend */}
      <div className="zone-legend">
        <h4 className="zone-legend-title">Service Zones</h4>
        <div className="zone-legend-items">
          {zoneMarkers.map((marker, index) => (
            <div key={marker.id} className="zone-legend-item">
              <div 
                className="zone-legend-color" 
                style={{ backgroundColor: getZoneColor(index) }}
              ></div>
              <span className="zone-legend-label">{marker.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 