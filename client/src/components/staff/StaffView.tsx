import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dumbbell, User, Briefcase, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffViewProps {
  staff: {
    _id: string;
    userId: string;
    gymId: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    hireDate: string;
    status: 'Active' | 'Inactive' | 'On Leave';
    dateOfBirth?: string;
    experience?: number;
    trainerId?: string;
    createdAt: string;
    updatedAt: string;
  };
}

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

export const StaffView: React.FC<StaffViewProps> = ({ staff }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">{staff.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{staff.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            {getPositionIcon(staff.position)}
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getPositionColor(staff.position))}>
              {staff.position}
            </span>
            <Badge className={getStatusColor(staff.status)}>
              {staff.status}
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Staff Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{staff.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="mt-1">{staff.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                <p className="mt-1">{staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Position</p>
                <p className="mt-1">{staff.position}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hire Date</p>
                <p className="mt-1">{new Date(staff.hireDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="mt-1">
                  <Badge className={getStatusColor(staff.status)}>
                    {staff.status}
                  </Badge>
                </div>
              </div>
              {staff.position === 'Personal Trainer' && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Years of Experience</p>
                  <p className="mt-1">{staff.experience || 0} years</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="mt-1">{new Date(staff.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="mt-1">{new Date(staff.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Staff ID</p>
                <p className="mt-1">{staff._id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 