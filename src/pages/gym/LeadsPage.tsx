import React from 'react';
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

// Mock data for leads
const leads = [
  { id: 1, name: 'Thomas Wilson', phone: '555-123-4567', email: 'thomas@example.com', source: 'Website', status: 'New', followUpDate: '2025-05-25', lastContact: '2025-05-20', notes: 'Interested in annual membership' },
  { id: 2, name: 'Laura Smith', phone: '555-987-6543', email: 'laura@example.com', source: 'Referral', status: 'Contacted', followUpDate: '2025-05-26', lastContact: '2025-05-19', notes: 'Wants information about personal training' },
  { id: 3, name: 'Alex Johnson', phone: '555-567-8901', email: 'alex@example.com', source: 'Walk-in', status: 'Meeting Scheduled', followUpDate: '2025-05-27', lastContact: '2025-05-18', notes: 'Scheduled for gym tour tomorrow' },
  { id: 4, name: 'Emily Brown', phone: '555-234-5678', email: 'emily@example.com', source: 'Social Media', status: 'Interested', followUpDate: '2025-05-28', lastContact: '2025-05-17', notes: 'Looking for family membership options' },
  { id: 5, name: 'Daniel Lee', phone: '555-876-5432', email: 'daniel@example.com', source: 'Google', status: 'Negotiation', followUpDate: '2025-05-29', lastContact: '2025-05-16', notes: 'Discussing corporate membership for small team' },
  { id: 6, name: 'Sophia Garcia', phone: '555-345-6789', email: 'sophia@example.com', source: 'Promotion', status: 'Closed', followUpDate: '2025-06-01', lastContact: '2025-05-15', notes: 'Signed up for 6-month membership' },
];

// Lead statistics
const leadStats = {
  total: leads.length,
  new: leads.filter(l => l.status === 'New').length,
  contacted: leads.filter(l => l.status === 'Contacted').length,
  interested: leads.filter(l => l.status === 'Interested').length,
  negotiation: leads.filter(l => l.status === 'Negotiation').length,
  closed: leads.filter(l => l.status === 'Closed').length,
  conversion: Math.round((leads.filter(l => l.status === 'Closed').length / leads.length) * 100),
};

const LeadsPage: React.FC = () => {
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
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Lead
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" /> Create Form
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
                {leadStats.contacted + leadStats.interested + leadStats.negotiation}
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
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="contacted">Contacted</TabsTrigger>
            <TabsTrigger value="meeting">Meeting</TabsTrigger>
            <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">{lead.source}</TableCell>
                    <TableCell>
                      <Badge variant={
                        lead.status === 'New' ? 'secondary' :
                        lead.status === 'Contacted' ? 'default' :
                        lead.status === 'Meeting Scheduled' ? 'outline' :
                        lead.status === 'Interested' ? 'default' :
                        lead.status === 'Negotiation' ? 'destructive' : 'secondary'
                      }>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.followUpDate}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost">
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                            <DropdownMenuItem>Set Follow-up</DropdownMenuItem>
                            <DropdownMenuItem>Change Status</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Closed</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="new">
            {/* Similar table for new leads */}
            <div className="p-8 text-center text-muted-foreground">
              Filter for new leads will be shown here.
            </div>
          </TabsContent>
          <TabsContent value="contacted">
            <div className="p-8 text-center text-muted-foreground">
              Filter for contacted leads will be shown here.
            </div>
          </TabsContent>
          <TabsContent value="meeting">
            <div className="p-8 text-center text-muted-foreground">
              Filter for leads with scheduled meetings will be shown here.
            </div>
          </TabsContent>
          <TabsContent value="negotiation">
            <div className="p-8 text-center text-muted-foreground">
              Filter for leads in negotiation phase will be shown here.
            </div>
          </TabsContent>
          <TabsContent value="closed">
            <div className="p-8 text-center text-muted-foreground">
              Filter for closed leads will be shown here.
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default LeadsPage;
