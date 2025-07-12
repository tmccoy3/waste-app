'use client'

import React from 'react'
import { wasteServiceZones, generateZoneMarkers } from '../lib/zones-data'

// Fallback component when Google Maps API key is not available
export default function ZoneMapFallback() {
  const zoneMarkers = generateZoneMarkers()

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
      {/* Map Placeholder */}
      <div className="map-placeholder">
        <div className="map-placeholder-content">
          <div className="map-placeholder-icon">🗺️</div>
          <h3 className="map-placeholder-title">Service Zone Map</h3>
          <p className="map-placeholder-description">
            Interactive map view requires Google Maps API key configuration.
            <br />
            Please add your API key to display the full map experience.
          </p>
          <div className="map-placeholder-zones">
            <h4>Active Service Zones:</h4>
            <div className="zone-grid">
              {zoneMarkers.map((marker, index) => (
                <div key={marker.id} className="zone-card">
                  <div 
                    className="zone-card-color" 
                    style={{ backgroundColor: getZoneColor(index) }}
                  ></div>
                  <div className="zone-card-content">
                    <h5 className="zone-card-title">{marker.title}</h5>
                    <p className="zone-card-type">Subscription Service</p>
                    <div className="zone-card-stats">
                      <span className="zone-card-stat">
                        <strong>Status:</strong> Active
                      </span>
                      <span className="zone-card-stat">
                        <strong>Type:</strong> Residential
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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