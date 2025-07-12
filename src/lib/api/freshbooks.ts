// FreshBooks API Integration
// Documentation: https://www.freshbooks.com/api/

interface FreshBooksConfig {
  clientId: string
  clientSecret: string
  accessToken: string
  accountId: string
}

interface Invoice {
  id: string
  customerName: string
  amount: number
  status: 'paid' | 'unpaid' | 'overdue' | 'draft'
  dateCreated: string
  datePaid?: string
  dueDate: string
}

interface Payment {
  id: string
  invoiceId: string
  customerName: string
  amount: number
  date: string
  method: string
}

interface RevenueData {
  totalRevenueMTD: number
  overdueInvoices: { count: number; amount: number }
  recentPayments: Payment[]
  dailyIncome: { date: string; amount: number }[]
}

class FreshBooksAPI {
  private config: FreshBooksConfig
  private baseUrl = 'https://api.freshbooks.com'

  constructor(config: FreshBooksConfig) {
    this.config = config
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`FreshBooks API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get all invoices for the current month
  async getInvoices(dateFrom?: string, dateTo?: string): Promise<Invoice[]> {
    const params = new URLSearchParams({
      'search[date_from]': dateFrom || this.getFirstDayOfMonth(),
      'search[date_to]': dateTo || this.getCurrentDate(),
    })

    const response = await this.makeRequest(`/accounting/account/${this.config.accountId}/invoices/invoices?${params}`)
    
    return response.response.result.invoices.map((invoice: any) => ({
      id: invoice.id,
      customerName: invoice.fname + ' ' + invoice.lname,
      amount: parseFloat(invoice.amount.amount),
      status: this.mapInvoiceStatus(invoice.invoice_status),
      dateCreated: invoice.date,
      datePaid: invoice.paid_date,
      dueDate: invoice.due_date,
    }))
  }

  // Get payments for the current month
  async getPayments(dateFrom?: string, dateTo?: string): Promise<Payment[]> {
    const params = new URLSearchParams({
      'search[date_from]': dateFrom || this.getFirstDayOfMonth(),
      'search[date_to]': dateTo || this.getCurrentDate(),
    })

    const response = await this.makeRequest(`/accounting/account/${this.config.accountId}/payments/payments?${params}`)
    
    return response.response.result.payments.map((payment: any) => ({
      id: payment.id,
      invoiceId: payment.invoiceid,
      customerName: payment.vis_state === 0 ? 'Deleted Customer' : 'Customer', // Need to lookup customer
      amount: parseFloat(payment.amount.amount),
      date: payment.date,
      method: payment.type,
    }))
  }

  // Get comprehensive revenue data
  async getRevenueData(): Promise<RevenueData> {
    try {
      const [invoices, payments] = await Promise.all([
        this.getInvoices(),
        this.getPayments()
      ])

      // Calculate total revenue MTD (from paid invoices)
      const paidInvoices = invoices.filter(inv => inv.status === 'paid')
      const totalRevenueMTD = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)

      // Calculate overdue invoices
      const overdueInvoices = invoices.filter(inv => 
        inv.status === 'overdue' || (inv.status === 'unpaid' && new Date(inv.dueDate) < new Date())
      )
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0)

      // Get recent payments (last 10)
      const recentPayments = payments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)

      // Calculate daily income for the last 7 days
      const dailyIncome = this.calculateDailyIncome(payments)

      return {
        totalRevenueMTD,
        overdueInvoices: { count: overdueInvoices.length, amount: overdueAmount },
        recentPayments,
        dailyIncome
      }
    } catch (error) {
      console.error('Error fetching FreshBooks revenue data:', error)
      throw error
    }
  }

  // Create a new invoice
  async createInvoice(customerData: {
    customerName: string
    email: string
    amount: number
    description: string
    dueDate: string
  }): Promise<Invoice> {
    const invoiceData = {
      invoice: {
        customerid: 0, // Would need to create/lookup customer first
        create_date: this.getCurrentDate(),
        due_date: customerData.dueDate,
        lines: [{
          name: customerData.description,
          qty: 1,
          unit_cost: {
            amount: customerData.amount.toString(),
            code: 'USD'
          }
        }]
      }
    }

    const response = await this.makeRequest(
      `/accounting/account/${this.config.accountId}/invoices/invoices`,
      {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      }
    )

    return response.response.result.invoice
  }

  // Helper methods
  private mapInvoiceStatus(status: string): Invoice['status'] {
    switch (status) {
      case '1': return 'draft'
      case '2': return 'unpaid'
      case '3': return 'paid'
      case '4': return 'overdue'
      default: return 'unpaid'
    }
  }

  private getFirstDayOfMonth(): string {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0]
  }

  private calculateDailyIncome(payments: Payment[]): { date: string; amount: number }[] {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    return last7Days.map(date => {
      const dayPayments = payments.filter(payment => payment.date === date)
      const amount = dayPayments.reduce((sum, payment) => sum + payment.amount, 0)
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        amount
      }
    })
  }
}

// Export singleton instance
export const freshBooksAPI = new FreshBooksAPI({
  clientId: process.env.FRESHBOOKS_CLIENT_ID || '',
  clientSecret: process.env.FRESHBOOKS_CLIENT_SECRET || '',
  accessToken: process.env.FRESHBOOKS_ACCESS_TOKEN || '',
  accountId: process.env.FRESHBOOKS_ACCOUNT_ID || '',
})

export type { RevenueData, Invoice, Payment } 