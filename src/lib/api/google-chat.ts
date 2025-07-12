// Google Chat API Integration
// Documentation: https://developers.google.com/chat/api

interface GoogleChatConfig {
  webhookUrl: string
  serviceAccountKey?: any
}

interface ChatMessage {
  text?: string
  cards?: ChatCard[]
  thread?: { name: string }
}

interface ChatCard {
  header?: {
    title: string
    subtitle?: string
    imageUrl?: string
  }
  sections: ChatSection[]
}

interface ChatSection {
  widgets: ChatWidget[]
}

interface ChatWidget {
  textParagraph?: { text: string }
  keyValue?: {
    topLabel: string
    content: string
    contentMultiline?: boolean
    icon?: string
  }
  buttons?: ChatButton[]
}

interface ChatButton {
  textButton: {
    text: string
    onClick: {
      openLink?: { url: string }
      action?: { actionMethodName: string }
    }
  }
}

interface AlertConfig {
  jobBooked: boolean
  paymentReceived: boolean
  driverMissing: boolean
  routeInefficient: boolean
  overdueInvoices: boolean
}

class GoogleChatAPI {
  private config: GoogleChatConfig
  private alertConfig: AlertConfig

  constructor(config: GoogleChatConfig) {
    this.config = config
    this.alertConfig = {
      jobBooked: true,
      paymentReceived: true,
      driverMissing: true,
      routeInefficient: true,
      overdueInvoices: true
    }
  }

  // Send a simple text message
  async sendMessage(text: string, threadName?: string): Promise<void> {
    const message: ChatMessage = {
      text,
      thread: threadName ? { name: threadName } : undefined
    }

    await this.makeRequest(message)
  }

  // Send a rich card message
  async sendCard(card: ChatCard, threadName?: string): Promise<void> {
    const message: ChatMessage = {
      cards: [card],
      thread: threadName ? { name: threadName } : undefined
    }

    await this.makeRequest(message)
  }

  // Alert when a new job is booked
  async alertJobBooked(jobData: {
    customerName: string
    serviceType: string
    amount: number
    scheduledDate: string
    address: string
  }): Promise<void> {
    if (!this.alertConfig.jobBooked) return

    const card: ChatCard = {
      header: {
        title: "🆕 New Job Booked",
        subtitle: `${jobData.customerName} - ${jobData.serviceType}`,
        imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
      },
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: "Customer",
              content: jobData.customerName,
              icon: "PERSON"
            }
          },
          {
            keyValue: {
              topLabel: "Service Type",
              content: jobData.serviceType
            }
          },
          {
            keyValue: {
              topLabel: "Amount",
              content: `$${jobData.amount.toFixed(2)}`,
              icon: "DOLLAR"
            }
          },
          {
            keyValue: {
              topLabel: "Scheduled Date",
              content: jobData.scheduledDate,
              icon: "CLOCK"
            }
          },
          {
            keyValue: {
              topLabel: "Address",
              content: jobData.address,
              contentMultiline: true,
              icon: "MAP_PIN"
            }
          },
          {
            buttons: [{
              textButton: {
                text: "View Dashboard",
                onClick: {
                  openLink: { url: "http://localhost:3000/dashboard" }
                }
              }
            }]
          }
        ]
      }]
    }

    await this.sendCard(card)
  }

  // Alert when a payment is received
  async alertPaymentReceived(paymentData: {
    customerName: string
    amount: number
    invoiceId: string
    method: string
    date: string
  }): Promise<void> {
    if (!this.alertConfig.paymentReceived) return

    const card: ChatCard = {
      header: {
        title: "💰 Payment Received",
        subtitle: `${paymentData.customerName} - $${paymentData.amount.toFixed(2)}`,
        imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
      },
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: "Customer",
              content: paymentData.customerName,
              icon: "PERSON"
            }
          },
          {
            keyValue: {
              topLabel: "Amount",
              content: `$${paymentData.amount.toFixed(2)}`,
              icon: "DOLLAR"
            }
          },
          {
            keyValue: {
              topLabel: "Payment Method",
              content: paymentData.method
            }
          },
          {
            keyValue: {
              topLabel: "Invoice ID",
              content: paymentData.invoiceId
            }
          },
          {
            keyValue: {
              topLabel: "Date",
              content: paymentData.date,
              icon: "CLOCK"
            }
          }
        ]
      }]
    }

    await this.sendCard(card)
  }

  // Alert when a driver misses scheduled clock-in
  async alertDriverMissing(driverData: {
    name: string
    expectedClockIn: string
    route: string
    contactInfo: string
  }): Promise<void> {
    if (!this.alertConfig.driverMissing) return

    const card: ChatCard = {
      header: {
        title: "⚠️ Driver Missing Clock-In",
        subtitle: `${driverData.name} - ${driverData.route}`,
        imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
      },
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: "Driver",
              content: driverData.name,
              icon: "PERSON"
            }
          },
          {
            keyValue: {
              topLabel: "Expected Clock-In",
              content: driverData.expectedClockIn,
              icon: "CLOCK"
            }
          },
          {
            keyValue: {
              topLabel: "Assigned Route",
              content: driverData.route,
              icon: "MAP_PIN"
            }
          },
          {
            keyValue: {
              topLabel: "Contact",
              content: driverData.contactInfo,
              icon: "PHONE"
            }
          },
          {
            buttons: [
              {
                textButton: {
                  text: "Call Driver",
                  onClick: {
                    openLink: { url: `tel:${driverData.contactInfo}` }
                  }
                }
              },
              {
                textButton: {
                  text: "View Timeero",
                  onClick: {
                    openLink: { url: "https://app.timeero.com" }
                  }
                }
              }
            ]
          }
        ]
      }]
    }

    await this.sendCard(card)
  }

  // Alert when route efficiency is low
  async alertRouteInefficient(routeData: {
    routeName: string
    driverName: string
    efficiency: number
    expectedTime: number
    actualTime: number
    suggestions: string[]
  }): Promise<void> {
    if (!this.alertConfig.routeInefficient) return

    const card: ChatCard = {
      header: {
        title: "📍 Route Inefficiency Detected",
        subtitle: `${routeData.routeName} - ${routeData.efficiency}% efficient`,
        imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
      },
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: "Route",
              content: routeData.routeName,
              icon: "MAP_PIN"
            }
          },
          {
            keyValue: {
              topLabel: "Driver",
              content: routeData.driverName,
              icon: "PERSON"
            }
          },
          {
            keyValue: {
              topLabel: "Efficiency",
              content: `${routeData.efficiency}%`,
              icon: "STAR"
            }
          },
          {
            keyValue: {
              topLabel: "Time Variance",
              content: `Expected: ${routeData.expectedTime}h, Actual: ${routeData.actualTime}h`,
              icon: "CLOCK"
            }
          },
          {
            textParagraph: {
              text: `<b>Suggestions:</b><br>${routeData.suggestions.join('<br>')}`
            }
          }
        ]
      }]
    }

    await this.sendCard(card)
  }

  // Alert for overdue invoices
  async alertOverdueInvoices(invoiceData: {
    count: number
    totalAmount: number
    customers: string[]
  }): Promise<void> {
    if (!this.alertConfig.overdueInvoices) return

    const card: ChatCard = {
      header: {
        title: "📋 Overdue Invoices Alert",
        subtitle: `${invoiceData.count} invoices totaling $${invoiceData.totalAmount.toFixed(2)}`,
        imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
      },
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: "Overdue Count",
              content: invoiceData.count.toString(),
              icon: "DESCRIPTION"
            }
          },
          {
            keyValue: {
              topLabel: "Total Amount",
              content: `$${invoiceData.totalAmount.toFixed(2)}`,
              icon: "DOLLAR"
            }
          },
          {
            textParagraph: {
              text: `<b>Customers:</b><br>${invoiceData.customers.slice(0, 5).join('<br>')}${invoiceData.customers.length > 5 ? '<br>...' : ''}`
            }
          },
          {
            buttons: [{
              textButton: {
                text: "View FreshBooks",
                onClick: {
                  openLink: { url: "https://my.freshbooks.com" }
                }
              }
            }]
          }
        ]
      }]
    }

    await this.sendCard(card)
  }

  // Send daily summary
  async sendDailySummary(summaryData: {
    revenue: number
    jobsCompleted: number
    activeDrivers: number
    routeEfficiency: number
    overdueAmount: number
  }): Promise<void> {
    const card: ChatCard = {
      header: {
        title: "📊 Daily Operations Summary",
        subtitle: new Date().toLocaleDateString(),
        imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
      },
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: "Revenue Today",
              content: `$${summaryData.revenue.toFixed(2)}`,
              icon: "DOLLAR"
            }
          },
          {
            keyValue: {
              topLabel: "Jobs Completed",
              content: summaryData.jobsCompleted.toString(),
              icon: "STAR"
            }
          },
          {
            keyValue: {
              topLabel: "Active Drivers",
              content: summaryData.activeDrivers.toString(),
              icon: "PERSON"
            }
          },
          {
            keyValue: {
              topLabel: "Route Efficiency",
              content: `${summaryData.routeEfficiency}%`,
              icon: "MAP_PIN"
            }
          },
          {
            keyValue: {
              topLabel: "Overdue Amount",
              content: `$${summaryData.overdueAmount.toFixed(2)}`,
              icon: "DESCRIPTION"
            }
          },
          {
            buttons: [{
              textButton: {
                text: "View Dashboard",
                onClick: {
                  openLink: { url: "http://localhost:3000/dashboard" }
                }
              }
            }]
          }
        ]
      }]
    }

    await this.sendCard(card)
  }

  // Configure which alerts to send
  setAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config }
  }

  // Private method to make HTTP requests
  private async makeRequest(message: ChatMessage): Promise<void> {
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })

      if (!response.ok) {
        throw new Error(`Google Chat API error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error sending Google Chat message:', error)
      throw error
    }
  }
}

// Export singleton instance
export const googleChatAPI = new GoogleChatAPI({
  webhookUrl: process.env.GOOGLE_CHAT_WEBHOOK_URL || '',
  serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
})

// Export helper functions for API routes
export async function sendGoogleChatMessage(message: string): Promise<void> {
  if (!process.env.GOOGLE_CHAT_WEBHOOK_URL) {
    throw new Error('Google Chat webhook URL not configured')
  }

  const chatAPI = new GoogleChatAPI({
    webhookUrl: process.env.GOOGLE_CHAT_WEBHOOK_URL
  })

  await chatAPI.sendMessage(message)
}

export async function sendGoogleChatAlert(type: string, message: string, address?: string, customerName?: string): Promise<void> {
  if (!process.env.GOOGLE_CHAT_WEBHOOK_URL) {
    throw new Error('Google Chat webhook URL not configured')
  }

  const chatAPI = new GoogleChatAPI({
    webhookUrl: process.env.GOOGLE_CHAT_WEBHOOK_URL
  })

  // Create a card based on the type
  const card: ChatCard = {
    header: {
      title: getAlertTitle(type),
      subtitle: customerName ? `${customerName}` : undefined,
      imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png"
    },
    sections: [{
      widgets: [
        {
          keyValue: {
            topLabel: "Message",
            content: message,
            contentMultiline: true,
            icon: "DESCRIPTION"
          }
        },
        ...(address ? [{
          keyValue: {
            topLabel: "Address",
            content: address,
            contentMultiline: true,
            icon: "MAP_PIN"
          }
        }] : []),
        ...(customerName ? [{
          keyValue: {
            topLabel: "Customer",
            content: customerName,
            icon: "PERSON"
          }
        }] : []),
        {
          buttons: [{
            textButton: {
              text: "View Dashboard",
              onClick: {
                openLink: { url: "http://localhost:3000/dashboard" }
              }
            }
          }]
        }
      ]
    }]
  }

  await chatAPI.sendCard(card)
}

function getAlertTitle(type: string): string {
  switch (type) {
    case 'missed-pickup':
      return '⚠️ Missed Pickup Alert'
    case 'meeting':
      return '📅 Meeting Scheduled'
    case 'property-manager':
      return '🏢 Property Manager Update'
    case 'general':
      return '📢 General Alert'
    default:
      return '🔔 Notification'
  }
}

export type { ChatMessage, ChatCard, AlertConfig } 