'use client'

import { useState, useEffect } from 'react'
import CustomerMap from './CustomerMap'

interface Customer {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  customer_type: 'HOA' | 'Subscription'
  unit_type: 'Townhome' | 'Condo' | 'Single Family'
  units: number
  monthly_revenue: number
  completion_time_minutes: number
  service_days: string[]
}

interface OperationsDashboardProps {
  customers: Customer[]
}

export default function OperationsDashboard({ customers }: OperationsDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [systemStatus, setSystemStatus] = useState({
    googleSheets: 'connected',
    timeero: 'connected', 
    freshbooks: 'warning'
  })

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Mock live route data
  const liveRoutes = [
    { driver: 'Mike Johnson', route: 'North Route', status: 'In Progress', completed: 12, total: 18, eta: '2:30 PM' },
    { driver: 'Sarah Chen', route: 'South Route', status: 'Completed', completed: 15, total: 15, eta: 'Complete' },
    { driver: 'David Rodriguez', route: 'West Route', status: 'Starting', completed: 2, total: 22, eta: '4:15 PM' },
    { driver: 'Lisa Park', route: 'Central Route', status: 'In Progress', completed: 8, total: 14, eta: '3:45 PM' }
  ]

  // Calculate performance metrics
  const totalRevenue = customers.reduce((sum, c) => sum + c.monthly_revenue, 0)
  const avgEfficiency = customers.length > 0 ? 
    customers.reduce((sum, c) => sum + (c.monthly_revenue / c.completion_time_minutes), 0) / customers.length : 0

  // Mock recent payments
  const recentPayments = [
    { customer: 'Stonewall Manor HOA', amount: 13188, date: '2024-01-15', status: 'Processed' },
    { customer: 'Reflections HOA', amount: 11250, date: '2024-01-14', status: 'Processed' },
    { customer: 'The Meadows HOA', amount: 10800, date: '2024-01-13', status: 'Processed' },
    { customer: 'Subscription Customer 45', amount: 25, date: '2024-01-12', status: 'Processed' },
    { customer: 'Subscription Customer 67', amount: 20, date: '2024-01-11', status: 'Processed' }
  ]

  // Revenue by community (HOA groups)
  const hoaCustomers = customers.filter(c => c.customer_type === 'HOA')
  const revenueByHOA = hoaCustomers.map(hoa => ({
    name: hoa.name,
    revenue: hoa.monthly_revenue,
    units: hoa.units
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#10b981'
      case 'In Progress': return '#3b82f6'
      case 'Starting': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  return (
    <div className="operations-dashboard">
      {/* Live Route Activity */}
      <div className="operations-section">
        <div className="section-header">
          <h2>🚛 Live Route Activity</h2>
          <div className="live-indicator">
            <div className="pulse-dot"></div>
            <span>Live • {currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="routes-grid">
          {liveRoutes.map((route, index) => (
            <div key={index} className="route-card">
              <div className="route-header">
                <h3>{route.driver}</h3>
                <span 
                  className="route-status"
                  style={{ backgroundColor: getRouteStatusColor(route.status) }}
                >
                  {route.status}
                </span>
              </div>
              <div className="route-details">
                <p className="route-name">{route.route}</p>
                <div className="progress-info">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(route.completed / route.total) * 100}%`,
                        backgroundColor: getRouteStatusColor(route.status)
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {route.completed}/{route.total} stops
                  </span>
                </div>
                <p className="eta">ETA: {route.eta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Sync Status */}
      <div className="operations-section">
        <div className="section-header">
          <h2>🔄 System Sync Status</h2>
          <div className="sync-time">Last sync: {currentTime.toLocaleTimeString()}</div>
        </div>
        
        <div className="sync-grid">
          <div className="sync-card">
            <div className="sync-header">
              <h3>📊 Google Sheets</h3>
              <div 
                className="sync-status"
                style={{ backgroundColor: getStatusColor(systemStatus.googleSheets) }}
              >
                {systemStatus.googleSheets}
              </div>
            </div>
            <p>Customer data synchronized</p>
            <button className="reconnect-btn">Reconnect</button>
          </div>
          
          <div className="sync-card">
            <div className="sync-header">
              <h3>⏰ Timeero</h3>
              <div 
                className="sync-status"
                style={{ backgroundColor: getStatusColor(systemStatus.timeero) }}
              >
                {systemStatus.timeero}
              </div>
            </div>
            <p>Time tracking active</p>
            <button className="reconnect-btn">Reconnect</button>
          </div>
          
          <div className="sync-card">
            <div className="sync-header">
              <h3>💰 FreshBooks</h3>
              <div 
                className="sync-status"
                style={{ backgroundColor: getStatusColor(systemStatus.freshbooks) }}
              >
                {systemStatus.freshbooks}
              </div>
            </div>
            <p>Payment sync delayed</p>
            <button className="reconnect-btn urgent">Reconnect</button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="operations-section">
        <div className="section-header">
          <h2>📈 Performance Overview</h2>
        </div>
        
        <div className="performance-grid">
          <div className="perf-card">
            <div className="perf-icon">🎯</div>
            <div className="perf-content">
              <h3>Route Efficiency</h3>
              <div className="perf-value">94.2%</div>
              <p>Above target (90%)</p>
            </div>
          </div>
          
          <div className="perf-card">
            <div className="perf-icon">👥</div>
            <div className="perf-content">
              <h3>Active Drivers</h3>
              <div className="perf-value">{liveRoutes.length}</div>
              <p>Currently on routes</p>
            </div>
          </div>
          
          <div className="perf-card">
            <div className="perf-icon">💵</div>
            <div className="perf-content">
              <h3>Weekly Revenue</h3>
              <div className="perf-value">${(totalRevenue * 0.25).toLocaleString()}</div>
              <p>This week projection</p>
            </div>
          </div>
          
          <div className="perf-card">
            <div className="perf-icon">⚡</div>
            <div className="perf-content">
              <h3>Avg Efficiency</h3>
              <div className="perf-value">${avgEfficiency.toFixed(0)}/min</div>
              <p>Revenue per minute</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="operations-section">
        <div className="section-header">
          <h2>💳 Recent Payments</h2>
          <span className="view-all">View All</span>
        </div>
        
        <div className="payments-list">
          {recentPayments.map((payment, index) => (
            <div key={index} className="payment-item">
              <div className="payment-info">
                <h4>{payment.customer}</h4>
                <p>{payment.date}</p>
              </div>
              <div className="payment-amount">
                <span className="amount">${payment.amount.toLocaleString()}</span>
                <span className="status">{payment.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Map & Service Zones */}
      <div className="operations-section">
        <div className="section-header">
          <h2>🗺️ Customer Map & Service Zones</h2>
          <span className="map-legend">Live customer locations with service zones</span>
        </div>
        
        <div className="map-container" style={{ height: '400px' }}>
          <CustomerMap 
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key'}
            customers={customers.map(c => ({
              id: c.id,
              name: c.name,
              address: c.address,
              type: c.customer_type,
              latitude: c.latitude,
              longitude: c.longitude,
              units: c.units,
              completionTime: c.completion_time_minutes,
              monthlyRevenue: c.monthly_revenue,
              trashDays: c.service_days[0] || '',
              recyclingDays: c.service_days[1] || '',
              yardWasteDays: c.service_days[2] || '',
              unitType: c.unit_type,
              serviceStatus: 'Active',
              truckCapacity: '25 yd',
              laborCosts: { driver: 24, helper: 20 },
              operationalCosts: {
                diesel: { gallons: 100, costPerGallon: 4.11 },
                workingHours: 10
              }
            }))}
          />
        </div>
      </div>

      {/* Revenue by Community */}
      <div className="operations-section">
        <div className="section-header">
          <h2>🏘️ Revenue by Community</h2>
        </div>
        
        <div className="revenue-chart">
          {revenueByHOA.map((hoa, index) => (
            <div key={index} className="revenue-bar-item">
              <div className="revenue-bar-info">
                <span className="hoa-name">{hoa.name}</span>
                <span className="hoa-units">{hoa.units} units</span>
              </div>
              <div className="revenue-bar-container">
                <div 
                  className="revenue-bar"
                  style={{ 
                    width: `${(hoa.revenue / Math.max(...revenueByHOA.map(h => h.revenue))) * 100}%` 
                  }}
                ></div>
                <span className="revenue-amount">${hoa.revenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .operations-dashboard {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          gap: 32px;
        }

        .operations-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f3f4f6;
        }

        .section-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
          font-weight: 500;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .routes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .route-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .route-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .route-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .route-status {
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 500;
        }

        .route-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .route-name {
          color: #6b7280;
          font-weight: 500;
          margin: 0;
        }

        .progress-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .eta {
          color: #374151;
          font-weight: 500;
          margin: 0;
        }

        .sync-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .sync-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .sync-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .sync-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .sync-status {
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .sync-card p {
          color: #6b7280;
          margin: 0 0 12px 0;
        }

        .reconnect-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .reconnect-btn:hover {
          background: #2563eb;
        }

        .reconnect-btn.urgent {
          background: #ef4444;
        }

        .reconnect-btn.urgent:hover {
          background: #dc2626;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .perf-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .perf-icon {
          font-size: 32px;
        }

        .perf-content h3 {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 4px 0;
          font-weight: 500;
        }

        .perf-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .perf-content p {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .sync-time {
          color: #6b7280;
          font-size: 14px;
        }

        .view-all {
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
        }

        .view-all:hover {
          color: #4b5563;
        }

        .payments-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .payment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .payment-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .payment-info p {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        .payment-amount {
          text-align: right;
        }

        .amount {
          font-size: 16px;
          font-weight: 700;
          color: #10b981;
          display: block;
        }

        .status {
          font-size: 12px;
          color: #6b7280;
        }

        .revenue-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .revenue-bar-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .revenue-bar-info {
          min-width: 200px;
          display: flex;
          flex-direction: column;
        }

        .hoa-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .hoa-units {
          font-size: 12px;
          color: #6b7280;
        }

        .revenue-bar-container {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .revenue-bar {
          height: 24px;
          background: linear-gradient(90deg, #6b7280, #4b5563);
          border-radius: 4px;
          min-width: 4px;
        }

        .revenue-amount {
          font-weight: 600;
          color: #1f2937;
          min-width: 80px;
          text-align: right;
        }

        .map-legend {
          color: #6b7280;
          font-size: 14px;
        }

        .map-container {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .operations-dashboard {
            padding: 16px;
            gap: 24px;
          }
          
          .operations-section {
            padding: 16px;
          }
          
          .routes-grid {
            grid-template-columns: 1fr;
          }
          
          .sync-grid {
            grid-template-columns: 1fr;
          }
          
          .performance-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .revenue-bar-item {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          .revenue-bar-info {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  )
} 