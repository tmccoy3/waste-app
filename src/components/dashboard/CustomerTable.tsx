import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Customer } from '@/lib/validations';

interface CustomerTableProps {
  customers: Customer[];
  search: string;
  onSearchChange: (search: string) => void;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  totalCustomers: number;
  pageSize: number;
}

interface CustomerRowProps {
  customer: Customer;
  index: number;
}

// Memoized customer row component
const CustomerRow: React.FC<CustomerRowProps> = React.memo(({ customer, index }) => {
  const parseRevenue = React.useCallback((revenueStr: string) => {
    const cleaned = revenueStr.replace(/[$,]/g, '');
    return parseFloat(cleaned) || 0;
  }, []);

  const formatRevenue = React.useCallback((revenue: number) => {
    return `$${revenue.toLocaleString()}`;
  }, []);

  const getTypeColor = React.useCallback((type: string) => {
    switch (type) {
      case 'HOA':
        return 'bg-blue-100 text-blue-800';
      case 'Subscription':
        return 'bg-green-100 text-green-800';
      case 'Commercial':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }, []);

  const revenue = parseRevenue(customer['Monthly Revenue']);
  const typeColor = getTypeColor(customer.Type || customer['Unit Type']);

  return (
    <TableRow className="hover:bg-slate-50 transition-colors">
      <TableCell className="font-medium">
        <div className="whitespace-normal">
          <div className="font-semibold text-slate-900 line-clamp-2">
            {customer['HOA Name']}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="whitespace-normal text-sm text-slate-600 max-w-xs line-clamp-2">
          {customer['Full Address']}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="font-semibold text-green-600">
          {formatRevenue(revenue)}
        </div>
      </TableCell>
      <TableCell className="text-center text-slate-700">
        {customer['Average Completion Time in Minutes']}m
      </TableCell>
      <TableCell className="text-center text-slate-700">
        {customer['Number of Units'] || 'N/A'}
      </TableCell>
      <TableCell className="text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
          {customer.Type || customer['Unit Type']}
        </span>
      </TableCell>
    </TableRow>
  );
});

CustomerRow.displayName = 'CustomerRow';

// Memoized pagination component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}> = React.memo(({ currentPage, totalPages, hasNextPage, hasPrevPage, onPageChange }) => {
  const handlePrevPage = React.useCallback(() => {
    if (hasPrevPage) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, hasPrevPage, onPageChange]);

  const handleNextPage = React.useCallback(() => {
    if (hasNextPage) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, hasNextPage, onPageChange]);

  const handlePageClick = React.useCallback((page: number) => {
    onPageChange(page);
  }, [onPageChange]);

  // Generate page numbers (show max 5 pages around current)
  const generatePageNumbers = React.useMemo(() => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          disabled={!hasPrevPage} 
          onClick={handlePrevPage}
          size="sm"
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {generatePageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageClick(pageNum)}
              className="w-8 h-8 p-0"
            >
              {pageNum}
            </Button>
          ))}
        </div>
        <Button 
          variant="outline" 
          disabled={!hasNextPage} 
          onClick={handleNextPage}
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

const CustomerTable: React.FC<CustomerTableProps> = React.memo(({ 
  customers, 
  search, 
  onSearchChange, 
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  totalCustomers,
  pageSize 
}) => {
  // Memoized search handler
  const handleSearchChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  }, [onSearchChange]);

  // Memoized pagination info
  const paginationInfo = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCustomers);
    return { start, end };
  }, [currentPage, pageSize, totalCustomers]);

  return (
              <Card className="bg-[#ffffff] shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              Customer Portfolio
            </CardTitle>
            <p className="text-sm text-slate-600">
              Detailed customer analytics and performance metrics
            </p>
          </div>
          <div className="w-full md:w-auto">
            <Input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={handleSearchChange}
              className="min-w-[300px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold text-slate-700">
                  Customer Name
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Address
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">
                  Monthly Revenue
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">
                  Avg Time
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">
                  Units
                </TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">
                  Type
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {search ? 'No customers found matching your search.' : 'No customers to display.'}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, index) => (
                  <CustomerRow 
                    key={`${customer['HOA Name']}-${index}`} 
                    customer={customer} 
                    index={index} 
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalCustomers > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 pt-4 border-t border-slate-200 gap-4">
            <div className="text-sm text-slate-600">
              Showing {paginationInfo.start} to {paginationInfo.end} of {totalCustomers} customers
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CustomerTable.displayName = 'CustomerTable';

export default CustomerTable; 