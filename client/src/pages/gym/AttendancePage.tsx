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
import QRCodeDisplay from '@/components/attendance/QRCodeDisplay';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  const [showQRCode, setShowQRCode] = useState(false);
  const [view, setView] = useState<'today' | 'history'>('today');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] = useState<AttendanceRecord[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const gymId = "your-gym-id"; // This should come from your auth context or API
  const gymName = "Your Gym Name"; // This should come from your auth context or API

  // Load attendance records from backend
  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/gym/attendance`, {
          params: { date: selectedDate }
        });
        
        if (response.data.success) {
          setAttendanceRecords(response.data.data);
          setStats(response.data.stats);
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

  // Load attendance history
  const fetchHistory = async (page: number) => {
    setIsLoadingHistory(true);
    try {
      const response = await axios.get(`${API_URL}/gym/attendance/history`, {
        params: {
          page,
          limit: 10,
          startDate: date ? format(date, 'yyyy-MM-dd') : undefined,
          endDate: date ? format(date, 'yyyy-MM-dd') : undefined
        }
      });

      if (response.data.success) {
        setHistoryData(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Failed to load history",
        description: "There was a problem loading attendance history.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (view === 'history') {
      fetchHistory(historyPage);
    }
  }, [view, historyPage, date]);

  // Handle QR check-in
  const handleQrCheckIn = () => {
    setShowQRCode(true);
  };

  const handleQRScanSuccess = () => {
    // Refresh attendance data
    fetchAttendance();
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
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance System</h1>
            <p className="text-muted-foreground">
              Track and manage gym attendance for members and staff.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowQRCode(true)}>
              <QrCode className="mr-2 h-4 w-4" /> QR Code
            </Button>
            <Button variant="outline" onClick={handleBiometricCheckIn}>
              <Fingerprint className="mr-2 h-4 w-4" /> Biometric
            </Button>
          </div>
        </div>

        {/* QR Code Display Modal */}
        <QRCodeDisplay
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
          gymId={gymId}
          gymName={gymName}
        />

        {/* Main Content */}
        <div className="space-y-6">
          {/* View Toggle */}
          <div className="border-b pb-4">
            <Tabs value={view} onValueChange={(v) => setView(v as 'today' | 'history')}>
              <TabsList>
                <TabsTrigger value="today">Today's Attendance</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {view === 'today' ? (
            <>
              {/* Today's Attendance Stats */}
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

              {/* Today's Attendance Table */}
              <div className="border rounded-md">
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
                      {attendanceRecords.length > 0 ? (
                        attendanceRecords.map(record => (
                          <TableRow key={record._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src="/placeholder.svg" alt={record.memberId?.name || ''} />
                                  <AvatarFallback>
                                    {(record.memberId?.name?.[0] || '').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{record.memberId?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{record.memberId ? 'Member' : 'Staff'}</TableCell>
                            <TableCell>{format(new Date(record.checkInTime), 'PPp')}</TableCell>
                            <TableCell>
                              {record.checkOutTime ? format(new Date(record.checkOutTime), 'PPp') : '-'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {record.checkOutTime
                                ? formatDuration(new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime())
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={record.checkOutTime ? 'secondary' : 'default'}>
                                {record.checkOutTime ? 'Checked Out' : 'Checked In'}
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
              </div>
            </>
          ) : (
            <>
              {/* History Section */}
              <div className="space-y-4">
                {/* Date Filter */}
                <div className="flex justify-end px-4">
                  <Input
                    type="date"
                    className="w-[240px]"
                    value={date ? format(date, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        setDate(new Date(value));
                      }
                    }}
                  />
                </div>

                {/* History Table */}
                <div className="border rounded-md">
                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading history...</span>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Check-in Time</TableHead>
                          <TableHead>Check-out Time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyData.length > 0 ? (
                          historyData.map(record => (
                            <TableRow key={record._id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src="/placeholder.svg" alt={record.memberId?.name || ''} />
                                    <AvatarFallback>
                                      {(record.memberId?.name?.[0] || '').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{record.memberId?.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(record.checkInTime), 'PPp')}</TableCell>
                              <TableCell>
                                {record.checkOutTime ? format(new Date(record.checkOutTime), 'PPp') : '-'}
                              </TableCell>
                              <TableCell>
                                {record.checkOutTime
                                  ? formatDuration(new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime())
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={record.checkOutTime ? 'secondary' : 'default'}>
                                  {record.checkOutTime ? 'Checked Out' : 'Checked In'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              No attendance records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                      disabled={historyPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

// Helper function to format duration
const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export default AttendancePage;
