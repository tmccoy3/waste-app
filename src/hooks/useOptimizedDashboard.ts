import { useState, useEffect, useMemo, useCallback } from 'react';
import { parseCustomerData, Customer, Metrics, RevenueTrend, EfficiencyScore } from '@/lib/validations';

// Types
interface DashboardData {
  customers: Customer[];
  metrics: Metrics;
  revenueTrends: RevenueTrend[];
  efficiencyScores: EfficiencyScore[];
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  search: string;
  page: number;
  pageSize: number;
}

interface DashboardActions {
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refreshData: () => void;
  exportCSV: () => void;
  exportPDF: () => Promise<void>;
}

// Utility functions with memoization
const parseRevenue = (revenueStr: string): number => {
  const cleaned = revenueStr.replace(/[$,]/g, '');
  return parseFloat(cleaned) || 0;
};

const parseNumber = (value: string): number => {
  return parseFloat(value) || 0;
};

// Memoized calculations
const calculateMetrics = (customers: Customer[]): Metrics => {
  const activeCustomers = customers.length;
  const monthlyRevenue = customers.reduce((sum, customer) => 
    sum + parseRevenue(customer['Monthly Revenue']), 0
  );
  const totalTime = customers.reduce((sum, customer) => 
    sum + parseNumber(customer['Average Completion Time in Minutes']), 0
  );
  const avgTime = activeCustomers > 0 ? totalTime / activeCustomers : 0;
  const revenuePerMinute = totalTime > 0 ? monthlyRevenue / totalTime : 0;
  
  return {
    activeCustomers,
    monthlyRevenue,
    hoaAvgTime: avgTime,
    revenuePerMinute,
    efficiencyGain: 8.1, // Placeholder for now
  };
};

const calculateRevenueTrends = (baseRevenue: number): RevenueTrend[] => {
  return [
    { month: 'Mar', HOA: Math.round(baseRevenue * 0.18), Subscription: Math.round(baseRevenue * 0.12), Commercial: Math.round(baseRevenue * 0.08), growth: '+2.3%' },
    { month: 'Apr', HOA: Math.round(baseRevenue * 0.19), Subscription: Math.round(baseRevenue * 0.13), Commercial: Math.round(baseRevenue * 0.09), growth: '+4.8%' },
    { month: 'May', HOA: Math.round(baseRevenue * 0.17), Subscription: Math.round(baseRevenue * 0.11), Commercial: Math.round(baseRevenue * 0.07), growth: '-3.3%' },
    { month: 'Jun', HOA: Math.round(baseRevenue * 0.20), Subscription: Math.round(baseRevenue * 0.14), Commercial: Math.round(baseRevenue * 0.10), growth: '+7.0%' },
    { month: 'Jul', HOA: Math.round(baseRevenue * 0.21), Subscription: Math.round(baseRevenue * 0.15), Commercial: Math.round(baseRevenue * 0.11), growth: '-0.5%' },
  ];
};

const calculateEfficiencyScores = (customers: Customer[]): EfficiencyScore[] => {
  const hoaCount = customers.filter(c => c.Type === 'HOA').length;
  const subscriptionCount = customers.filter(c => c.Type === 'Subscription').length;
  const commercialCount = customers.filter(c => c.Type === 'Commercial').length;
  
  return [
    { name: 'HOA', value: 93, count: hoaCount },
    { name: 'Subscription', value: 4, count: subscriptionCount },
    { name: 'Commercial', value: 3, count: commercialCount },
  ];
};

// Custom hook for optimized dashboard
export const useOptimizedDashboard = (initialPageSize: number = 10) => {
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: true,
    error: null,
    search: '',
    page: 1,
    pageSize: initialPageSize,
  });

  // Memoized data loading function
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/geocoded_customers.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const rawData = await response.json();
      
      // Validate and parse data
      const customers = parseCustomerData(rawData.filter((c: any) => c['Service Status'] === 'Serviced'));
      const metrics = calculateMetrics(customers);
      const revenueTrends = calculateRevenueTrends(metrics.monthlyRevenue);
      const efficiencyScores = calculateEfficiencyScores(customers);
      
      setState(prev => ({
        ...prev,
        data: {
          customers,
          metrics,
          revenueTrends,
          efficiencyScores,
        },
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load data',
        loading: false,
      }));
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Memoized filtered data
  const filteredCustomers = useMemo(() => {
    if (!state.data?.customers) return [];
    
    if (!state.search) return state.data.customers;
    
    const searchLower = state.search.toLowerCase();
    return state.data.customers.filter(customer =>
      customer['HOA Name'].toLowerCase().includes(searchLower) ||
      customer['Full Address'].toLowerCase().includes(searchLower)
    );
  }, [state.data?.customers, state.search]);

  // Memoized paginated data
  const paginatedCustomers = useMemo(() => {
    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, state.page, state.pageSize]);

  // Memoized pagination info
  const paginationInfo = useMemo(() => {
    const totalCustomers = filteredCustomers.length;
    const totalPages = Math.ceil(totalCustomers / state.pageSize);
    const hasNextPage = state.page < totalPages;
    const hasPrevPage = state.page > 1;
    
    return {
      totalCustomers,
      totalPages,
      hasNextPage,
      hasPrevPage,
      currentPage: state.page,
      pageSize: state.pageSize,
    };
  }, [filteredCustomers.length, state.page, state.pageSize]);

  // Memoized action handlers
  const setSearch = useCallback((search: string) => {
    setState(prev => ({ ...prev, search, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  const exportCSV = useCallback(() => {
    if (!state.data?.customers) return;
    
    const csvContent = [
      Object.keys(state.data.customers[0]).join(','),
      ...state.data.customers.map(customer => 
        Object.values(customer).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state.data?.customers]);

  const exportPDF = useCallback(async () => {
    if (!state.data?.metrics) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      
      // Header
      pdf.setFontSize(20);
      pdf.text('WasteOps Intelligence Report', 20, 20);
      
      // Metrics
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
      pdf.text(`Active Customers: ${state.data.metrics.activeCustomers}`, 20, 50);
      pdf.text(`Monthly Revenue: $${state.data.metrics.monthlyRevenue.toLocaleString()}`, 20, 65);
      pdf.text(`Average Service Time: ${state.data.metrics.hoaAvgTime.toFixed(1)} minutes`, 20, 80);
      pdf.text(`Revenue Per Minute: $${state.data.metrics.revenuePerMinute.toFixed(2)}`, 20, 95);
      
      pdf.save(`wasteops-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw new Error('Failed to generate PDF export');
    }
  }, [state.data?.metrics]);

  const actions: DashboardActions = useMemo(() => ({
    setSearch,
    setPage,
    setPageSize,
    refreshData,
    exportCSV,
    exportPDF,
  }), [setSearch, setPage, setPageSize, refreshData, exportCSV, exportPDF]);

  return {
    // State
    data: state.data,
    loading: state.loading,
    error: state.error,
    search: state.search,
    
    // Processed data
    filteredCustomers,
    paginatedCustomers,
    paginationInfo,
    
    // Actions
    actions,
  };
};

// Export types
export type { DashboardData, DashboardState, DashboardActions }; 