
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
import { supabase } from '@/integrations/supabase/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  member: {
    id: string;
    name: string;
    email: string | null;
    membership_type: string | null;
  } | null;
  duration: string;
  status: 'Checked In' | 'Checked Out';
}

// Function to calculate duration between check-in and check-out
const calculateDuration = (checkIn: string, checkOut: string | null) => {
  if (!checkOut) return '-';
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffMs = end.getTime() - start.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${diffHrs}h ${diffMins}m`;
};

const AttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalToday: 0,
    currentlyIn: 0,
    membersToday: 0,
    staffToday: 0,
  });
  const { toast } = useToast();
  
  // Use the auth hook to check authentication
  const auth = useRequireAuth();

  // Fetch attendance records from Supabase
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      if (!auth.isAuthenticated) return;
      
      setIsLoading(true);
      try {
        // Get attendance records with member details
        const { data, error } = await supabase
          .from('gym_attendance')
          .select(`
            id,
            check_in_time,
            check_out_time,
            member_id,
            gym_members (
              id,
              name,
              email,
              membership_type
            )
          `)
          .order('check_in_time', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Transform the data into the format we need
          const formattedRecords: AttendanceRecord[] = data.map(record => ({
            id: record.id,
            check_in_time: record.check_in_time,
            check_out_time: record.check_out_time,
            member: record.gym_members,
            duration: calculateDuration(record.check_in_time, record.check_out_time),
            status: record.check_out_time ? 'Checked Out' : 'Checked In',
          }));

          setAttendanceRecords(formattedRecords);
          
          // Calculate stats
          const currentlyIn = formattedRecords.filter(r => r.status === 'Checked In').length;
          
          setStats({
            totalToday: formattedRecords.length,
            currentlyIn,
            membersToday: formattedRecords.length, // Assuming all are members for now
            staffToday: 0, // We don't have staff attendance yet
          });
        }
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance records',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceRecords();
  }, [auth.isAuthenticated, toast]);

  // Function to format the time for display
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'hh:mm a');
  };

  // Filter records based on search term and selected tab
  const getFilteredRecords = (activeTab: string) => {
    return attendanceRecords.filter(record => {
      const matchesSearch = searchTerm === '' || 
        record.member?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'members') return matchesSearch && record.member !== null;
      if (activeTab === 'staff') return false; // No staff records yet
      
      return matchesSearch;
    });
  };

  // Handle checkout
  const handleCheckout = async (attendanceId: string) => {
    try {
      const { error } = await supabase
        .from('gym_attendance')
        .update({ 
          check_out_time: new Date().toISOString(),
        })
        .eq('id', attendanceId);

      if (error) throw error;

      // Update the local state
      setAttendanceRecords(prev => 
        prev.map(record => 
          record.id === attendanceId 
            ? { 
                ...record, 
                check_out_time: new Date().toISOString(),
                status: 'Checked Out',
                duration: calculateDuration(record.check_in_time, new Date().toISOString())
              } 
            : record
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        currentlyIn: prev.currentlyIn - 1,
      }));

      toast({
        title: 'Success',
        description: 'Member checked out successfully',
      });
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: 'Error',
        description: 'Failed to check out member',
        variant: 'destructive',
      });
    }
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No attendance records found. Start by checking in members.
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredRecords('all').map(record => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt={record.member?.name || 'Unknown'} />
                            <AvatarFallback>
                              {(record.member?.name || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{record.member?.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{record.member?.membership_type || 'Member'}</TableCell>
                      <TableCell>{formatTime(record.check_in_time)}</TableCell>
                      <TableCell>{record.check_out_time ? formatTime(record.check_out_time) : '-'}</TableCell>
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
                      <TableCell>
                        {record.status === 'Checked In' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCheckout(record.id)}
                          >
                            Check Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="members">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Member attendance records will be displayed here.
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Staff attendance records will be displayed here.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default AttendancePage;
