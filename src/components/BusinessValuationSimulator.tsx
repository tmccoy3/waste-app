'use client'

import { useState, useEffect } from 'react'

// Tooltip component for explaining complex metrics
const Tooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), 800) // 800ms delay
    setTimeoutId(id)
  }

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setIsVisible(false)
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 max-w-xs whitespace-normal">
          <div className="text-center">{content}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

interface CustomerData {
  monthlyRevenue: number
  [key: string]: any
}

interface BusinessValuationSimulatorProps {
  customerData: CustomerData[]
  parseRevenue?: (revenueStr: string | undefined) => number  // Made optional since we now have numbers
}

export default function BusinessValuationSimulator({ 
  customerData, 
  parseRevenue 
}: BusinessValuationSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'simulator'>('live')
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [valuationMethod, setValuationMethod] = useState<'irr' | 'revenue-multiple' | 'ebitda-multiple'>('revenue-multiple')
  
  // Simulator state
  const [adjustedRevenue, setAdjustedRevenue] = useState(0)
  const [customMargin, setCustomMargin] = useState(20)
  const [customIRR, setCustomIRR] = useState(25)
  const [revenueMultiple, setRevenueMultiple] = useState(4.5)
  const [ebitdaMultiple, setEbitdaMultiple] = useState(8)
  const [ebitdaMargin, setEbitdaMargin] = useState(25) // EBITDA margin typically higher than net margin

  // Calculate base metrics
  const monthlyRevenue = customerData.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0)
  const annualRevenue = monthlyRevenue * 12
  const estimatedNetIncome = annualRevenue * 0.20 // 20% default margin
  const estimatedEBITDA = annualRevenue * 0.25 // 25% default EBITDA margin
  const defaultIRR = 0.25 // 25% default IRR
  
  // Calculate valuations using different methods
  const irrValuation = estimatedNetIncome / defaultIRR
  const revenueMultipleValuation = annualRevenue * 4.5 // Industry standard 4-5x revenue
  const ebitdaMultipleValuation = estimatedEBITDA * 8 // Industry standard 6-10x EBITDA

  // Get primary valuation based on selected method
  const getPrimaryValuation = () => {
    switch (valuationMethod) {
      case 'irr':
        return irrValuation
      case 'revenue-multiple':
        return revenueMultipleValuation
      case 'ebitda-multiple':
        return ebitdaMultipleValuation
      default:
        return revenueMultipleValuation
    }
  }

  const estimatedValuation = getPrimaryValuation()

  // Initialize adjusted revenue to current revenue
  useEffect(() => {
    setAdjustedRevenue(annualRevenue)
  }, [annualRevenue])

  // Calculate simulator metrics based on method
  const getSimulatorValuation = () => {
    switch (valuationMethod) {
      case 'irr':
        const simulatorNetIncome = adjustedRevenue * (customMargin / 100)
        return simulatorNetIncome / (customIRR / 100)
      case 'revenue-multiple':
        return adjustedRevenue * revenueMultiple
      case 'ebitda-multiple':
        const simulatorEBITDA = adjustedRevenue * (ebitdaMargin / 100)
        return simulatorEBITDA * ebitdaMultiple
      default:
        return adjustedRevenue * revenueMultiple
    }
  }

  const simulatorValuation = getSimulatorValuation()
  const valuationDelta = simulatorValuation - estimatedValuation
  const valuationDeltaPercent = estimatedValuation > 0 ? (valuationDelta / estimatedValuation) * 100 : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`
  }

  const getMethodDescription = () => {
    switch (valuationMethod) {
      case 'irr':
        return 'Net Income ÷ Target IRR - Traditional DCF approach'
      case 'revenue-multiple':
        return 'Annual Revenue × Multiple - Common for growth companies'
      case 'ebitda-multiple':
        return 'EBITDA × Multiple - Standard for mature waste companies'
      default:
        return ''
    }
  }

  return (
    <div className="business-valuation-simulator">
      {/* Disclaimer Banner */}
      {showDisclaimer && (
        <div className="valuation-disclaimer">
          <div className="disclaimer-content">
            <div className="disclaimer-icon">⚠️</div>
            <div className="disclaimer-text">
              <strong>Industry Valuation Methods:</strong> Waste management companies are typically valued using 4-5x revenue multiples or 6-10x EBITDA multiples. 
              This simulator uses industry benchmarks from recent M&A transactions in the waste sector.
            </div>
            <button 
              className="disclaimer-close"
              onClick={() => setShowDisclaimer(false)}
              aria-label="Dismiss disclaimer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="valuation-tabs">
        <button 
          className={`tab-button ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          Live Valuation
        </button>
        <button 
          className={`tab-button ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          What-If Simulator
        </button>
      </div>

      {/* Live Valuation Tab */}
      {activeTab === 'live' && (
        <div className="live-valuation-tab">
          {/* Valuation Method Selector */}
          <div className="method-selector">
            <h3>Valuation Method</h3>
            <div className="method-options">
              <Tooltip content="Values the business based on annual revenue. Best for growth-oriented companies or when comparing to similar businesses. Revenue multiples are simple and widely used in M&A.">
                <button 
                  className={`method-option ${valuationMethod === 'revenue-multiple' ? 'active' : ''}`}
                  onClick={() => setValuationMethod('revenue-multiple')}
                >
                  <div className="method-title">Revenue Multiple</div>
                  <div className="method-subtitle">4.5x Revenue</div>
                  <div className="method-value">{formatCurrency(revenueMultipleValuation)}</div>
                </button>
              </Tooltip>
              <Tooltip content="Values based on cash flow (EBITDA). Most accurate for mature companies with stable operations. Preferred by financial buyers and lenders as it reflects actual cash generation ability.">
                <button 
                  className={`method-option ${valuationMethod === 'ebitda-multiple' ? 'active' : ''}`}
                  onClick={() => setValuationMethod('ebitda-multiple')}
                >
                  <div className="method-title">EBITDA Multiple</div>
                  <div className="method-subtitle">8x EBITDA</div>
                  <div className="method-value">{formatCurrency(ebitdaMultipleValuation)}</div>
                </button>
              </Tooltip>
              <Tooltip content="Discounted Cash Flow approach using target return rate. Most conservative method, preferred by investors for long-term value assessment and financial planning.">
                <button 
                  className={`method-option ${valuationMethod === 'irr' ? 'active' : ''}`}
                  onClick={() => setValuationMethod('irr')}
                >
                  <div className="method-title">IRR Method</div>
                  <div className="method-subtitle">25% Target IRR</div>
                  <div className="method-value">{formatCurrency(irrValuation)}</div>
                </button>
              </Tooltip>
            </div>
            <div className="method-description">
              {getMethodDescription()}
            </div>
          </div>

          <div className="valuation-header">
            <h2>Current Estimated Business Valuation</h2>
            <Tooltip content={`This valuation is calculated using the ${valuationMethod.replace('-', ' ')} method. It represents what a buyer might reasonably pay for your waste management business based on current industry standards and financial performance.`}>
              <div className="valuation-amount">
                {formatCurrency(estimatedValuation)}
              </div>
            </Tooltip>
            <Tooltip content="The valuation range shows the minimum and maximum estimates across all three valuation methods. This gives you a realistic bracket for potential business value in different scenarios.">
              <div className="valuation-range">
                <span>Range: {formatCurrency(Math.min(irrValuation, revenueMultipleValuation, ebitdaMultipleValuation))} - {formatCurrency(Math.max(irrValuation, revenueMultipleValuation, ebitdaMultipleValuation))}</span>
              </div>
            </Tooltip>
          </div>

          <div className="valuation-metrics-grid">
            <Tooltip content="Total monthly revenue from all active customers based on current service contracts. This includes both HOA communities and individual subscriptions.">
              <div className="metric-card">
                <div className="metric-label">Monthly Revenue</div>
                <div className="metric-value">{formatCurrency(monthlyRevenue)}</div>
                <div className="metric-tooltip">
                  Current total monthly revenue from all customers
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Projected annual revenue assuming current monthly revenue stays consistent throughout the year. Calculated as Monthly Revenue × 12 months.">
              <div className="metric-card">
                <div className="metric-label">Annualized Revenue</div>
                <div className="metric-value">{formatCurrency(annualRevenue)}</div>
                <div className="metric-tooltip">
                  Monthly revenue × 12 months
                </div>
              </div>
            </Tooltip>

            {valuationMethod === 'irr' && (
              <>
                <Tooltip content="Estimated net profit after all operating expenses, taxes, and costs. Uses industry-standard 20% profit margin for waste management companies. This is conservative - well-run operations can achieve 25-30%.">
                  <div className="metric-card">
                    <div className="metric-label">Estimated Net Income</div>
                    <div className="metric-value">{formatCurrency(estimatedNetIncome)}</div>
                    <div className="metric-tooltip">
                      Annual revenue × 20% (industry standard margin)
                    </div>
                  </div>
                </Tooltip>

                <Tooltip content="Internal Rate of Return - the annual return rate investors typically require for waste management investments. 25% reflects the operational complexity and growth potential of the industry.">
                  <div className="metric-card">
                    <div className="metric-label">Target IRR</div>
                    <div className="metric-value">{formatPercent(defaultIRR * 100)}</div>
                    <div className="metric-tooltip">
                      Internal Rate of Return - industry standard for waste management
                    </div>
                  </div>
                </Tooltip>
              </>
            )}

            {valuationMethod === 'revenue-multiple' && (
              <Tooltip content="Revenue multiples are used to value companies based on their sales. For waste management companies, 4-5x revenue is typical. Higher multiples (5-6x) are for growth companies, lower (3-4x) for mature operations.">
                <div className="metric-card">
                  <div className="metric-label">Revenue Multiple</div>
                  <div className="metric-value">4.5x</div>
                  <div className="metric-tooltip">
                    Industry standard: 4-5x revenue for waste companies
                  </div>
                </div>
              </Tooltip>
            )}

            {valuationMethod === 'ebitda-multiple' && (
              <>
                <Tooltip content="EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) represents cash flow from operations. 25% margin is typical for waste companies - this excludes equipment depreciation and financing costs.">
                  <div className="metric-card">
                    <div className="metric-label">Estimated EBITDA</div>
                    <div className="metric-value">{formatCurrency(estimatedEBITDA)}</div>
                    <div className="metric-tooltip">
                      Annual revenue × 25% (typical EBITDA margin)
                    </div>
                  </div>
                </Tooltip>

                <Tooltip content="EBITDA multiples reflect how many times annual cash flow buyers will pay. 6-8x is typical for stable waste companies, 8-10x for high-growth operations. This accounts for recurring revenue and asset intensity.">
                  <div className="metric-card">
                    <div className="metric-label">EBITDA Multiple</div>
                    <div className="metric-value">8.0x</div>
                    <div className="metric-tooltip">
                      Industry standard: 6-10x EBITDA for waste companies
                    </div>
                  </div>
                </Tooltip>
              </>
            )}
          </div>

          {/* Comparison Table */}
          <div className="valuation-comparison">
            <h3>Valuation Method Comparison</h3>
            <div className="comparison-table">
              <div className="comparison-row header">
                <div>Method</div>
                <div>Calculation</div>
                <div>Valuation</div>
                <div>Use Case</div>
              </div>
              <div className="comparison-row">
                <div data-label="Method">Revenue Multiple</div>
                <div data-label="Calculation">{formatCurrency(annualRevenue)} × 4.5x</div>
                <div className="valuation-cell" data-label="Valuation">{formatCurrency(revenueMultipleValuation)}</div>
                <div data-label="Use Case">Growth companies, SaaS-like models</div>
              </div>
              <div className="comparison-row">
                <div data-label="Method">EBITDA Multiple</div>
                <div data-label="Calculation">{formatCurrency(estimatedEBITDA)} × 8.0x</div>
                <div className="valuation-cell" data-label="Valuation">{formatCurrency(ebitdaMultipleValuation)}</div>
                <div data-label="Use Case">Mature waste companies, stable cash flow</div>
              </div>
              <div className="comparison-row">
                <div data-label="Method">IRR Method</div>
                <div data-label="Calculation">{formatCurrency(estimatedNetIncome)} ÷ 25%</div>
                <div className="valuation-cell" data-label="Valuation">{formatCurrency(irrValuation)}</div>
                <div data-label="Use Case">Investment analysis, DCF approach</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Tab */}
      {activeTab === 'simulator' && (
        <div className="simulator-tab">
          <div className="simulator-header">
            <h2>Scenario Planning Tool</h2>
            <p>Adjust inputs to see how changes affect business valuation using {valuationMethod.replace('-', ' ')} method</p>
          </div>

          <div className="simulator-content">
            <div className="simulator-inputs">
              <div className="input-group">
                <label htmlFor="valuation-method">Valuation Method</label>
                <select
                  id="valuation-method"
                  value={valuationMethod}
                  onChange={(e) => setValuationMethod(e.target.value as any)}
                  className="method-select"
                >
                  <option value="revenue-multiple">Revenue Multiple (4-5x)</option>
                  <option value="ebitda-multiple">EBITDA Multiple (6-10x)</option>
                  <option value="irr">IRR Method (DCF)</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="adjusted-revenue">Adjusted Annual Revenue</label>
                <div className="input-with-slider">
                  <input
                    id="adjusted-revenue"
                    type="number"
                    value={Math.round(adjustedRevenue)}
                    onChange={(e) => setAdjustedRevenue(Number(e.target.value))}
                    className="revenue-input"
                  />
                  <input
                    type="range"
                    min={annualRevenue * 0.5}
                    max={annualRevenue * 3}
                    step={10000}
                    value={adjustedRevenue}
                    onChange={(e) => setAdjustedRevenue(Number(e.target.value))}
                    className="revenue-slider"
                  />
                </div>
              </div>

              {valuationMethod === 'revenue-multiple' && (
                <div className="input-group">
                  <label htmlFor="revenue-multiple">Revenue Multiple</label>
                  <div className="input-with-slider">
                    <input
                      id="revenue-multiple"
                      type="number"
                      value={revenueMultiple}
                      onChange={(e) => setRevenueMultiple(Number(e.target.value))}
                      min="2"
                      max="8"
                      step="0.1"
                      className="multiple-input"
                    />
                    <input
                      type="range"
                      min="3"
                      max="6"
                      step="0.1"
                      value={revenueMultiple}
                      onChange={(e) => setRevenueMultiple(Number(e.target.value))}
                      className="multiple-slider"
                    />
                    <div className="slider-labels">
                      <span>3x</span>
                      <span>4.5x (Industry Avg)</span>
                      <span>6x</span>
                    </div>
                  </div>
                </div>
              )}

              {valuationMethod === 'ebitda-multiple' && (
                <>
                  <div className="input-group">
                    <label htmlFor="ebitda-margin">EBITDA Margin (%)</label>
                    <div className="input-with-slider">
                      <input
                        id="ebitda-margin"
                        type="number"
                        value={ebitdaMargin}
                        onChange={(e) => setEbitdaMargin(Number(e.target.value))}
                        min="10"
                        max="40"
                        className="margin-input"
                      />
                      <input
                        type="range"
                        min="15"
                        max="35"
                        step="1"
                        value={ebitdaMargin}
                        onChange={(e) => setEbitdaMargin(Number(e.target.value))}
                        className="margin-slider"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="ebitda-multiple">EBITDA Multiple</label>
                    <div className="input-with-slider">
                      <input
                        id="ebitda-multiple"
                        type="number"
                        value={ebitdaMultiple}
                        onChange={(e) => setEbitdaMultiple(Number(e.target.value))}
                        min="4"
                        max="12"
                        step="0.1"
                        className="multiple-input"
                      />
                      <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.1"
                        value={ebitdaMultiple}
                        onChange={(e) => setEbitdaMultiple(Number(e.target.value))}
                        className="multiple-slider"
                      />
                      <div className="slider-labels">
                        <span>6x</span>
                        <span>8x (Industry Avg)</span>
                        <span>10x</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {valuationMethod === 'irr' && (
                <>
                  <div className="input-group">
                    <label htmlFor="custom-margin">Profit Margin (%)</label>
                    <div className="input-with-slider">
                      <input
                        id="custom-margin"
                        type="number"
                        value={customMargin}
                        onChange={(e) => setCustomMargin(Number(e.target.value))}
                        min="0"
                        max="50"
                        className="margin-input"
                      />
                      <input
                        type="range"
                        min="5"
                        max="40"
                        step="1"
                        value={customMargin}
                        onChange={(e) => setCustomMargin(Number(e.target.value))}
                        className="margin-slider"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="custom-irr">Target IRR (%)</label>
                    <div className="input-with-slider">
                      <input
                        id="custom-irr"
                        type="number"
                        value={customIRR}
                        onChange={(e) => setCustomIRR(Number(e.target.value))}
                        min="10"
                        max="50"
                        className="irr-input"
                      />
                      <input
                        type="range"
                        min="15"
                        max="35"
                        step="1"
                        value={customIRR}
                        onChange={(e) => setCustomIRR(Number(e.target.value))}
                        className="irr-slider"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="simulator-results">
              <div className="results-header">
                <h3>Scenario Results</h3>
                <div className="method-badge">{valuationMethod.replace('-', ' ').toUpperCase()}</div>
              </div>

              <div className="results-grid">
                {valuationMethod === 'revenue-multiple' && (
                  <div className="result-card">
                    <div className="result-label">Revenue × Multiple</div>
                    <div className="result-value">{formatCurrency(adjustedRevenue)} × {revenueMultiple}x</div>
                  </div>
                )}

                {valuationMethod === 'ebitda-multiple' && (
                  <>
                    <div className="result-card">
                      <div className="result-label">Adjusted EBITDA</div>
                      <div className="result-value">{formatCurrency(adjustedRevenue * (ebitdaMargin / 100))}</div>
                    </div>
                    <div className="result-card">
                      <div className="result-label">EBITDA × Multiple</div>
                      <div className="result-value">{formatCurrency(adjustedRevenue * (ebitdaMargin / 100))} × {ebitdaMultiple}x</div>
                    </div>
                  </>
                )}

                {valuationMethod === 'irr' && (
                  <div className="result-card">
                    <div className="result-label">Net Income ÷ IRR</div>
                    <div className="result-value">{formatCurrency(adjustedRevenue * (customMargin / 100))} ÷ {customIRR}%</div>
                  </div>
                )}

                <div className="result-card">
                  <div className="result-label">Updated Valuation</div>
                  <div className="result-value">{formatCurrency(simulatorValuation)}</div>
                </div>

                <div className="result-card">
                  <div className="result-label">Value Change</div>
                  <div className={`result-value ${valuationDelta >= 0 ? 'positive' : 'negative'}`}>
                    {valuationDelta >= 0 ? '+' : ''}{formatCurrency(valuationDelta)}
                    <span className="delta-percent">
                      ({valuationDelta >= 0 ? '+' : ''}{formatPercent(valuationDeltaPercent)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Bar Chart */}
              <div className="value-comparison-chart">
                <div className="chart-header">
                  <span>Current Valuation</span>
                  <span>Scenario Valuation</span>
                </div>
                <div className="chart-bars">
                  <div className="bar-container">
                    <div 
                      className="bar current-bar"
                      style={{ 
                        height: '100%',
                        backgroundColor: '#3b82f6' 
                      }}
                    >
                      <span className="bar-label">{formatCurrency(estimatedValuation)}</span>
                    </div>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="bar scenario-bar"
                      style={{ 
                        height: `${Math.max(20, Math.min(100, (simulatorValuation / Math.max(estimatedValuation, simulatorValuation)) * 100))}%`,
                        backgroundColor: valuationDelta >= 0 ? '#10b981' : '#ef4444'
                      }}
                    >
                      <span className="bar-label">{formatCurrency(simulatorValuation)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .business-valuation-simulator {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .valuation-disclaimer {
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          border-bottom: 1px solid #f59e0b;
          padding: 1rem;
        }

        .disclaimer-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .disclaimer-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .disclaimer-text {
          flex: 1;
          color: #92400e;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .disclaimer-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #92400e;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .disclaimer-close:hover {
          background-color: rgba(146, 64, 14, 0.1);
        }

        .valuation-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-button {
          flex: 1;
          padding: 1rem 2rem;
          border: none;
          background: none;
          font-size: 1rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }

        .tab-button:hover {
          color: #374151;
          background-color: #f9fafb;
        }

        .tab-button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background-color: #eff6ff;
        }

        .live-valuation-tab,
        .simulator-tab {
          padding: 2rem;
        }

        .method-selector {
          margin-bottom: 3rem;
          padding: 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .method-selector h3 {
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 2rem;
          letter-spacing: -0.025em;
        }

        .method-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
          width: 100%;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .method-option {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 2.5rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          aspect-ratio: 3 / 1;
        }

        .method-option:hover {
          border-color: #3b82f6;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .method-option.active {
          border-color: #6b7280;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          box-shadow: 0 8px 24px rgba(107, 114, 128, 0.25);
          transform: translateY(-2px);
        }

        .method-option.active::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #6b7280, #4b5563);
          border-radius: 14px;
          z-index: -1;
          opacity: 0.1;
        }

        .method-title {
          font-weight: 700;
          font-size: 1.125rem;
          color: #1f2937;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .method-subtitle {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .method-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #059669;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          margin-top: auto;
        }

        .method-description {
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
          font-style: italic;
        }

        .valuation-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .valuation-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .valuation-amount {
          font-size: 3rem;
          font-weight: 700;
          color: #059669;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .valuation-range {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .valuation-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
          position: relative;
          transition: transform 0.2s;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .metric-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .metric-tooltip {
          position: absolute;
          bottom: -2.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: #374151;
          color: white;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          z-index: 10;
        }

        .metric-card:hover .metric-tooltip {
          opacity: 1;
        }

        .valuation-comparison {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .valuation-comparison h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .comparison-table {
          display: grid;
          grid-template-columns: 140px 220px 140px 1fr;
          gap: 0;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          width: 100%;
          max-width: 800px;
        }

        .comparison-row {
          display: contents;
        }

        .comparison-row.header {
          font-weight: 600;
          color: #374151;
          background: #f9fafb;
        }

        .comparison-row.header > div {
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }

        .comparison-row > div {
          padding: 0.875rem 0.75rem;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.875rem;
          line-height: 1.4;
          vertical-align: middle;
          display: flex;
          align-items: center;
        }

        .comparison-row > div:last-child {
          border-right: none;
        }

        .comparison-row:last-child > div {
          border-bottom: none;
        }

        .valuation-cell {
          font-weight: 700;
          color: #059669;
          font-size: 1rem;
          text-align: center;
          justify-content: center;
        }

        .simulator-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .simulator-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .simulator-header p {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .simulator-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }

        @media (max-width: 768px) {
          .simulator-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .method-options {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            max-width: 100%;
          }
          
          .method-option {
            height: 120px;
            padding: 2rem 1.5rem;
            aspect-ratio: 4 / 1;
          }
          
          .method-selector {
            padding: 1.5rem;
            margin-bottom: 2rem;
          }
          
          .method-selector h3 {
            font-size: 1.25rem;
            margin-bottom: 1.5rem;
          }
          
          .comparison-table {
            grid-template-columns: 1fr;
            gap: 1rem;
            border: none;
            background: transparent;
          }
          
          .comparison-row {
            display: block;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 0.5rem;
          }
          
          .comparison-row.header {
            display: none;
          }
          
          .comparison-row > div {
            border: none;
            padding: 0.25rem 0;
            display: block;
          }
          
          .comparison-row > div:before {
            content: attr(data-label) ': ';
            font-weight: 600;
            color: #374151;
          }
        }

        .simulator-inputs {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-weight: 500;
          color: #374151;
          font-size: 0.9rem;
        }

        .input-with-slider {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .revenue-input,
        .margin-input,
        .irr-input,
        .multiple-input,
        .method-select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
        }

        .revenue-input:focus,
        .margin-input:focus,
        .irr-input:focus,
        .multiple-input:focus,
        .method-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .revenue-slider,
        .margin-slider,
        .irr-slider,
        .multiple-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
        }

        .revenue-slider::-webkit-slider-thumb,
        .margin-slider::-webkit-slider-thumb,
        .irr-slider::-webkit-slider-thumb,
        .multiple-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .simulator-results {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .results-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .method-badge {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .results-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .result-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
          text-align: center;
        }

        .result-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .result-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .result-value.positive {
          color: #059669;
        }

        .result-value.negative {
          color: #dc2626;
        }

        .delta-percent {
          font-size: 0.875rem;
          margin-left: 0.5rem;
        }

        .value-comparison-chart {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
        }

        .chart-bars {
          display: flex;
          gap: 1rem;
          height: 200px;
          align-items: end;
        }

        .bar-container {
          flex: 1;
          height: 100%;
          position: relative;
          display: flex;
          align-items: end;
        }

        .bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          position: relative;
          display: flex;
          align-items: end;
          justify-content: center;
          padding-bottom: 0.5rem;
          transition: all 0.3s ease;
          min-height: 40px;
        }

        .bar-label {
          position: absolute;
          bottom: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  )
} 