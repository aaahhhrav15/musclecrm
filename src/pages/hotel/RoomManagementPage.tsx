
import React from 'react';
import { motion } from 'framer-motion';
import { Hotel, Plus, Search, Filter } from 'lucide-react';
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

// Mock data for rooms
const rooms = [
  { 
    id: 101, 
    type: 'Standard Queen', 
    status: 'Occupied',
    guest: 'Alice Johnson',
    checkIn: '2025-05-18',
    checkOut: '2025-05-21',
    price: '$120/night',
    cleaned: true
  },
  { 
    id: 102, 
    type: 'Standard Queen', 
    status: 'Available',
    guest: null,
    checkIn: null,
    checkOut: null,
    price: '$120/night',
    cleaned: true
  },
  { 
    id: 103, 
    type: 'Standard Twin', 
    status: 'Available',
    guest: null,
    checkIn: null,
    checkOut: null,
    price: '$135/night',
    cleaned: false
  },
  { 
    id: 201, 
    type: 'Deluxe King', 
    status: 'Occupied',
    guest: 'Bob Smith',
    checkIn: '2025-05-15',
    checkOut: '2025-05-22',
    price: '$180/night',
    cleaned: true
  },
  { 
    id: 202, 
    type: 'Deluxe King', 
    status: 'Reserved',
    guest: 'Carol Davis',
    checkIn: '2025-05-21',
    checkOut: '2025-05-23',
    price: '$180/night',
    cleaned: true
  },
  { 
    id: 301, 
    type: 'Suite', 
    status: 'Maintenance',
    guest: null,
    checkIn: null,
    checkOut: null,
    price: '$250/night',
    cleaned: false
  },
];

const RoomManagementPage: React.FC = () => {
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
            <h1 className="text-2xl font-bold tracking-tight">Room Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage all rooms in your property.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Room
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
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
                <TableHead>Room</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Cleaned</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.id}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>
                    <Badge variant={
                      room.status === 'Available' 
                        ? 'default' 
                        : room.status === 'Occupied' 
                        ? 'secondary' 
                        : room.status === 'Reserved'
                        ? 'outline'
                        : 'destructive'
                    }>
                      {room.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{room.guest || '-'}</TableCell>
                  <TableCell>{room.checkIn || '-'}</TableCell>
                  <TableCell>{room.checkOut || '-'}</TableCell>
                  <TableCell>{room.price}</TableCell>
                  <TableCell>
                    {room.cleaned ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                        Clean
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
                        Pending
                      </span>
                    )}
                  </TableCell>
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

export default RoomManagementPage;
