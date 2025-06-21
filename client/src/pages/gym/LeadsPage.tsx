import React, { useEffect, useState } from 'react';
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
  AlertCircle
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import axios from '@/lib/axios';
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', source: '', status: 'New', followUpDate: '', notes: '' });
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/leads');
      setLeads(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch leads');
      toast.error('Failed to fetch leads');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Calculate lead insights
  const leadInsights = React.useMemo(() => {
    if (!leads.length) return {
      totalLeads: 0,
      newLeads: 0,
      contactedLeads: 0,
      interestedLeads: 0,
      negotiationLeads: 0,
      closedLeads: 0,
      followUpsDue: 0,
      todayLeads: 0
    };

    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'New').length,
      contactedLeads: leads.filter(l => l.status === 'Contacted').length,
      interestedLeads: leads.filter(l => l.status === 'Interested').length,
      negotiationLeads: leads.filter(l => l.status === 'Negotiation').length,
      closedLeads: leads.filter(l => l.status === 'Closed').length,
      followUpsDue: leads.filter(l => l.followUpDate && l.followUpDate.slice(0, 10) <= today && l.status !== 'Closed').length,
      todayLeads: leads.filter(l => l.createdAt && l.createdAt.slice(0, 10) === today).length
    };
  }, [leads]);

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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await axios.put(`/leads/${editingLead._id}`, form);
        toast.success('Lead updated successfully');
      } else {
        await axios.post('/leads', form);
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
      await axios.delete(`/leads/${id}`);
      fetchLeads();
      setDeleteLeadId(null);
      toast.success('Lead deleted successfully');
    } catch (err) {
      setError('Failed to delete lead');
      toast.error('Failed to delete lead');
    }
  };

  // Filter leads based on search and tab
  const filteredLeads = leads
    .filter(lead => {
      if (activeTab === 'all') return true;
      if (activeTab === 'new') return lead.status === 'New';
      if (activeTab === 'contacted') return lead.status === 'Contacted';
      if (activeTab === 'negotiation') return lead.status === 'Negotiation';
      if (activeTab === 'closed') return lead.status === 'Closed';
      return true;
    })
    .filter(lead => lead.name.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800';
      case 'Negotiation': return 'bg-orange-100 text-orange-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New': return <UserPlus className="h-3 w-3" />;
      case 'Contacted': return <Phone className="h-3 w-3" />;
      case 'Negotiation': return <MessageSquare className="h-3 w-3" />;
      case 'Closed': return <CheckCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const handleExport = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast("No data to export.");
      return;
    }

    const dataToExport = filteredLeads.map(lead => ({
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
          <div className="flex gap-3">
            <Button onClick={() => handleOpenModal()} size="lg" className="shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> New Lead
            </Button>
            <Button variant="outline" size="lg" className="shadow-sm" onClick={handleExport}>
              <Download className="mr-2 h-5 w-5" /> Export Data
            </Button>
          </div>
        </div>

        {/* Sales Funnel Overview - Vertical Layout */}
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
                <div className="text-2xl font-bold">{leadInsights.totalLeads}</div>
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
                <div className="text-2xl font-bold">{leadInsights.newLeads}</div>
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
                <div className="text-2xl font-bold">
                  {leadInsights.contactedLeads + leadInsights.negotiationLeads}
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
                <div className="text-2xl font-bold">{leadInsights.closedLeads}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Rate</CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">
                  {leadInsights.totalLeads > 0 
                    ? Math.round(((leadInsights.totalLeads - leadInsights.closedLeads) / leadInsights.totalLeads) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Still active</p>
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
                placeholder="Search leads by name, phone, or source..."
                className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
                value={search}
                onChange={e => setSearch(e.target.value)}
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

        {/* Funnel Progress Visualization */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Sales Funnel Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'New', count: leadInsights.newLeads, color: 'bg-blue-500' },
                { label: 'Contacted', count: leadInsights.contactedLeads, color: 'bg-yellow-500' },
                { label: 'Negotiation', count: leadInsights.negotiationLeads, color: 'bg-orange-500' },
                { label: 'Closed', count: leadInsights.closedLeads, color: 'bg-green-500' }
              ].map((stage, index) => (
                <div key={stage.label} className="text-center">
                  <div className="text-sm font-medium mb-2">{stage.label}</div>
                  <div className={`h-20 ${stage.color} rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                    {stage.count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {leadInsights.totalLeads > 0 ? Math.round((stage.count / leadInsights.totalLeads) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leads Table with Tabs */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Lead Directory</CardTitle>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {filteredLeads?.length || 0} leads
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6 pt-6">
                <TabsList className="grid grid-cols-5 bg-muted/50">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="contacted">Contacted</TabsTrigger>
                  <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
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
                        {filteredLeads.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center space-y-2">
                                <Target className="h-12 w-12 text-muted-foreground/50" />
                                <div className="text-lg font-medium">
                                  {search ? 'No leads found matching your search.' : 'No leads found.'}
                                </div>
                                <p className="text-sm">Add new leads to start tracking your sales funnel</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredLeads.map((lead, index) => (
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
                                {lead.followUpDate ? format(new Date(lead.followUpDate), 'MMM d, yyyy') : '-'}
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-32 truncate">
                                {lead.notes || '-'}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
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
        </Card>
      </motion.div>

      {/* Lead Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <Input name="source" value={form.source} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                name="status" 
                value={form.status} 
                onChange={handleChange} 
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Follow-up Date</label>
              <Input type="date" name="followUpDate" value={form.followUpDate} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea 
                name="notes" 
                value={form.notes} 
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 bg-background min-h-[80px]"
                placeholder="Add notes about this lead..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLeadId} onOpenChange={open => !open && setDeleteLeadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteLeadId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLeadId && handleDelete(deleteLeadId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default LeadsPage;