
import React, { useState, useEffect } from 'react';
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
  User,
  Loader2
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
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Define attendance type
interface AttendanceRecord {
  _id: string;
  memberId?: {
    _id: string;
    name: string;
    email: string;
    membershipType: string;
  };
  staffId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  checkInTime: string;
  checkOutTime?: string;
  duration?: string;
  status: 'Checked In' | 'Checked Out';
  type: 'Member' | 'Staff';
}

// Define stats type
interface AttendanceStats {
  totalToday: number;
  currentlyIn: number;
  membersToday: number;
  staffToday: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const AttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalToday: 0,
    currentlyIn: 0,
    membersToday: 0,
    staffToday: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Load attendance records from backend
  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/attendance?date=${selectedDate}`);
        
        if (response.data.success) {
          setAttendanceRecords(response.data.attendance);
          
          // Calculate stats
          const records = response.data.attendance;
          setStats({
            totalToday: records.length,
            currentlyIn: records.filter((a: AttendanceRecord) => a.status === 'Checked In').length,
            membersToday: records.filter((a: AttendanceRecord) => a.type === 'Member').length,
            staffToday: records.filter((a: AttendanceRecord) => a.type === 'Staff').length,
          });
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast({
          title: "Failed to load attendance",
          description: "There was a problem loading attendance records.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedDate, toast]);

  // Handle QR check-in
  const handleQrCheckIn = async () => {
    toast({
      title: "QR Check-in",
      description: "QR check-in functionality will be connected to the backend.",
    });
    
    // This would typically open a QR scanner and then call your backend API
    // Example backend call:
    // await axios.post(`${API_URL}/attendance/qr-checkin`, { qrCode: scannedCode });
  };

  // Handle biometric check-in
  const handleBiometricCheckIn = async () => {
    toast({
      title: "Biometric Check-in",
      description: "Biometric check-in functionality will be connected to the backend.",
    });
    
    // This would typically integrate with a biometric device and then call your backend API
    // Example backend call:
    // await axios.post(`${API_URL}/attendance/biometric-checkin`, { biometricId: scannedId });
  };

  // Filter records based on search
  const filteredAttendance = attendanceRecords.filter(record => {
    const name = record.memberId?.name || record.staffId?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
            <Button onClick={handleQrCheckIn}>
              <QrCode className="mr-2 h-4 w-4" /> QR Check-in
            </Button>
            <Button variant="outline" onClick={handleBiometricCheckIn}>
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
              <div className="text-2xl font-bold">{stats.totalToday}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently In</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentlyIn}</div>
              <p className="text-xs text-muted-foreground">Active now</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.membersToday}</div>
              <p className="text-xs text-muted-foreground">Member check-ins</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.staffToday}</div>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading attendance records...</span>
              </div>
            ) : (
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
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map(record => (
                      <TableRow key={record._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg" alt={record.memberId?.name || record.staffId?.name || ''} />
                              <AvatarFallback>
                                {(record.memberId?.name?.[0] || record.staffId?.name?.[0] || '').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{record.memberId?.name || record.staffId?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{record.type}</TableCell>
                        <TableCell>{new Date(record.checkInTime).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{record.duration || '-'}</TableCell>
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
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
