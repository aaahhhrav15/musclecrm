import React, { useState } from 'react';
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

// Mock data for members
const members = [
  { id: 1, name: 'John Smith', status: 'Active', memberSince: '2024-12-10', expiryDate: '2025-12-10', type: 'Gold', plan: 'Annual', paymentStatus: 'Paid' },
  { id: 2, name: 'Alice Johnson', status: 'Active', memberSince: '2025-01-15', expiryDate: '2025-07-15', type: 'Silver', plan: 'Semi-annual', paymentStatus: 'Paid' },
  { id: 3, name: 'Robert Brown', status: 'Expiring Soon', memberSince: '2024-08-20', expiryDate: '2025-06-01', type: 'Gold', plan: 'Annual', paymentStatus: 'Paid' },
  { id: 4, name: 'Emma Wilson', status: 'Trial', memberSince: '2025-05-15', expiryDate: '2025-05-22', type: 'Basic', plan: 'Trial', paymentStatus: 'Free' },
  { id: 5, name: 'Michael Davis', status: 'Expired', memberSince: '2024-11-05', expiryDate: '2025-05-05', type: 'Silver', plan: 'Semi-annual', paymentStatus: 'Overdue' },
  { id: 6, name: 'Sarah Garcia', status: 'Active', memberSince: '2025-03-10', expiryDate: '2026-03-10', type: 'Platinum', plan: 'Annual', paymentStatus: 'Paid' },
];

const MembersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  
  // Filter members based on the active tab
  const filteredMembers = members.filter(member => {
    switch (activeTab) {
      case 'active':
        return member.status === 'Active';
      case 'expiring':
        return member.status === 'Expiring Soon';
      case 'trial':
        return member.status === 'Trial';
      case 'expired':
        return member.status === 'Expired';
      default:
        return true;
    }
  });
  
  const handleShowQRCode = (member: any) => {
    setSelectedMember({
      id: member._id,
      name: member.name
    });
    setShowQRCode(true);
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
                  <TableRow key={member.id}>
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
              <p className="text-sm text-muted-foreground">Due for Renewal</p>
            </div>
          </div>
          <div className="bg-background border rounded-lg p-4 flex items-center gap-4">
            <div className="bg-destructive/10 p-3 rounded-full">
              <UserMinus className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{members.filter(m => m.status === 'Expired').length}</h3>
              <p className="text-sm text-muted-foreground">Expired</p>
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
