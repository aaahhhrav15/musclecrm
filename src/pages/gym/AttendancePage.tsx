
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Fingerprint, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle,
  ArrowUpDown,
  Users,
  User
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data for attendance
const todaysAttendance = [
  { id: 1, name: 'John Smith', type: 'Member', checkInTime: '08:15 AM', checkOutTime: '09:45 AM', duration: '1h 30m', status: 'Checked Out' },
  { id: 2, name: 'Sarah Williams', type: 'Staff', checkInTime: '07:30 AM', checkOutTime: '', duration: '-', status: 'Checked In' },
  { id: 3, name: 'Robert Brown', type: 'Member', checkInTime: '09:20 AM', checkOutTime: '10:50 AM', duration: '1h 30m', status: 'Checked Out' },
  { id: 4, name: 'James Martinez', type: 'Staff', checkInTime: '08:00 AM', checkOutTime: '', duration: '-', status: 'Checked In' },
  { id: 5, name: 'Emma Wilson', type: 'Member', checkInTime: '10:15 AM', checkOutTime: '', duration: '-', status: 'Checked In' },
  { id: 6, name: 'Michael Davis', type: 'Member', checkInTime: '06:45 AM', checkOutTime: '08:15 AM', duration: '1h 30m', status: 'Checked Out' },
  { id: 7, name: 'Lisa Thompson', type: 'Staff', checkInTime: '09:00 AM', checkOutTime: '', duration: '-', status: 'Checked In' },
];

// Mock attendance statistics
const attendanceStats = {
  totalToday: todaysAttendance.length,
  currentlyIn: todaysAttendance.filter(a => a.status === 'Checked In').length,
  membersToday: todaysAttendance.filter(a => a.type === 'Member').length,
  staffToday: todaysAttendance.filter(a => a.type === 'Staff').length,
};

const AttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('today');

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
            <h1 className="text-2xl font-bold tracking-tight">Attendance System</h1>
            <p className="text-muted-foreground">
              Track and manage gym attendance for members and staff.
            </p>
          </div>
          <div className="flex gap-2">
            <Button>
              <QrCode className="mr-2 h-4 w-4" /> QR Check-in
            </Button>
            <Button variant="outline">
              <Fingerprint className="mr-2 h-4 w-4" /> Biometric
            </Button>
          </div>
        </div>

        {/* Attendance Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceStats.totalToday}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently In</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceStats.currentlyIn}</div>
              <p className="text-xs text-muted-foreground">Active now</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceStats.membersToday}</div>
              <p className="text-xs text-muted-foreground">Member check-ins</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceStats.staffToday}</div>
              <p className="text-xs text-muted-foreground">Staff check-ins</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attendance records..."
              className="pl-8"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select a date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-[400px] grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead className="hidden md:table-cell">Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysAttendance.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg" alt={record.name} />
                          <AvatarFallback>{record.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{record.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.checkInTime}</TableCell>
                    <TableCell>{record.checkOutTime || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{record.duration}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'Checked In' ? 'default' : 'secondary'}>
                        <div className="flex items-center gap-1">
                          {record.status === 'Checked In' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {record.status}
                        </div>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="members">
            <div className="p-8 text-center text-muted-foreground">
              Member attendance records will be filtered here.
            </div>
          </TabsContent>

          <TabsContent value="staff">
            <div className="p-8 text-center text-muted-foreground">
              Staff attendance records will be filtered here.
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default AttendancePage;
