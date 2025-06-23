import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Gift, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  membershipType: z.string().optional().default('none'),
  source: z.string().optional().default('none'),
  sortBy: z.string().optional().default('none'),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  expiryFilter: z.string().optional().default('none'),
  birthdayFilter: z.string().optional().default('none'),
  statusFilter: z.string().optional().default('none'),
});

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: z.infer<typeof formSchema>) => void;
  currentFilters: z.infer<typeof formSchema>;
}

export function FilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}: FilterModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: currentFilters,
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onApply(values);
    onClose();
  };

  const handleClearFilters = () => {
    form.reset({
      membershipType: 'none',
      source: 'none',
      sortBy: 'none',
      sortOrder: 'asc',
      expiryFilter: 'none',
      birthdayFilter: 'none',
      statusFilter: 'none',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Customers</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Membership Type Filter */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Membership</h4>
              </div>
              <FormField
                control={form.control}
                name="membershipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membership Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select membership type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Expiry Filter */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <h4 className="font-medium">Membership Expiry</h4>
              </div>
              <FormField
                control={form.control}
                name="expiryFilter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiring Within</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select expiry timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="1day">1 Day</SelectItem>
                        <SelectItem value="2days">2 Days</SelectItem>
                        <SelectItem value="3days">3 Days</SelectItem>
                        <SelectItem value="5days">5 Days</SelectItem>
                        <SelectItem value="10days">10 Days</SelectItem>
                        <SelectItem value="30days">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Birthday Filter */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-pink-500" />
                <h4 className="font-medium">Birthdays</h4>
              </div>
              <FormField
                control={form.control}
                name="birthdayFilter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birthday</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select birthday filter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="tomorrow">Tomorrow</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="next7days">Next 7 Days</SelectItem>
                        <SelectItem value="next30days">Next 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Status Filter */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h4 className="font-medium">Membership Status</h4>
              </div>
              <FormField
                control={form.control}
                name="statusFilter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status filter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="expiringSoon">Expiring Soon (7 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Source and Sorting */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium">Source & Sorting</h4>
              </div>
              
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="walk_in">Walk-in</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sortBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort By</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="joinDate">Join Date</SelectItem>
                          <SelectItem value="expiryDate">Expiry Date</SelectItem>
                          <SelectItem value="totalSpent">Total Spent</SelectItem>
                          <SelectItem value="membershipFees">Membership Fees</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                Clear All
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Apply Filters</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}