import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { CustomerService, Customer } from '@/services/CustomerService';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FilterModal } from '@/components/customers/FilterModal';
import { ViewCustomerModal } from '@/components/customers/ViewCustomerModal';

interface FilterState {
  membershipType?: string;
  source?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function handleViewCustomer(customer: Customer, setSelectedCustomer: any, setIsViewModalOpen: any) {
  setSelectedCustomer(customer);
  setIsViewModalOpen(true);
}

function handleEditCustomer(customer: Customer, setSelectedCustomer: any, setIsEditModalOpen: any) {
  setSelectedCustomer(customer);
  setIsEditModalOpen(true);
}

function handleDeleteCustomer(customerId: string, handleDelete: any) {
  handleDelete(customerId);
}

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {customer.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-muted-foreground">{customer.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "membershipType",
    header: "Membership",
    cell: ({ row }) => {
      const membershipType = row.original.membershipType;
      return (
        <Badge variant={
          membershipType === 'vip' ? 'default' :
          membershipType === 'premium' ? 'secondary' :
          membershipType === 'basic' ? 'outline' :
          'secondary'
        }>
          {membershipType.charAt(0).toUpperCase() + membershipType.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "membershipFees",
    header: "Membership Fees",
    cell: ({ row }) => {
      const fees = row.original.membershipFees;
      return fees ? `$${fees.toFixed(2)}` : '-';
    },
  },
  {
    accessorKey: "totalSpent",
    header: "Total Spent",
    cell: ({ row }) => {
      const total = row.original.totalSpent;
      return `$${total.toFixed(2)}`;
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.original.source;
      return source.charAt(0).toUpperCase() + source.slice(1).replace('_', ' ');
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewCustomer(customer, setSelectedCustomer, setIsViewModalOpen)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditCustomer(customer, setSelectedCustomer, setIsEditModalOpen)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDeleteCustomer(customer.id, handleDelete)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function CustomersPage() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch all customers once on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const data = await CustomerService.getCustomers();
        setCustomers(data.customers);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load customers",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, [toast]);

  // Client-side filtering
  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.toLowerCase().includes(query))
    );
  });

  const deleteMutation = useMutation({
    mutationFn: CustomerService.deleteCustomer,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(customerId);
    }
  };

  const handleFilterApply = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setSelectedCustomer(updatedCustomer);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg">Loading customers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-2xl font-bold">Customers</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </motion.div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              className="pl-9"
              type="text"
              autoComplete="off"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setIsFilterModalOpen(true)}>
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Membership Type</TableHead>
                <TableHead>Membership Fees</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer: Customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>{customer.membershipType || '-'}</TableCell>
                  <TableCell>Rs. {customer.membershipFees?.toLocaleString() || '-'}</TableCell>
                  <TableCell>Rs. {customer.totalSpent.toLocaleString()}</TableCell>
                  <TableCell>{customer.source || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewCustomer(customer, setSelectedCustomer, setIsViewModalOpen)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCustomer(customer, setSelectedCustomer, setIsEditModalOpen)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteCustomer(customer.id, handleDelete)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredCustomers || filteredCustomers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AddCustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />

        {selectedCustomer && (
          <>
            <EditCustomerModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              customer={selectedCustomer}
              onCustomerUpdated={handleCustomerUpdated}
            />
            <ViewCustomerModal
              isOpen={isViewModalOpen}
              onClose={() => setIsViewModalOpen(false)}
              customer={selectedCustomer}
              onCustomerUpdated={handleCustomerUpdated}
            />
          </>
        )}

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={handleFilterApply}
          currentFilters={filters}
        />
      </div>
    </DashboardLayout>
  );
}

export default CustomersPage;
