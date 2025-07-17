import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { toast } from 'sonner';

interface StaffFormProps {
  onSuccess?: () => void;
  initialData?: {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    hireDate: string;
    status: 'Active' | 'Inactive' | 'On Leave';
    dateOfBirth?: string;
    experience?: number;
  };
}

interface InitialData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  position: string;
  hireDate: string;
  status: string;
  experience?: number;
}

export const StaffForm: React.FC<StaffFormProps> = ({ onSuccess, initialData }) => {
  const [formData, setFormData] = useState<InitialData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
    position: initialData?.position || '',
    hireDate: initialData?.hireDate || new Date().toISOString().split('T')[0],
    status: initialData?.status || 'Active',
    experience: initialData?.experience !== undefined ? initialData.experience : undefined
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.email || !formData.phone || !formData.position || !formData.hireDate) {
      toast.error('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      if (initialData?._id) {
        await axios.put(`${API_URL}/gym/staff/${initialData._id}`, formData, { withCredentials: true });
        toast.success('Staff member updated successfully');
      } else {
        await axios.post(`${API_URL}/gym/staff`, formData, { withCredentials: true });
        toast.success('Staff member added successfully');
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error saving staff:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save staff member';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExperienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        experience: value === '' ? undefined : parseInt(value)
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          // required removed
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Position</Label>
        <Select
          value={formData.position}
          onValueChange={(value) => setFormData({ ...formData, position: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Personal Trainer">Personal Trainer</SelectItem>
            <SelectItem value="Receptionist">Receptionist</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Cleaner">Cleaner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.position === 'Personal Trainer' && (
        <div className="space-y-2">
          <Label htmlFor="experience">Years of Experience</Label>
          <Input
            id="experience"
            type="number"
            min="0"
            value={formData.experience === undefined ? '' : formData.experience}
            onChange={handleExperienceChange}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="hireDate">Hire Date</Label>
        <Input
          id="hireDate"
          type="date"
          value={formData.hireDate}
          onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as 'Active' | 'Inactive' | 'On Leave' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="On Leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : initialData?._id ? 'Update Staff' : 'Add Staff'}
      </Button>
    </form>
  );
}; 