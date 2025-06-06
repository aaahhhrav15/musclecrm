import React, { useEffect, useState } from 'react';
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
  Sparkles
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
} from '@/components/ui/dialog';
import { StaffForm } from '@/components/staff/StaffForm';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Staff {
  _id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  hireDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
}

const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    hireDate: '',
    status: 'Active'
  });

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API_URL}/gym/staff`, { withCredentials: true });
      setStaff(response.data.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to fetch staff members');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

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

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage your trainers, instructors, and other staff members.
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                </DialogHeader>
                <StaffForm onSuccess={() => {
                  setIsAddDialogOpen(false);
                  fetchStaff();
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">{staff.length}</div>
              <p className="text-xs text-muted-foreground">Active and on leave</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Trainers</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">
                {staff.filter(s => s.position.includes('Trainer')).length}
              </div>
              <p className="text-xs text-muted-foreground">Personal trainers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">
                {staff.filter(s => s.position.includes('Instructor')).length}
              </div>
              <p className="text-xs text-muted-foreground">Class instructors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Support Staff</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              <div className="text-2xl font-bold">
                {staff.filter(s => !s.position.includes('Trainer') && !s.position.includes('Instructor')).length}
              </div>
              <p className="text-xs text-muted-foreground">Administration & support</p>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      {member.name}
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
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(member.hireDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(member._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

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
              name: selectedStaff.name,
              email: selectedStaff.email,
              phone: selectedStaff.phone,
              position: selectedStaff.position,
              hireDate: new Date(selectedStaff.hireDate).toISOString().split('T')[0],
              status: selectedStaff.status
            } : undefined}
            staffId={selectedStaff?._id}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StaffPage;
