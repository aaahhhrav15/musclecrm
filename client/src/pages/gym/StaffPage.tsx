import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  UserCog, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  DollarSign, 
  MoreHorizontal,
  Edit,
  Trash2,
  Dumbbell,
  Briefcase,
  Sparkles,
  Eye,
  Users,
  Award,
  Phone,
  Mail,
  MapPin,
  Download,
  TrendingUp,
  UserCheck,
  UserX,
  UserMinus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardFooter, 
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StaffForm } from '@/components/staff/StaffForm';
import { StaffView } from '@/components/staff/StaffView';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';
import { API_URL } from '@/config';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import * as Papa from 'papaparse';

interface Staff {
  _id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  hireDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  dateOfBirth?: string;
  experience?: number;
}

const StaffPage: React.FC = () => {
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      // Fetch all staff members without pagination limit
      const response = await axios.get(`${API_URL}/gym/staff`, { 
        params: {
          page: 1,
          limit: 10000 // Large enough to get all staff
        },
        withCredentials: true 
      });
      console.log('Staff data received:', response.data);
      setAllStaff(response.data.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to fetch staff members');
      setAllStaff([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Calculate staff insights from all staff
  const staffInsights = useMemo(() => {
    if (!allStaff.length) return {
      totalStaff: 0,
      activeStaff: 0,
      inactiveStaff: 0,
      onLeaveStaff: 0,
      trainers: 0,
      instructors: 0,
      supportStaff: 0,
      averageExperience: 0
    };

    return {
      totalStaff: allStaff.length,
      activeStaff: allStaff.filter(s => s.status === 'Active').length,
      inactiveStaff: allStaff.filter(s => s.status === 'Inactive').length,
      onLeaveStaff: allStaff.filter(s => s.status === 'On Leave').length,
      trainers: allStaff.filter(s => s.position.includes('Trainer')).length,
      instructors: allStaff.filter(s => s.position.includes('Instructor')).length,
      supportStaff: allStaff.filter(s => !s.position.includes('Trainer') && !s.position.includes('Instructor')).length,
      averageExperience: allStaff.length > 0 
        ? allStaff.reduce((sum, s) => sum + (s.experience || 0), 0) / allStaff.length 
        : 0
    };
  }, [allStaff]);

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await axios.delete(`${API_URL}/gym/staff/${staffId}`, { withCredentials: true });
      toast.success('Staff member deleted successfully');
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to delete staff member');
    }
  };

  // Enhanced search functionality with memoization
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return allStaff;
    
    const query = searchQuery.toLowerCase().trim();
    return allStaff.filter(member => {
      const name = member.name?.toLowerCase() || '';
      const email = member.email?.toLowerCase() || '';
      const position = member.position?.toLowerCase() || '';
      const phone = member.phone?.toLowerCase() || '';
      
      return name.includes(query) || 
             email.includes(query) || 
             position.includes(query) ||
             phone.includes(query);
    });
  }, [allStaff, searchQuery]);

  // Filter by tab with memoization
  const tabFilteredStaff = useMemo(() => {
    let filtered = filteredStaff;
    
    switch (activeTab) {
      case 'trainers':
        filtered = filtered.filter(s => s.position.includes('Trainer'));
        break;
      case 'instructors':
        filtered = filtered.filter(s => s.position.includes('Instructor'));
        break;
      case 'support':
        filtered = filtered.filter(s => !s.position.includes('Trainer') && !s.position.includes('Instructor'));
        break;
      default:
        break;
    }
    
    return filtered;
  }, [filteredStaff, activeTab]);

  // Pagination calculations
  const totalStaff = tabFilteredStaff.length;
  const totalPages = Math.ceil(totalStaff / rowsPerPage);
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalStaff);
  
  // Get current page data
  const currentPageStaff = tabFilteredStaff.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Generate page numbers for pagination
  const getPageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [totalPages, currentPage]);

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/10 text-green-500';
      case 'Inactive':
        return 'bg-red-500/10 text-red-500';
      case 'On Leave':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'Personal Trainer':
        return 'bg-blue-100 text-blue-800';
      case 'Receptionist':
        return 'bg-green-100 text-green-800';
      case 'Manager':
        return 'bg-purple-100 text-purple-800';
      case 'Cleaner':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'Personal Trainer':
        return <Dumbbell className="h-4 w-4" />;
      case 'Receptionist':
        return <User className="h-4 w-4" />;
      case 'Manager':
        return <Briefcase className="h-4 w-4" />;
      case 'Cleaner':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const handleEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsEditDialogOpen(true);
  };

  const handleView = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsViewDialogOpen(true);
  };

  const handleExport = () => {
    if (!tabFilteredStaff || tabFilteredStaff.length === 0) {
      toast("No data to export.");
      return;
    }

    const dataToExport = tabFilteredStaff.map(member => ({
      "Name": member.name,
      "Email": member.email,
      "Phone": member.phone,
      "Position": member.position,
      "Status": member.status,
      "Hire Date": format(new Date(member.hireDate), 'yyyy-MM-dd'),
      "Date of Birth": member.dateOfBirth ? format(new Date(member.dateOfBirth), 'yyyy-MM-dd') : '',
      "Experience (Years)": member.experience || 0
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `staff-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Staff data exported successfully!");
  };

  if (isLoading) {
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
              Staff Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your team of trainers, instructors, and support staff with comprehensive insights.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new staff member to your team.
                  </DialogDescription>
                </DialogHeader>
                <StaffForm onSuccess={() => {
                  setIsAddDialogOpen(false);
                  fetchStaff();
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Staff Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Staff
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {staffInsights.totalStaff}
              </div>
              <p className="text-xs text-muted-foreground">
                Active team members
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Staff
              </CardTitle>
              <UserCheck className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {staffInsights.activeStaff}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently working
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trainers
              </CardTitle>
              <Dumbbell className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {staffInsights.trainers}
              </div>
              <p className="text-xs text-muted-foreground">
                Personal trainers
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Experience
              </CardTitle>
              <Award className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {staffInsights.averageExperience.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Years of experience
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search staff members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {tabFilteredStaff?.length || 0} members
            </Badge>
          </div>
        </div>

        {/* Staff Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Staff Directory</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {startItem}-{endItem} of {totalStaff}
                </span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => {
                    setRowsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6 pt-6">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Staff ({allStaff.length})
                  </TabsTrigger>
                  <TabsTrigger value="trainers" className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Trainers ({staffInsights.trainers})
                  </TabsTrigger>
                  <TabsTrigger value="instructors" className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Instructors ({staffInsights.instructors})
                  </TabsTrigger>
                  <TabsTrigger value="support" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Support ({staffInsights.supportStaff})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-muted/50">
                        <TableHead className="font-semibold">Staff Member</TableHead>
                        <TableHead className="font-semibold">Position</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Hire Date</TableHead>
                        <TableHead className="font-semibold w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPageStaff.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center space-y-2">
                              <Users className="h-12 w-12 text-muted-foreground/50" />
                              <div className="text-lg font-medium">
                                {searchQuery ? 'No staff members found matching your search.' : 'No staff members found.'}
                              </div>
                              <p className="text-sm">Try adjusting your search or add new staff members</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentPageStaff.map((member, index) => (
                          <motion.tr
                            key={member._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {member.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{member.name}</div>
                                  <div className="text-sm text-muted-foreground">{member.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getPositionIcon(member.position)}
                                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getPositionColor(member.position))}>
                                  {member.position}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {member.phone || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {member.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("text-xs", getStatusColor(member.status))}>
                                {member.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(member.hireDate), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleView(member)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(member)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Staff
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => handleDelete(member._id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Staff
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startItem} to {endItem} of {totalStaff} staff members
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {getPageNumbers.map((page, index) => (
                    <React.Fragment key={index}>
                      {page === '...' ? (
                        <span className="px-2 py-1 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </motion.div>

      {/* Modals */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <StaffForm 
            onSuccess={() => {
              setIsEditDialogOpen(false);
              fetchStaff();
            }}
            initialData={selectedStaff ? {
              _id: selectedStaff._id,
              name: selectedStaff.name,
              email: selectedStaff.email,
              phone: selectedStaff.phone,
              position: selectedStaff.position,
              hireDate: new Date(selectedStaff.hireDate).toISOString().split('T')[0],
              status: selectedStaff.status,
              dateOfBirth: selectedStaff.dateOfBirth ? new Date(selectedStaff.dateOfBirth).toISOString().split('T')[0] : '',
              experience: selectedStaff.experience
            } : undefined}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>
              View detailed information about the staff member
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && <StaffView staff={selectedStaff} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StaffPage;