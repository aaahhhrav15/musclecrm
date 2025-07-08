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
  BarChart,
  Download,
  TrendingUp,
  Activity,
  UserCheck,
  Eye,
  Timer,
  ChevronLeft,
  ChevronRight
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/services/ApiService';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import QRCodeDisplay from '@/components/attendance/QRCodeDisplay';
import * as Papa from 'papaparse';
import { toast } from 'sonner';

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

const API_URL = import.meta.env.VITE_API_URL || 'https://flexcrm-ui-suite-production-ec9f.up.railway.app/api';

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
  const { toast: useToastHook } = useToast();
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

  // Helper function to get period label based on selected date
  const getSelectedPeriodLabel = () => {
    switch (selectedDate) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'thisWeek': return 'This Week';
      case 'lastWeek': return 'Last Week';
      case 'thisMonth': return 'This Month';
      case 'prevMonth': return 'Previous Month';
      default: return 'Today';
    }
  };

  // Calculate attendance insights
  const attendanceInsights = React.useMemo(() => {
    const currentHour = new Date().getHours();
    const morningCheckIns = attendanceRecords.filter(record => {
      const hour = new Date(record.timestamp).getHours();
      return hour >= 6 && hour < 12;
    }).length;
    
    const eveningCheckIns = attendanceRecords.filter(record => {
      const hour = new Date(record.timestamp).getHours();
      return hour >= 17 && hour < 22;
    }).length;

    return {
      totalCheckIns: stats.totalToday,
      uniqueMembers: stats.membersToday,
      morningVisits: morningCheckIns,
      eveningVisits: eveningCheckIns
    };
  }, [stats, attendanceRecords]);

  const fetchAttendance = React.useCallback(async () => {
    if (!gymId) return;
    // Only show loading for initial load, not for dropdown changes
    if (attendanceRecords.length === 0) {
      setIsLoading(true);
    }
    try {
      const response: AttendanceApiResponse = await ApiService.get('/attendance', { date: selectedDate });
      if (response.success) {
        setAttendanceRecords(response.data);
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      useToastHook({
        title: "Failed to load attendance",
        description: "There was a problem loading attendance records.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [gymId, selectedDate, useToastHook, attendanceRecords.length]);
  
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
      useToastHook({
        title: "Failed to load history",
        description: "There was a problem loading attendance history.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [gymId, useToastHook]);

  useEffect(() => {
    if (view === 'history') {
      fetchHistory(historyPage);
    }
  }, [view, historyPage, fetchHistory]);

  const handleQrCheckIn = () => {
    setShowQRCode(true);
  };

  // Filter records based on search
  const filteredAttendance = attendanceRecords.filter(record => {
    const name = record.userId?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredHistory = historyData.filter(record => {
    const name = record.userId?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExport = () => {
    const dataToExport = view === 'today' ? filteredAttendance : filteredHistory;
    
    if (!dataToExport || dataToExport.length === 0) {
      toast("No data to export.");
      return;
    }

    const exportData = dataToExport.map(record => ({
      "Member Name": record.userId?.name || 'Unknown',
      "Email": record.userId?.email || '',
      "Membership Type": record.userId?.membershipType || '',
      "Check-in Date": format(new Date(record.timestamp), 'yyyy-MM-dd'),
      "Check-in Time": format(new Date(record.timestamp), 'HH:mm:ss'),
      "Day of Week": format(new Date(record.timestamp), 'EEEE')
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance-${view}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance data exported successfully!");
  };

  const renderAttendanceRow = (record: AttendanceRecord, index: number) => (
    <motion.tr
      key={record._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="hover:bg-muted/30 transition-colors"
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={record.userId?.profileImage} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {record.userId?.name?.slice(0, 2).toUpperCase() || 'UN'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{record.userId?.name || 'Unknown User'}</div>
            <div className="text-sm text-muted-foreground">{record.userId?.email || ''}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={
          record.userId?.membershipType === 'vip' ? 'default' :
          record.userId?.membershipType === 'premium' ? 'secondary' :
          'outline'
        }>
          {record.userId?.membershipType?.charAt(0).toUpperCase() + record.userId?.membershipType?.slice(1) || 'Basic'}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(record.timestamp), 'MMM d, yyyy')}
      </TableCell>
      <TableCell className="font-medium">
        {format(new Date(record.timestamp), 'h:mm a')}
      </TableCell>
      <TableCell>
        <Badge variant="default" className="bg-green-500/10 text-green-700">
          <UserCheck className="h-3 w-3 mr-1" />
          Present
        </Badge>
      </TableCell>
    </motion.tr>
  );

  if (isLoading && view === 'today') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Member Attendance
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time member check-ins and attendance tracking with insights.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleQrCheckIn} size="lg" className="shadow-sm">
              <QrCode className="mr-2 h-5 w-5" /> Scan QR Code
            </Button>
            <Button variant="outline" size="lg" className="shadow-sm" onClick={handleExport}>
              <Download className="mr-2 h-5 w-5" /> Export Data
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

        {/* Compact Stats Dashboard - Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Check-ins</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{attendanceInsights.totalCheckIns}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {getSelectedPeriodLabel()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Unique Members</CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{attendanceInsights.uniqueMembers}</div>
                <p className="text-xs text-muted-foreground">Individual visitors</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Morning Visits</CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{attendanceInsights.morningVisits}</div>
                <p className="text-xs text-muted-foreground">6 AM - 12 PM</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Evening Visits</CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{attendanceInsights.eveningVisits}</div>
                <p className="text-xs text-muted-foreground">5 PM - 10 PM</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Attendance Tracking Interface */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                {view === 'today' ? `${getSelectedPeriodLabel()} Records` : 'Attendance History'}
              </CardTitle>
              <Tabs value={view} onValueChange={(v) => setView(v as 'today' | 'history')}>
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="today" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {getSelectedPeriodLabel()}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    History
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 border-b bg-muted/20">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      className="pl-10 h-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {view === 'today' && (
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
                  )}
                </div>
                
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {view === 'today' ? filteredAttendance.length : filteredHistory.length} records
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="font-semibold">Member</TableHead>
                    <TableHead className="font-semibold">Membership</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view === 'today' ? (
                    isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                          <p className="mt-2 text-muted-foreground">Loading attendance records...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredAttendance.length > 0 ? (
                      filteredAttendance.map((record, index) => renderAttendanceRow(record, index))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center space-y-2">
                            <Users className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-lg font-medium">No attendance records found</div>
                            <p className="text-sm">Check-ins will appear here in real-time</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    isLoadingHistory ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                          <p className="mt-2 text-muted-foreground">Loading history...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredHistory.length > 0 ? (
                      filteredHistory.map((record, index) => renderAttendanceRow(record, index))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center space-y-2">
                            <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-lg font-medium">No history found</div>
                            <p className="text-sm">Try adjusting your search criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>

            {view === 'history' && totalPages > 1 && (
              <div className="p-6 border-t bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {historyPage} of {totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                      disabled={historyPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AttendancePage;