import * as React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Plus, 
  Users, 
  Download, 
  Search, 
  Filter, 
  MoreHorizontal,
  TrendingUp,
  Star,
  Crown,
  Calendar,
  DollarSign,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  UserCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { AxiosResponse } from 'axios';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import {
  CommandDialog
} from '@/components/ui/command';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, format, addMonths } from 'date-fns';
import * as Papa from 'papaparse';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import RenewPersonalTrainingModal from '@/components/personal-training/RenewPersonalTrainingModal';

interface Assignment {
  _id?: string;
  customerId: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  trainerId: {
    _id: string;
    name: string;
    email?: string;
  };
  gymId: string;
  startDate: string;
  duration: number;
  endDate: string;
  fees: number;
}

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  membershipEndDate?: string;
}

interface Trainer {
  _id: string;
  name: string;
  email?: string;
}

interface FormState {
  customerId: string;
  trainerId: string;
  startDate: string;
  duration: number;
  fees: string;
}

interface FilterState {
  trainerFilter: string;
  statusFilter: string;
  expiryFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const PersonalTrainingPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    trainerFilter: 'none',
    statusFilter: 'none',
    expiryFilter: 'none',
    sortBy: 'none',
    sortOrder: 'asc'
  });
  
  const [form, setForm] = useState<FormState>({
    customerId: '',
    trainerId: '',
    startDate: '',
    duration: 1,
    fees: ''
  });
  const [editForm, setEditForm] = useState<FormState>({
    customerId: '',
    trainerId: '',
    startDate: '',
    duration: 1,
    fees: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const gymId = user?.gymId || '';
  const [customerCommandOpen, setCustomerCommandOpen] = useState(false);
  const [trainerCommandOpen, setTrainerCommandOpen] = useState(false);
  const [editCustomerCommandOpen, setEditCustomerCommandOpen] = useState(false);
  const [editTrainerCommandOpen, setEditTrainerCommandOpen] = useState(false);
  const [viewAssignment, setViewAssignment] = useState<Assignment | null>(null);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const [renewAssignment, setRenewAssignment] = useState<Assignment | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Helper functions for assignment status
  const getAssignmentStatus = (assignment: Assignment) => {
    const today = new Date();
    const endDate = new Date(assignment.endDate);
    const daysUntilExpiry = differenceInDays(endDate, today);
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring-soon';
    return 'active';
  };

  const isAssignmentExpiringSoon = (assignment: Assignment, days: number = 7) => {
    const today = new Date();
    const endDate = new Date(assignment.endDate);
    const daysUntilExpiry = differenceInDays(endDate, today);
    return daysUntilExpiry >= 0 && daysUntilExpiry <= days;
  };

  // Populate edit form when editAssignment changes
  useEffect(() => {
    if (editAssignment) {
      setEditForm({
        customerId: editAssignment.customerId._id,
        trainerId: editAssignment.trainerId._id,
        startDate: editAssignment.startDate.slice(0, 10),
        duration: editAssignment.duration,
        fees: editAssignment.fees.toString()
      });
    }
  }, [editAssignment]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsRes, customersRes, trainersRes] = await Promise.all([
          axios.get(`/personal-training?gymId=${gymId}`),
          axios.get(`/customers?gymId=${gymId}&limit=10000`),
          axios.get(`/trainers?gymId=${gymId}`)
        ]);

        setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : assignmentsRes.data.assignments || []);
        setCustomers(Array.isArray(customersRes.data) ? customersRes.data : customersRes.data.customers || []);
        setTrainers(Array.isArray(trainersRes.data) ? trainersRes.data : trainersRes.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      }
    };

    if (gymId) {
      fetchData();
    }
  }, [gymId, open]);

  // Filter and search assignments
  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(assignment =>
        assignment.customerId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.trainerId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.customerId?.phone?.includes(searchQuery) ||
        assignment.trainerId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Trainer filter
    if (filters.trainerFilter && filters.trainerFilter !== 'none') {
      filtered = filtered.filter(assignment => assignment.trainerId._id === filters.trainerFilter);
    }

    // Status filter
    if (filters.statusFilter && filters.statusFilter !== 'none') {
      filtered = filtered.filter(assignment => {
        const status = getAssignmentStatus(assignment);
        return status === filters.statusFilter;
      });
    }

    // Expiry filter
    if (filters.expiryFilter && filters.expiryFilter !== 'none') {
      filtered = filtered.filter(assignment => {
        const today = new Date();
        const endDate = new Date(assignment.endDate);
        const daysUntilExpiry = differenceInDays(endDate, today);
        
        switch (filters.expiryFilter) {
          case '7days':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
          case '15days':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 15;
          case '30days':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
          case 'expired':
            return daysUntilExpiry < 0;
          default:
            return true;
        }
      });
    }

    // Sorting
    if (filters.sortBy && filters.sortBy !== 'none') {
      filtered.sort((a, b) => {
        let aValue: string | number, bValue: string | number;
        
        switch (filters.sortBy) {
          case 'customer':
            aValue = a.customerId?.name.toLowerCase() || '';
            bValue = b.customerId?.name.toLowerCase() || '';
            break;
          case 'trainer':
            aValue = a.trainerId?.name.toLowerCase() || '';
            bValue = b.trainerId?.name.toLowerCase() || '';
            break;
          case 'startDate':
            aValue = new Date(a.startDate).getTime();
            bValue = new Date(b.startDate).getTime();
            break;
          case 'endDate':
            aValue = new Date(a.endDate).getTime();
            bValue = new Date(b.endDate).getTime();
            break;
          case 'fees':
            aValue = a.fees || 0;
            bValue = b.fees || 0;
            break;
          default:
            return 0;
        }
        
        if (filters.sortOrder === 'desc') {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    return filtered;
  }, [assignments, searchQuery, filters]);

  // Pagination
  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAssignments.slice(startIndex, endIndex);
  }, [filteredAssignments, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAssignments.length / rowsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, rowsPerPage]);

  // Assignment insights
  const assignmentInsights = useMemo(() => {
    if (!filteredAssignments.length) return {
      totalAssignments: 0,
      activeAssignments: 0,
      expiringSoon: 0,
      expiredAssignments: 0,
      totalRevenue: 0,
      averageFees: 0,
      recentAssignments: 0
    };

    const activeAssignments = filteredAssignments.filter(a => getAssignmentStatus(a) === 'active').length;
    const expiringSoon = filteredAssignments.filter(a => getAssignmentStatus(a) === 'expiring-soon').length;
    const expiredAssignments = filteredAssignments.filter(a => getAssignmentStatus(a) === 'expired').length;
    const totalRevenue = filteredAssignments.reduce((sum, a) => sum + (a.fees || 0), 0);
    const averageFees = totalRevenue / filteredAssignments.length;
    
    // Recent assignments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAssignments = filteredAssignments.filter(a => 
      new Date(a.startDate) > thirtyDaysAgo
    ).length;

    return {
      totalAssignments: filteredAssignments.length,
      activeAssignments,
      expiringSoon,
      expiredAssignments,
      totalRevenue,
      averageFees,
      recentAssignments
    };
  }, [filteredAssignments]);

  // Form handlers
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  function handleSelect(name: string, value: string): void {
    setForm({ ...form, [name]: value });
  }

  function handleEditSelect(name: string, value: string): void {
    setEditForm({ ...editForm, [name]: value });
  }

  function calculateEndDate(startDate: string, duration: number) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(duration));
    end.setDate(end.getDate() - 1);
    return end.toISOString().split('T')[0];
  }

  // Submit handlers
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isAssigning) return; // Prevent double submit
    // Membership check
    const selectedCustomer = customers.find(c => c._id === form.customerId);
    if (!selectedCustomer || !selectedCustomer.membershipEndDate || new Date(selectedCustomer.membershipEndDate) < new Date()) {
      toast({
        title: "Cannot Assign Trainer",
        description: "This customer's membership has ended. Please renew their membership before assigning personal training.",
        variant: "destructive",
      });
      return;
    }
    setIsAssigning(true);
    setOpen(false); // Close modal immediately
    const endDate = calculateEndDate(form.startDate, form.duration);
    const requestData = {
      ...form,
      gymId,
      endDate,
      fees: Number(form.fees),
      duration: Number(form.duration)
    };
    try {
      const response = await axios.post('/personal-training', requestData);
      toast({
        title: "Success",
        description: "Trainer assigned successfully!",
      });
      setForm({ customerId: '', trainerId: '', startDate: '', duration: 1, fees: '' });
      // Refresh assignments
      const res = await axios.get(`/personal-training?gymId=${gymId}`);
      setAssignments(Array.isArray(res.data) ? res.data : res.data.assignments || []);
      // Invalidate customers query so customer section updates
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error: unknown) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  }

  // Export functionality
  const handleExport = useCallback(() => {
    const dataToExport = filteredAssignments.map(assignment => {
      const endDate = new Date(assignment.endDate);
      const daysUntilExpiry = differenceInDays(endDate, new Date());
      // For display, add +1 to match badge logic
      return {
        "Customer Name": assignment.customerId?.name || '',
        "Customer Phone": assignment.customerId?.phone || '',
        "Customer Email": assignment.customerId?.email || '',
        "Trainer Name": assignment.trainerId?.name || '',
        "Trainer Email": assignment.trainerId?.email || '',
        "Start Date": format(new Date(assignment.startDate), 'yyyy-MM-dd'),
        "End Date": format(endDate, 'yyyy-MM-dd'),
        "Duration (Months)": assignment.duration,
        "Fees": assignment.fees,
        "Status": getAssignmentStatus(assignment),
        "Days Until Expiry": daysUntilExpiry + 1, // +1 for user-facing display
      };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `personal-training-assignments-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: `${filteredAssignments.length} assignment records exported successfully!`,
    });
  }, [filteredAssignments, toast]);

  // Clear filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      trainerFilter: 'none',
      statusFilter: 'none',
      expiryFilter: 'none',
      sortBy: 'none',
      sortOrder: 'asc'
    });
    setSearchQuery('');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => 
    searchQuery ||
    (filters.trainerFilter && filters.trainerFilter !== 'none') ||
    (filters.statusFilter && filters.statusFilter !== 'none') ||
    (filters.expiryFilter && filters.expiryFilter !== 'none') ||
    (filters.sortBy && filters.sortBy !== 'none')
  , [searchQuery, filters]);

  const getStatusBadge = (assignment: Assignment) => {
    const status = getAssignmentStatus(assignment);
    const endDate = new Date(assignment.endDate);
    const daysUntilExpiry = differenceInDays(endDate, new Date());
    
    switch (status) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'expiring-soon':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Expires in {daysUntilExpiry + 1} days</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2">
              Personal Training Assignments
            </h1>
            <p className="text-muted-foreground text-lg">
              Assign personal trainers to customers and manage all personal training assignments.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="shadow-sm" onClick={handleExport}>
              <Download className="mr-2 h-5 w-5" /> Export Data
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-sm">
                  <Plus className="mr-2 h-5 w-5" /> Assign Trainer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Personal Trainer</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block mb-1 font-medium">Customer</label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setCustomerCommandOpen(true)}
                    >
                      {form.customerId
                        ? (customers.find(c => c._id === form.customerId)?.name + (customers.find(c => c._id === form.customerId)?.phone ? ` (${customers.find(c => c._id === form.customerId)?.phone})` : ''))
                        : 'Select customer'}
                    </Button>
                    <CommandDialog open={customerCommandOpen} onOpenChange={setCustomerCommandOpen}>
                      <DialogTitle asChild>
                        <VisuallyHidden>Choose a customer</VisuallyHidden>
                      </DialogTitle>
                      <Command>
                        <CommandInput placeholder="Search customer by name or phone..." />
                        <CommandList>
                          <CommandEmpty>No customers found.</CommandEmpty>
                          {customers.map(c => (
                            <CommandItem
                              key={c._id}
                              value={c.name + (c.phone ? ` ${c.phone}` : '')}
                              onSelect={() => {
                                handleSelect('customerId', c._id);
                                setCustomerCommandOpen(false);
                              }}
                            >
                              {c.name} {c.phone ? `(${c.phone})` : ''}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </CommandDialog>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Trainer</label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setTrainerCommandOpen(true)}
                    >
                      {form.trainerId
                        ? (trainers.find(t => t._id === form.trainerId)?.name + (trainers.find(t => t._id === form.trainerId)?.email ? ` (${trainers.find(t => t._id === form.trainerId)?.email})` : ''))
                        : 'Select trainer'}
                    </Button>
                    <CommandDialog open={trainerCommandOpen} onOpenChange={setTrainerCommandOpen}>
                      <DialogTitle asChild>
                        <VisuallyHidden>Choose a trainer</VisuallyHidden>
                      </DialogTitle>
                      <Command>
                        <CommandInput placeholder="Search trainer by name or email..." />
                        <CommandList>
                          <CommandEmpty>No trainers found.</CommandEmpty>
                          {trainers.map(t => (
                            <CommandItem
                              key={t._id}
                              value={t.name + (t.email ? ` ${t.email}` : '')}
                              onSelect={() => {
                                handleSelect('trainerId', t._id);
                                setTrainerCommandOpen(false);
                              }}
                            >
                              {t.name} {t.email ? `(${t.email})` : ''}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </CommandDialog>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Start Date</label>
                    <Input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Duration (months)</label>
                    <Input type="number" name="duration" value={form.duration} min={1} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Fees</label>
                    <Input type="number" name="fees" value={form.fees} min={0} onChange={handleChange} required />
                  </div>
                  <div>
                    <Button type="submit" className="w-full" disabled={isAssigning}>
                      {isAssigning ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Enhanced Insights Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          {/* Left Column - Main Metrics */}
          <div className="xl:col-span-4 space-y-6">
            {/* Primary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Assignments</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{assignmentInsights.totalAssignments}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Total assignments
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Assignments</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{assignmentInsights.activeAssignments}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Currently active
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{assignmentInsights.expiringSoon}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Within 7 days
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">₹{assignmentInsights.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      From all assignments
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            {/* Secondary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{assignmentInsights.expiredAssignments}</div>
                    <p className="text-xs text-muted-foreground">Expired assignments</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Fees</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-indigo-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">₹{Math.round(assignmentInsights.averageFees).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Per assignment</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-teal-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Recent (30d)</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-teal-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{assignmentInsights.recentAssignments}</div>
                    <p className="text-xs text-muted-foreground">New assignments</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Trainer Breakdown */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Trainer Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trainers.slice(0, 5).map(trainer => {
                    const trainerAssignments = assignments.filter(a => a.trainerId && a.trainerId._id === trainer._id).length;
                    return (
                      <div key={trainer._id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">{trainer.name}</span>
                        </div>
                        <Badge variant="secondary">
                          {trainerAssignments}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsFilterModalOpen(true)}
              className={hasActiveFilters ? "border-primary text-primary" : ""}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Assignment Directory</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        {searchQuery || hasActiveFilters ? 'No assignments match your search criteria.' : 'No assignments found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAssignments.map(assignment => (
                      <TableRow key={assignment._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{assignment.customerId && assignment.customerId.name ? assignment.customerId.name : 'N/A'}</span>
                            {assignment.customerId && assignment.customerId.phone && (
                              <span className="text-xs text-muted-foreground">{assignment.customerId.phone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{assignment.trainerId && assignment.trainerId.name ? assignment.trainerId.name : 'N/A'}</span>
                            {assignment.trainerId && assignment.trainerId.email && (
                              <span className="text-xs text-muted-foreground">{assignment.trainerId.email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(assignment.startDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{assignment.duration} months</TableCell>
                        <TableCell>{format(new Date(assignment.endDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{getStatusBadge(assignment)}</TableCell>
                        <TableCell className="font-medium">₹{assignment.fees.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewAssignment(assignment);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditAssignment(assignment);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setRenewAssignment(assignment);
                                  setIsRenewModalOpen(true);
                                }}
                              >
                                <Crown className="mr-2 h-4 w-4 text-yellow-600" />
                                Renew
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this assignment?')) {
                                    try {
                                      await axios.delete(`/personal-training/${assignment._id}`);
                                      const res = await axios.get(`/personal-training?gymId=${gymId}`);
                                      setAssignments(Array.isArray(res.data) ? res.data : res.data.assignments || []);
                                      // Invalidate customers query so customer section updates
                                      queryClient.invalidateQueries({ queryKey: ['customers'] });
                                      toast({
                                        title: "Success",
                                        description: "Assignment deleted successfully",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to delete assignment",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredAssignments.length)} of {filteredAssignments.length} assignments
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="w-8 h-8"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Modal */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Assignments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Trainer</label>
              <Select
                value={filters.trainerFilter}
                onValueChange={(value) => setFilters(prev => ({ ...prev, trainerFilter: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All trainers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All trainers</SelectItem>
                  {trainers.map(trainer => (
                    <SelectItem key={trainer._id} value={trainer._id}>
                      {trainer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 font-medium">Status</label>
              <Select
                value={filters.statusFilter}
                onValueChange={(value) => setFilters(prev => ({ ...prev, statusFilter: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 font-medium">Expiring In</label>
              <Select
                value={filters.expiryFilter}
                onValueChange={(value) => setFilters(prev => ({ ...prev, expiryFilter: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any time</SelectItem>
                  <SelectItem value="7days">Next 7 days</SelectItem>
                  <SelectItem value="15days">Next 15 days</SelectItem>
                  <SelectItem value="30days">Next 30 days</SelectItem>
                  <SelectItem value="expired">Already expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 font-medium">Sort By</label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="customer">Customer Name</SelectItem>
                  <SelectItem value="trainer">Trainer Name</SelectItem>
                  <SelectItem value="startDate">Start Date</SelectItem>
                  <SelectItem value="endDate">End Date</SelectItem>
                  <SelectItem value="fees">Fees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2 font-medium">Sort Order</label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  trainerFilter: 'none',
                  statusFilter: 'none',
                  expiryFilter: 'none',
                  sortBy: 'none',
                  sortOrder: 'asc'
                })}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button onClick={() => setIsFilterModalOpen(false)} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Assignment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          {viewAssignment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-sm text-muted-foreground">Customer</label>
                  <p className="font-medium">{viewAssignment.customerId && viewAssignment.customerId.name ? viewAssignment.customerId.name : 'N/A'}</p>
                  {viewAssignment.customerId && viewAssignment.customerId.phone && (
                    <p className="text-sm text-muted-foreground">{viewAssignment.customerId.phone}</p>
                  )}
                </div>
                <div>
                  <label className="font-medium text-sm text-muted-foreground">Trainer</label>
                  <p className="font-medium">{viewAssignment.trainerId && viewAssignment.trainerId.name ? viewAssignment.trainerId.name : 'N/A'}</p>
                  {viewAssignment.trainerId && viewAssignment.trainerId.email && (
                    <p className="text-sm text-muted-foreground">{viewAssignment.trainerId.email}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-sm text-muted-foreground">Start Date</label>
                  <p>{format(new Date(viewAssignment.startDate), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <label className="font-medium text-sm text-muted-foreground">End Date</label>
                  <p>{format(new Date(viewAssignment.endDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-sm text-muted-foreground">Duration</label>
                  <p>{viewAssignment.duration} months</p>
                </div>
                <div>
                  <label className="font-medium text-sm text-muted-foreground">Fees</label>
                  <p className="font-medium">₹{viewAssignment.fees.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="font-medium text-sm text-muted-foreground">Status</label>
                <div className="mt-1">
                  {getStatusBadge(viewAssignment)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          {editAssignment && (
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const endDate = calculateEndDate(editForm.startDate, editForm.duration);
              const requestData = {
                ...editForm,
                gymId,
                endDate,
                fees: Number(editForm.fees),
                duration: Number(editForm.duration)
              };
              try {
                await axios.put(`/personal-training/${editAssignment._id}`, requestData);
                setIsEditModalOpen(false);
                setEditAssignment(null);
                
                // Refresh assignments
                const res = await axios.get(`/personal-training?gymId=${gymId}`);
                setAssignments(Array.isArray(res.data) ? res.data : res.data.assignments || []);
                // Invalidate customers query so customer section updates
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                
                toast({
                  title: "Success",
                  description: "Assignment updated successfully",
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to update assignment",
                  variant: "destructive",
                });
              }
            }}>
              <div>
                <label className="block mb-1 font-medium">Customer</label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setEditCustomerCommandOpen(true)}
                >
                  {editForm.customerId
                    ? (customers.find(c => c._id === editForm.customerId)?.name + (customers.find(c => c._id === editForm.customerId)?.phone ? ` (${customers.find(c => c._id === editForm.customerId)?.phone})` : ''))
                    : 'Select customer'}
                </Button>
              </div>
              <div>
                <label className="block mb-1 font-medium">Trainer</label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setEditTrainerCommandOpen(true)}
                >
                  {editForm.trainerId
                    ? (trainers.find(t => t._id === editForm.trainerId)?.name + (trainers.find(t => t._id === editForm.trainerId)?.email ? ` (${trainers.find(t => t._id === editForm.trainerId)?.email})` : ''))
                    : 'Select trainer'}
                </Button>
              </div>
              <div>
                <label className="block mb-1 font-medium">Start Date</label>
                <Input type="date" name="startDate" value={editForm.startDate} onChange={handleEditChange} required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Duration (months)</label>
                <Input type="number" name="duration" value={editForm.duration} min={1} onChange={handleEditChange} required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Fees</label>
                <Input type="number" name="fees" value={editForm.fees} min={0} onChange={handleEditChange} required />
              </div>
              <div>
                <Button type="submit" className="w-full">Update Assignment</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Command Dialog */}
      <CommandDialog open={editCustomerCommandOpen} onOpenChange={setEditCustomerCommandOpen}>
        <DialogTitle asChild>
          <VisuallyHidden>Choose a customer for editing</VisuallyHidden>
        </DialogTitle>
        <Command>
          <CommandInput placeholder="Search customer by name or phone..." />
          <CommandList>
            <CommandEmpty>No customers found.</CommandEmpty>
            {customers.map(c => (
              <CommandItem
                key={c._id}
                value={c.name + (c.phone ? ` ${c.phone}` : '')}
                onSelect={() => {
                  handleEditSelect('customerId', c._id);
                  setEditCustomerCommandOpen(false);
                }}
              >
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>

      {/* Edit Trainer Command Dialog */}
      <CommandDialog open={editTrainerCommandOpen} onOpenChange={setEditTrainerCommandOpen}>
        <DialogTitle asChild>
          <VisuallyHidden>Choose a trainer for editing</VisuallyHidden>
        </DialogTitle>
        <Command>
          <CommandInput placeholder="Search trainer by name or email..." />
          <CommandList>
            <CommandEmpty>No trainers found.</CommandEmpty>
            {trainers.map(t => (
              <CommandItem
                key={t._id}
                value={t.name + (t.email ? ` ${t.email}` : '')}
                onSelect={() => {
                  handleEditSelect('trainerId', t._id);
                  setEditTrainerCommandOpen(false);
                }}
              >
                {t.name} {t.email ? `(${t.email})` : ''}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>

      {/* Renew Assignment Modal */}
      {renewAssignment && (
        <RenewPersonalTrainingModal
          isOpen={isRenewModalOpen}
          onClose={() => {
            setIsRenewModalOpen(false);
            setRenewAssignment(null);
          }}
          assignment={renewAssignment}
          membershipEndDate={customers.find(c => c._id === renewAssignment.customerId._id)?.membershipEndDate}
          onRenewed={async () => {
            // Refresh assignments after renewal
            const res = await axios.get(`/personal-training?gymId=${gymId}`);
            setAssignments(Array.isArray(res.data) ? res.data : res.data.assignments || []);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default PersonalTrainingPage;