import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  MessageSquare, 
  PhoneCall,
  Calendar,
  MoreHorizontal,
  Download,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Users,
  Target,
  Phone,
  Mail,
  CalendarDays,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';
import { API_URL } from '@/config';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as Papa from 'papaparse';
import { toast } from 'sonner';

interface Lead {
  _id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  followUpDate?: string;
  notes: string;
  createdAt: string;
}

const LeadsPage: React.FC = () => {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', source: '', status: 'New', followUpDate: '', notes: '' });
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [phoneError, setPhoneError] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Fetch all leads without pagination limit
      const res = await axios.get(`${API_URL}/leads`, {
        params: {
          page: 1,
          limit: 10000 // Large enough to get all leads
        },
        withCredentials: true
      });
      setAllLeads(res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch leads');
      toast.error('Failed to fetch leads');
      setAllLeads([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Calculate lead insights from all leads
  const leadInsights = useMemo(() => {
    if (!allLeads.length) return {
      totalLeads: 0,
      newLeads: 0,
      contactedLeads: 0,
      interestedLeads: 0,
      negotiationLeads: 0,
      notInterestedLeads: 0,
      closedLeads: 0,
      followUpsDue: 0,
      todayLeads: 0,
      conversionRate: 0
    };

    const today = new Date().toISOString().split('T')[0];
    
    const insights = {
      totalLeads: allLeads.length,
      newLeads: allLeads.filter(l => l.status === 'New').length,
      contactedLeads: allLeads.filter(l => l.status === 'Contacted').length,
      interestedLeads: allLeads.filter(l => l.status === 'Interested').length,
      negotiationLeads: allLeads.filter(l => l.status === 'Negotiation').length,
      notInterestedLeads: allLeads.filter(l => l.status === 'Not Interested').length,
      closedLeads: allLeads.filter(l => l.status === 'Closed').length,
      followUpsDue: allLeads.filter(l => l.followUpDate && l.followUpDate.slice(0, 10) <= today && l.status !== 'Closed' && l.status !== 'Not Interested').length,
      todayLeads: allLeads.filter(l => l.createdAt && l.createdAt.slice(0, 10) === today).length,
      conversionRate: 0
    };

    insights.conversionRate = insights.totalLeads > 0 
      ? Math.round((insights.closedLeads / insights.totalLeads) * 100)
      : 0;

    return insights;
  }, [allLeads]);

  // Enhanced search functionality with memoization
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return allLeads;
    
    const query = searchQuery.toLowerCase().trim();
    return allLeads.filter(lead => {
      const name = lead.name?.toLowerCase() || '';
      const phone = lead.phone?.toLowerCase() || '';
      const source = lead.source?.toLowerCase() || '';
      const status = lead.status?.toLowerCase() || '';
      const notes = lead.notes?.toLowerCase() || '';
      
      return name.includes(query) || 
             phone.includes(query) || 
             source.includes(query) ||
             status.includes(query) ||
             notes.includes(query);
    });
  }, [allLeads, searchQuery]);

  // Filter by tab with memoization
  const tabFilteredLeads = useMemo(() => {
    let filtered = filteredLeads;
    
    switch (activeTab) {
      case 'new':
        filtered = filtered.filter(l => l.status === 'New');
        break;
      case 'contacted':
        filtered = filtered.filter(l => l.status === 'Contacted');
        break;
      case 'interested':
        filtered = filtered.filter(l => l.status === 'Interested');
        break;
      case 'negotiation':
        filtered = filtered.filter(l => l.status === 'Negotiation');
        break;
      case 'not-interested':
        filtered = filtered.filter(l => l.status === 'Not Interested');
        break;
      case 'closed':
        filtered = filtered.filter(l => l.status === 'Closed');
        break;
      default:
        break;
    }
    
    return filtered;
  }, [filteredLeads, activeTab]);

  // Pagination calculations
  const totalLeads = tabFilteredLeads.length;
  const totalPages = Math.ceil(totalLeads / rowsPerPage);
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalLeads);
  
  // Get current page data
  const currentPageLeads = tabFilteredLeads.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Generate page numbers for pagination
  const getPageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [totalPages, currentPage]);

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleOpenModal = (lead: Lead | null = null) => {
    setEditingLead(lead);
    setForm(lead ? { ...lead, followUpDate: lead.followUpDate ? lead.followUpDate.slice(0, 10) : '' } : { name: '', phone: '', source: '', status: 'New', followUpDate: '', notes: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLead(null);
    setForm({ name: '', phone: '', source: '', status: 'New', followUpDate: '', notes: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Validate phone number: exactly 10 digits, cannot start with 0
      if (!/^[1-9][0-9]{0,9}$/.test(value)) {
        if (value.length > 0 && value[0] === '0') {
          setPhoneError('Phone number cannot start with 0');
        } else if (value.length > 10) {
          setPhoneError('Phone number cannot be more than 10 digits');
        } else if (value.length < 10 && value.length > 0) {
          setPhoneError('Phone number must be exactly 10 digits');
        } else {
          setPhoneError('Invalid phone number');
        }
      } else {
        setPhoneError('');
      }
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Final phone validation before submit
    if (!/^[1-9][0-9]{9}$/.test(form.phone)) {
      if (form.phone.length > 0 && form.phone[0] === '0') {
        setPhoneError('Phone number cannot start with 0');
      } else if (form.phone.length > 10) {
        setPhoneError('Phone number cannot be more than 10 digits');
      } else if (form.phone.length < 10) {
        setPhoneError('Phone number must be exactly 10 digits');
      } else {
        setPhoneError('Invalid phone number');
      }
      return;
    }
    setPhoneError('');
    try {
      if (editingLead) {
        await axios.put(`${API_URL}/leads/${editingLead._id}`, form, { withCredentials: true });
        toast.success('Lead updated successfully');
      } else {
        await axios.post(`${API_URL}/leads`, form, { withCredentials: true });
        toast.success('Lead created successfully');
      }
      fetchLeads();
      handleCloseModal();
    } catch (err) {
      const errorMessage = 'Failed to save lead';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/leads/${id}`, { withCredentials: true });
      fetchLeads();
      setDeleteLeadId(null);
      toast.success('Lead deleted successfully');
    } catch (err) {
      setError('Failed to delete lead');
      toast.error('Failed to delete lead');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800';
      case 'Interested': return 'bg-purple-100 text-purple-800';
      case 'Negotiation': return 'bg-orange-100 text-orange-800';
      case 'Not Interested': return 'bg-red-100 text-red-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New': return <UserPlus className="h-3 w-3" />;
      case 'Contacted': return <Phone className="h-3 w-3" />;
      case 'Interested': return <MessageSquare className="h-3 w-3" />;
      case 'Negotiation': return <TrendingUp className="h-3 w-3" />;
      case 'Not Interested': return <X className="h-3 w-3" />;
      case 'Closed': return <CheckCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const handleExport = () => {
    if (!tabFilteredLeads || tabFilteredLeads.length === 0) {
      toast("No data to export.");
      return;
    }

    const dataToExport = tabFilteredLeads.map(lead => ({
      "Name": lead.name,
      "Phone": lead.phone,
      "Source": lead.source,
      "Status": lead.status,
      "Follow-up Date": lead.followUpDate ? format(new Date(lead.followUpDate), 'yyyy-MM-dd') : '',
      "Notes": lead.notes,
      "Created Date": format(new Date(lead.createdAt), 'yyyy-MM-dd')
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Lead data exported successfully!");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Lead Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your sales funnel and convert prospects into customers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Lead Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-blue-700">{leadInsights.totalLeads}</div>
                <p className="text-xs text-muted-foreground">All prospects</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Leads</CardTitle>
                <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-yellow-700">{leadInsights.newLeads}</div>
                <p className="text-xs text-muted-foreground">Need contact</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-purple-700">
                  {leadInsights.contactedLeads + leadInsights.interestedLeads + leadInsights.negotiationLeads}
                </div>
                <p className="text-xs text-muted-foreground">Active leads</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-green-700">{leadInsights.closedLeads}</div>
                <p className="text-xs text-muted-foreground">Converted</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-orange-700">{leadInsights.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">Success rate</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats & Search Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, phone, source, or status..."
                className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Follow-ups Due</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{leadInsights.followUpsDue}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Today's Leads</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{leadInsights.todayLeads}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leads Table with Tabs */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Lead Directory</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {startItem}-{endItem} of {totalLeads}
                </span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => {
                    setRowsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6 pt-6">
                <TabsList className="grid grid-cols-7 bg-muted/50">
                  <TabsTrigger value="all">All ({allLeads.length})</TabsTrigger>
                  <TabsTrigger value="new">New ({leadInsights.newLeads})</TabsTrigger>
                  <TabsTrigger value="contacted">Contacted ({leadInsights.contactedLeads})</TabsTrigger>
                  <TabsTrigger value="interested">Interested ({leadInsights.interestedLeads})</TabsTrigger>
                  <TabsTrigger value="negotiation">Negotiation ({leadInsights.negotiationLeads})</TabsTrigger>
                  <TabsTrigger value="not-interested">Not Interested ({leadInsights.notInterestedLeads})</TabsTrigger>
                  <TabsTrigger value="closed">Closed ({leadInsights.closedLeads})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                <div className="overflow-x-auto">
                  {error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-muted/50">
                          <TableHead className="font-semibold">Lead</TableHead>
                          <TableHead className="font-semibold">Contact</TableHead>
                          <TableHead className="font-semibold">Source</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Follow-up</TableHead>
                          <TableHead className="font-semibold">Notes</TableHead>
                          <TableHead className="font-semibold w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPageLeads.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center space-y-2">
                                <Target className="h-12 w-12 text-muted-foreground/50" />
                                <div className="text-lg font-medium">
                                  {searchQuery ? 'No leads found matching your search.' : 'No leads found.'}
                                </div>
                                <p className="text-sm">Add new leads to start tracking your sales funnel</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentPageLeads.map((lead, index) => (
                            <motion.tr
                              key={lead._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium">{lead.name}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center text-sm">
                                    <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                                    {lead.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{lead.source}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(lead.status)}
                                  <Badge className={getStatusColor(lead.status)}>
                                    {lead.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {lead.followUpDate ? format(new Date(lead.followUpDate), 'MMM d, yyyy') : 'No follow-up'}
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-48">
                                <div className="truncate">{lead.notes || 'No notes'}</div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleOpenModal(lead)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Lead
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => setDeleteLeadId(lead._id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Lead
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startItem} to {endItem} of {totalLeads} leads
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {getPageNumbers.map((page, index) => (
                    <React.Fragment key={index}>
                      {page === '...' ? (
                        <span className="px-2 py-1 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Lead Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name *</label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter lead name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone *</label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              {phoneError && (
                <p className="text-sm text-red-500 mt-1">{phoneError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="source" className="text-sm font-medium">Source</label>
              <Input
                id="source"
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="e.g., Website, Referral, Social Media"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="followUpDate" className="text-sm font-medium">Follow-up Date</label>
              <Input
                id="followUpDate"
                name="followUpDate"
                type="date"
                value={form.followUpDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add any notes about this lead..."
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLead ? 'Update Lead' : 'Add Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLeadId} onOpenChange={() => setDeleteLeadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLeadId && handleDelete(deleteLeadId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default LeadsPage;