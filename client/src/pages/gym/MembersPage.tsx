import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, RefreshCw, UserMinus, Search, Filter, Bell, MoreHorizontal } from 'lucide-react';
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
import MemberQRCode from '@/components/attendance/MemberQRCode';
import axios from 'axios';
import { API_URL } from '@/config';
import { toast } from 'sonner';

interface Member {
  _id: string;
  name: string;
  status: 'Active' | 'Expiring Soon' | 'Trial' | 'Expired';
  memberSince: string;
  expiryDate: string;
  type: string;
  plan: string;
  paymentStatus: 'Paid' | 'Free' | 'Overdue';
}

const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/members`, {
        withCredentials: true
      });
      setMembers(response.data.members);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter members based on the active tab and search query
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || member.status.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });
  
  const handleShowQRCode = (member: Member) => {
    setSelectedMember({
      id: member._id,
      name: member.name
    });
    setShowQRCode(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  }
  
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
            <h1 className="text-2xl font-bold tracking-tight">Member Management</h1>
            <p className="text-muted-foreground">
              Manage your gym members, renewals, and trials.
            </p>
          </div>
          <div className="flex gap-2">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> New Member
            </Button>
            <Button variant="outline">
              <Bell className="mr-2 h-4 w-4" /> Send Reminder
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">All Members</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
            <TabsTrigger value="trial">Trial</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Member Since</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map(member => (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        member.status === 'Active' ? 'default' :
                        member.status === 'Trial' ? 'secondary' :
                        member.status === 'Expiring Soon' ? 'destructive' : 'destructive'
                      }>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{member.memberSince}</TableCell>
                    <TableCell>{member.expiryDate}</TableCell>
                    <TableCell className="hidden md:table-cell">{member.type}</TableCell>
                    <TableCell>{member.plan}</TableCell>
                    <TableCell>
                      <Badge variant={
                        member.paymentStatus === 'Paid' ? 'default' :
                        member.paymentStatus === 'Free' ? 'secondary' : 'destructive'
                      }>
                        {member.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleShowQRCode(member)}>
                            Generate QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Member</DropdownMenuItem>
                          <DropdownMenuItem>Process Renewal</DropdownMenuItem>
                          <DropdownMenuItem>View Attendance</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background border rounded-lg p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{members.filter(m => m.status === 'Active').length}</h3>
              <p className="text-sm text-muted-foreground">Active Members</p>
            </div>
          </div>
          <div className="bg-background border rounded-lg p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{members.filter(m => m.status === 'Trial').length}</h3>
              <p className="text-sm text-muted-foreground">Trial Members</p>
            </div>
          </div>
          <div className="bg-background border rounded-lg p-4 flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-full">
              <RefreshCw className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{members.filter(m => m.status === 'Expiring Soon').length}</h3>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </div>
          <div className="bg-background border rounded-lg p-4 flex items-center gap-4">
            <div className="bg-destructive/10 p-3 rounded-full">
              <UserMinus className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{members.filter(m => m.status === 'Expired').length}</h3>
              <p className="text-sm text-muted-foreground">Expired Members</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add QR Code Modal */}
      {selectedMember && (
        <MemberQRCode
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
          memberId={selectedMember.id}
          memberName={selectedMember.name}
        />
      )}
    </DashboardLayout>
  );
};

export default MembersPage;
