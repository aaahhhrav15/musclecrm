
import React from 'react';
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
  MoreHorizontal
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

// Mock data for staff
const staff = [
  { 
    id: 1, 
    name: 'Mark Johnson', 
    role: 'Head Trainer', 
    email: 'mark@example.com', 
    phone: '555-123-4567', 
    status: 'Active',
    salary: '$4,500',
    attendanceRate: '98%',
    hireDate: '2023-03-15',
    image: '/placeholder.svg' 
  },
  { 
    id: 2, 
    name: 'Sarah Williams', 
    role: 'Yoga Instructor', 
    email: 'sarah@example.com', 
    phone: '555-234-5678', 
    status: 'Active',
    salary: '$3,200',
    attendanceRate: '95%',
    hireDate: '2023-06-22',
    image: '/placeholder.svg' 
  },
  { 
    id: 3, 
    name: 'James Martinez', 
    role: 'Personal Trainer', 
    email: 'james@example.com', 
    phone: '555-345-6789', 
    status: 'Active',
    salary: '$3,800',
    attendanceRate: '92%',
    hireDate: '2024-01-10',
    image: '/placeholder.svg' 
  },
  { 
    id: 4, 
    name: 'Lisa Thompson', 
    role: 'Fitness Instructor', 
    email: 'lisa@example.com', 
    phone: '555-456-7890', 
    status: 'On Leave',
    salary: '$3,500',
    attendanceRate: '89%',
    hireDate: '2024-02-05',
    image: '/placeholder.svg' 
  },
  { 
    id: 5, 
    name: 'David Wilson', 
    role: 'Receptionist', 
    email: 'david@example.com', 
    phone: '555-567-8901', 
    status: 'Active',
    salary: '$2,800',
    attendanceRate: '97%',
    hireDate: '2024-03-20',
    image: '/placeholder.svg' 
  }
];

const StaffPage: React.FC = () => {
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
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" /> Schedule
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-8"
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
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
                {staff.filter(s => s.role.includes('Trainer')).length}
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
                {staff.filter(s => s.role.includes('Instructor')).length}
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
                {staff.filter(s => !s.role.includes('Trainer') && !s.role.includes('Instructor')).length}
              </div>
              <p className="text-xs text-muted-foreground">Administration & support</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-[400px] grid-cols-2 mb-4">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Salary</TableHead>
                  <TableHead className="hidden md:table-cell">Attendance</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.image} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{member.salary}</TableCell>
                    <TableCell className="hidden md:table-cell">{member.attendanceRate}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem>Attendance Log</DropdownMenuItem>
                          <DropdownMenuItem>Salary History</DropdownMenuItem>
                          <DropdownMenuItem>Schedule Classes</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="grid" className="border rounded-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map(member => (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={member.image} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{member.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" /> 
                          Salary
                        </span>
                        <span className="font-medium">{member.salary}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" /> 
                          Attendance
                        </span>
                        <span className="font-medium">{member.attendanceRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" /> 
                          Hire Date
                        </span>
                        <span className="font-medium">{member.hireDate}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">View Profile</Button>
                    <Button size="sm">Schedule</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default StaffPage;
