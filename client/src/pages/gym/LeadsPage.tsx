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
  MoreHorizontal
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
import axios from '@/lib/axios';
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

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
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
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleOpenModal = (lead = null) => {
    setEditingLead(lead);
    setForm(lead ? { ...lead, followUpDate: lead.followUpDate ? lead.followUpDate.slice(0, 10) : '' } : { name: '', phone: '', source: '', status: 'New', followUpDate: '', notes: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLead(null);
    setForm({ name: '', phone: '', source: '', status: 'New', followUpDate: '', notes: '' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await axios.put(`/leads/${editingLead._id}`, form);
      } else {
        await axios.post('/leads', form);
      }
      fetchLeads();
      handleCloseModal();
    } catch (err) {
      setError('Failed to save lead');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/leads/${id}`);
      fetchLeads();
      setDeleteLeadId(null);
    } catch (err) {
      setError('Failed to delete lead');
    }
  };

  // Lead statistics
  const leadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    interested: leads.filter(l => l.status === 'Interested').length,
    negotiation: leads.filter(l => l.status === 'Negotiation').length,
    closed: leads.filter(l => l.status === 'Closed').length,
    conversion: leads.length ? Math.round((leads.filter(l => l.status === 'Closed').length / leads.length) * 100) : 0,
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lead Management</h1>
            <p className="text-muted-foreground">
              Manage your leads and sales funnel.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" /> New Lead
            </Button>
          </div>
        </div>

        {/* Lead Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">{leadStats.total}</div>
              <p className="text-xs text-muted-foreground">All time leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">{leadStats.new}</div>
              <p className="text-xs text-muted-foreground">Require initial contact</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">
                {leadStats.contacted + leadStats.negotiation}
              </div>
              <p className="text-xs text-muted-foreground">Actively engaged leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">{leadStats.conversion}%</div>
              <p className="text-xs text-muted-foreground">Closed vs total leads</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="contacted">Contacted</TabsTrigger>
            <TabsTrigger value="meeting">Meeting</TabsTrigger>
            <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="border rounded-md">
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead className="hidden md:table-cell">Notes</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads
                    .filter(lead => {
                      if (activeTab === 'all') return true;
                      if (activeTab === 'new') return lead.status === 'New';
                      if (activeTab === 'contacted') return lead.status === 'Contacted';
                      if (activeTab === 'meeting') return lead.status === 'Meeting Scheduled';
                      if (activeTab === 'negotiation') return lead.status === 'Negotiation';
                      if (activeTab === 'closed') return lead.status === 'Closed';
                      return true;
                    })
                    .filter(lead => lead.name.toLowerCase().includes(search.toLowerCase()))
                    .map(lead => (
                      <TableRow key={lead._id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
                        <TableCell className="hidden md:table-cell">{lead.source}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              lead.status === 'New' ? 'secondary'
                              : lead.status === 'Contacted' ? 'default'
                              : lead.status === 'Meeting Scheduled' ? 'outline'
                              : lead.status === 'Negotiation' ? 'destructive'
                              : lead.status === 'Closed' ? 'default'
                              : 'secondary'
                            }
                            className={lead.status === 'Closed' ? 'bg-green-600 text-white' : ''}
                          >
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{lead.followUpDate ? lead.followUpDate.slice(0, 10) : ''}</TableCell>
                        <TableCell className="hidden md:table-cell">{lead.notes}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenModal(lead)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteLeadId(lead._id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
      {/* Modal for add/edit lead */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold mb-2">{editingLead ? 'Edit Lead' : 'Add Lead'}</h2>
            <div>
              <label className="block mb-1">Name</label>
              <Input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1">Phone</label>
              <Input name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1">Source</label>
              <Input name="source" value={form.source} onChange={handleChange} />
            </div>
            <div>
              <label className="block mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-2 py-1">
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Follow-up Date</label>
              <Input type="date" name="followUpDate" value={form.followUpDate} onChange={handleChange} />
            </div>
            <div>
              <label className="block mb-1">Notes</label>
              <Input name="notes" value={form.notes} onChange={handleChange} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit">{editingLead ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </div>
      )}
      {deleteLeadId && (
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
              <AlertDialogAction onClick={() => handleDelete(deleteLeadId)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </DashboardLayout>
  );
};

export default LeadsPage;
