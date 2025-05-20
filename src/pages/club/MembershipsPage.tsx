
import React from 'react';
import { motion } from 'framer-motion';
import { GlassWater, Plus, Search, Filter } from 'lucide-react';
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
  Badge
} from '@/components/ui/badge';

// Mock data for memberships
const memberships = [
  { 
    id: 1, 
    member: 'Alice Johnson', 
    type: 'Premium',
    status: 'Active',
    startDate: '2024-01-15',
    endDate: '2025-01-15',
    paymentStatus: 'Paid',
    lastVisit: '2025-05-18'
  },
  { 
    id: 2, 
    member: 'Bob Smith', 
    type: 'Standard',
    status: 'Active',
    startDate: '2025-03-01',
    endDate: '2026-03-01',
    paymentStatus: 'Paid',
    lastVisit: '2025-05-10'
  },
  { 
    id: 3, 
    member: 'Carol Davis', 
    type: 'Premium',
    status: 'Expiring',
    startDate: '2024-06-15',
    endDate: '2025-06-15',
    paymentStatus: 'Paid',
    lastVisit: '2025-05-19'
  },
  { 
    id: 4, 
    member: 'David Wilson', 
    type: 'VIP',
    status: 'Active',
    startDate: '2025-02-10',
    endDate: '2026-02-10',
    paymentStatus: 'Paid',
    lastVisit: '2025-05-17'
  },
  { 
    id: 5, 
    member: 'Eve Brown', 
    type: 'Standard',
    status: 'Inactive',
    startDate: '2024-10-01',
    endDate: '2025-04-01',
    paymentStatus: 'Overdue',
    lastVisit: '2025-03-25'
  },
];

const MembershipsPage: React.FC = () => {
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
            <h1 className="text-2xl font-bold tracking-tight">Memberships</h1>
            <p className="text-muted-foreground">
              Manage club memberships and member information.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Button>
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Membership Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((membership) => (
                <TableRow key={membership.id}>
                  <TableCell className="font-medium">{membership.member}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      membership.type === 'Premium' 
                        ? 'bg-purple-100 text-purple-800' 
                        : membership.type === 'VIP'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {membership.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      membership.status === 'Active' 
                        ? 'default' 
                        : membership.status === 'Expiring' 
                        ? 'secondary' 
                        : 'destructive'
                    }>
                      {membership.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{membership.startDate}</TableCell>
                  <TableCell>{membership.endDate}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      membership.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {membership.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell>{membership.lastVisit}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MembershipsPage;
