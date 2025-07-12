// Waste Service Zones GeoJSON Data
export interface ZoneFeature {
  type: 'Feature'
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  properties: {
    name: string
    description: string
    stroke: string
    'stroke-opacity': number
    'stroke-width': number
    fill: string
    'fill-opacity': number
  }
}

export interface ZonesGeoJSON {
  type: 'FeatureCollection'
  features: ZoneFeature[]
}

export const wasteServiceZones: ZonesGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -77.2392687,
              38.896546,
              0
            ],
            [
              -77.2488818,
              38.8820488,
              0
            ],
            [
              -77.2277674,
              38.8764362,
              0
            ],
            [
              -77.2169528,
              38.8899992,
              0
            ],
            [
              -77.2392687,
              38.896546,
              0
            ]
          ]
        ]
      },
      "properties": {
        "name": "Subscription (Dunn Loring)",
        "description": "Full Address: <br>Type: <br>Service Status: ",
        "stroke": "#0288d1",
        "stroke-opacity": 1,
        "stroke-width": 1.2,
        "fill": "#0288d1",
        "fill-opacity": 0.2980392156862745
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -77.3910159,
              38.9504015,
              0
            ],
            [
              -77.3929041,
              38.9448277,
              0
            ],
            [
              -77.3847502,
              38.940355,
              0
            ],
            [
              -77.3810595,
              38.9432923,
              0
            ],
            [
              -77.3792564,
              38.9453617,
              0
            ],
            [
              -77.3771972,
              38.9485993,
              0
            ],
            [
              -77.3825615,
              38.9507021,
              0
            ],
            [
              -77.3910159,
              38.9504015,
              0
            ]
          ]
        ]
      },
      "properties": {
        "name": "Subscription (Polo Fields)",
        "description": "Full Address: <br>Type: <br>Service Status: ",
        "stroke": "#0288d1",
        "stroke-opacity": 1,
        "stroke-width": 1.2,
        "fill": "#0288d1",
        "fill-opacity": 0.2980392156862745
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -77.1165318,
              38.7686266,
              0
            ],
            [
              -77.1132703,
              38.7607295,
              0
            ],
            [
              -77.1089358,
              38.7618003,
              0
            ],
            [
              -77.1119828,
              38.7689277,
              0
            ],
            [
              -77.112369,
              38.7696638,
              0
            ],
            [
              -77.1165318,
              38.7686266,
              0
            ]
          ]
        ]
      },
      "properties": {
        "name": "Subscription (Deer Run Drive)",
        "description": "Full Address: <br>Type: <br>Service Status: ",
        "stroke": "#0288d1",
        "stroke-opacity": 1,
        "stroke-width": 1.2,
        "fill": "#0288d1",
        "fill-opacity": 0.2980392156862745
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -77.4040422,
              38.9325471,
              0
            ],
            [
              -77.3806533,
              38.9101434,
              0
            ],
            [
              -77.3616848,
              38.9432623,
              0
            ],
            [
              -77.3841295,
              38.9399912,
              0
            ],
            [
              -77.4040422,
              38.9325471,
              0
            ]
          ]
        ]
      },
      "properties": {
        "name": "Subscription (Fox Mill)",
        "description": "Full Address: <br>Type: <br>Service Status: ",
        "stroke": "#0288d1",
        "stroke-opacity": 1,
        "stroke-width": 1.2,
        "fill": "#0288d1",
        "fill-opacity": 0.2980392156862745
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -77.1966592,
              38.9231122,
              0
            ],
            [
              -77.2142545,
              38.909088,
              0
            ],
            [
              -77.1968308,
              38.900071,
              0
            ],
            [
              -77.1865311,
              38.9106241,
              0
            ],
            [
              -77.1966592,
              38.9231122,
              0
            ]
          ]
        ]
      },
      "properties": {
        "name": "Subscription (Pimmit Hills)",
        "description": "Full Address: <br>Type: <br>Service Status: ",
        "stroke": "#0288d1",
        "stroke-opacity": 1,
        "stroke-width": 1.2,
        "fill": "#0288d1",
        "fill-opacity": 0.2980392156862745
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -77.2958915,
              38.8217393,
              0
            ],
            [
              -77.3101394,
              38.809434,
              0
            ],
            [
              -77.2917716,
              38.7995348,
              0
            ],
            [
              -77.2735755,
              38.8171919,
              0
            ],
            [
              -77.290055,
              38.8270887,
              0
            ],
            [
              -77.2958915,
              38.8217393,
              0
            ]
          ]
        ]
      },
      "properties": {
        "name": "Subscription (Kings Park West)",
        "description": "Full Address: <br>Type: <br>Service Status: ",
        "stroke": "#0288d1",
        "stroke-opacity": 1,
        "stroke-width": 1.2,
        "fill": "#0288d1",
        "fill-opacity": 0.2980392156862745
      }
    }
  ]
}

// Helper function to calculate polygon centroid for marker placement
export function getPolygonCenter(coordinates: number[][][]): { lat: number; lng: number } {
  const polygon = coordinates[0] // Get the outer ring
  let latSum = 0
  let lngSum = 0
  let pointCount = polygon.length - 1 // Exclude the last point (same as first)
  
  for (let i = 0; i < pointCount; i++) {
    lngSum += polygon[i][0]
    latSum += polygon[i][1]
  }
  
  return {
    lat: latSum / pointCount,
    lng: lngSum / pointCount
  }
}

// Generate zone markers from GeoJSON data
export function generateZoneMarkers() {
  return wasteServiceZones.features.map((feature, index) => {
    const center = getPolygonCenter(feature.geometry.coordinates)
    const zoneName = feature.properties.name.replace('Subscription (', '').replace(')', '')
    
    return {
      id: `zone-${index}`,
      position: center,
      title: zoneName,
      zone: feature.properties.name,
      description: feature.properties.description,
      color: feature.properties.fill
    }
  })
} 