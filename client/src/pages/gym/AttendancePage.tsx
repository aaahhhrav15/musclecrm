import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Clock, 
  Calendar as CalendarIcon, 
  Search, 
  Users,
  User,
  Zap,
  Loader2,
  BarChart
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
import { ApiService } from '@/services/ApiService';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import QRCodeDisplay from '@/components/attendance/QRCodeDisplay';

// Updated attendance type to match new backend schema
interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    membershipType: string;
    profileImage?: string;
  };
  timestamp: string;
}

// Define stats type
interface AttendanceStats {
  totalToday: number;
  currentlyIn: number;
  membersToday: number;
  sevenDayAverage: string;
  periodLabel: string;
}

// Add these interfaces at the top of the file:
interface AttendanceApiResponse {
  success: boolean;
  data: AttendanceRecord[];
  stats: AttendanceStats;
}

interface AttendanceHistoryApiResponse {
  success: boolean;
  data: AttendanceRecord[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalToday: 0,
    currentlyIn: 0,
    membersToday: 0,
    sevenDayAverage: 'N/A',
    periodLabel: 'Today'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const [view, setView] = useState<'today' | 'history'>('today');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] = useState<AttendanceRecord[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const gymId = useMemo(() => user?.gymId, [user]);
  const gymName = "Your Gym Name"; // This should come from your gym context or API

  const fetchAttendance = React.useCallback(async () => {
    if (!gymId) return;
    setIsLoading(true);
    try {
      const response: AttendanceApiResponse = await ApiService.get('/attendance', { date: selectedDate });
      if (response.success) {
        setAttendanceRecords(response.data);
        setStats(response.stats);
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
  }, [gymId, selectedDate, toast]);
  
  // Load attendance records from backend
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Load attendance history
  const fetchHistory = React.useCallback(async (page: number) => {
    if(!gymId) return;
    setIsLoadingHistory(true);
    try {
      const response: AttendanceHistoryApiResponse = await ApiService.get('/attendance/history', {
        page,
        limit: 10
      });
      if (response.success) {
        setHistoryData(response.data);
        setTotalPages(response.pagination.pages);
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
  }, [gymId, toast]);

  useEffect(() => {
    if (view === 'history') {
      fetchHistory(historyPage);
    }
  }, [view, historyPage, fetchHistory]);

  const handleQrCheckIn = () => {
    setShowQRCode(true);
  };
  
  const peakHour = useMemo(() => {
    if (attendanceRecords.length === 0) return 'N/A';

    const hours = attendanceRecords.map(record => new Date(record.timestamp).getHours());
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peak = Object.keys(hourCounts).reduce((a, b) => hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b);
    const peakHourNumber = parseInt(peak);
    const nextHour = peakHourNumber + 1;
    
    const formatHour = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12} ${ampm}`;
    };

    return `${formatHour(peakHourNumber)} - ${formatHour(nextHour)}`;
  }, [attendanceRecords]);

  // Filter records based on search
  const filteredAttendance = attendanceRecords.filter(record => {
    const name = record.userId?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredHistory = historyData.filter(record => {
    const name = record.userId?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderAttendanceRow = (record: AttendanceRecord) => (
    <TableRow key={record._id}>
      <TableCell>
        <div className="font-medium">{record.userId?.name || 'Unknown User'}</div>
        <div className="text-sm text-muted-foreground">{record.userId?.email || ''}</div>
      </TableCell>
      <TableCell>
        {format(new Date(record.timestamp), 'PP')}
      </TableCell>
      <TableCell>
        {format(new Date(record.timestamp), 'p')}
      </TableCell>
      <TableCell>
        <Badge variant="secondary">Present</Badge>
      </TableCell>
    </TableRow>
  );

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
            <h1 className="text-2xl font-bold tracking-tight">Member Attendance</h1>
            <p className="text-muted-foreground">
              Track and manage member check-ins.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleQrCheckIn}>
              <QrCode className="mr-2 h-4 w-4" /> Scan Member QR Code
            </Button>
          </div>
        </div>

        {/* QR Code Display Modal */}
        {showQRCode && gymId && (
          <QRCodeDisplay
            isOpen={showQRCode}
            onClose={() => setShowQRCode(false)}
            gymId={gymId}
            gymName={gymName}
          />
        )}

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalToday}</div>
                    <p className="text-xs text-muted-foreground">{stats.periodLabel}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.membersToday}</div>
                     <p className="text-xs text-muted-foreground">Checked in {stats.periodLabel.toLowerCase()}</p>
                  </CardContent>
                </Card>
                <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">7-Day Average</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.sevenDayAverage}</div>
                    <p className="text-xs text-muted-foreground">Avg. check-ins per day</p>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance List */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{stats.periodLabel}'s Records</CardTitle>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search by name..." 
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={selectedDate} onValueChange={setSelectedDate}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by date" />
                        </SelectTrigger>
                        <SelectContent>

                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="yesterday">Yesterday</SelectItem>
                          <SelectItem value="thisWeek">This Week</SelectItem>
                          <SelectItem value="lastWeek">Last Week</SelectItem>
                          <SelectItem value="thisMonth">This Month</SelectItem>
                          <SelectItem value="prevMonth">Previous Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                          </TableCell>
                        </TableRow>
                      ) : filteredAttendance.length > 0 ? (
                        filteredAttendance.map(renderAttendanceRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No attendance records found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            // History View
            <Card>
               <CardHeader>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle>Attendance History</CardTitle>
                    <div className="relative flex-grow sm:flex-grow-0">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by name..." 
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                 </div>
               </CardHeader>
               <CardContent>
                <Table>
                   <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingHistory ? (
                         <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                          </TableCell>
                        </TableRow>
                      ) : filteredHistory.length > 0 ? (
                        filteredHistory.map(renderAttendanceRow)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No history found for this date.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                </Table>
               </CardContent>
               {totalPages > 1 && (
                 <div className="p-4 flex justify-end">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                      >
                        Previous
                      </Button>
                      <span>
                        Page {historyPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                        disabled={historyPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                 </div>
               )}
            </Card>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AttendancePage;
