import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import transactionService from '@/services/transactionService';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Transaction {
  _id: string;
  userId: string;
  gymId: string;
  transactionType: string;
  transactionDate: string;
  amount: number;
  membershipType: string;
  paymentMode: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  personalTrainingAssignment?: {
    _id: string;
    trainerId: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      specialization?: string;
      experience?: number;
      status?: string;
      bio?: string;
      clients?: number;
    };
    startDate: string;
    endDate: string;
    duration: number;
    fees: number;
  };
}

interface TransactionHistoryProps {
  userId: string;
}

const editTransactionSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  paymentMode: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']),
  description: z.string().min(1, 'Description is required'),
  transactionDate: z.date(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']),
});

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editForm = useForm<z.infer<typeof editTransactionSchema>>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      amount: 0,
      paymentMode: 'cash',
      description: '',
      transactionDate: new Date(),
      status: 'SUCCESS',
    }
  });

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      // eslint-disable-next-line no-console
      console.log('Fetching transactions for userId:', userId);
      const data = await transactionService.getUserTransactions(userId);
      // eslint-disable-next-line no-console
      console.log('API returned transactions:', data);
      setTransactions(data);
      // eslint-disable-next-line no-console
      console.log('Set transactions state:', data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    editForm.reset({
      amount: transaction.amount,
      paymentMode: transaction.paymentMode as any,
      description: transaction.description,
      transactionDate: new Date(transaction.transactionDate),
      status: transaction.status as any,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const onSubmitEdit = async (values: z.infer<typeof editTransactionSchema>) => {
    if (!editingTransaction) return;

    try {
      await transactionService.updateTransaction(editingTransaction._id, {
        amount: values.amount,
        paymentMode: values.paymentMode,
        description: values.description,
        transactionDate: values.transactionDate.toISOString(),
        status: values.status,
      });

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });

      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      fetchTransactions();
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Transaction update error:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingTransaction) return;

    try {
      await transactionService.deleteTransaction(deletingTransaction._id);
      
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });

      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      fetchTransactions();
      setIsDeleteModalOpen(false);
      setDeletingTransaction(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (isLoading) {
    return <div>Loading transaction history...</div>;
  }

  return (
    <div className="py-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="max-w-xs break-words">Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction: Transaction) => (
            <TableRow key={transaction._id}>
              <TableCell>{format(new Date(transaction.transactionDate), 'PPP')}</TableCell>
              <TableCell>{transaction.transactionType}</TableCell>
              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell>{transaction.paymentMode}</TableCell>
              <TableCell>{transaction.status}</TableCell>
              <TableCell className="max-w-xs break-words">{transaction.description}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(transaction)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Transaction Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-full w-[90vw] sm:max-w-3xl px-2">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter amount"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter transaction description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Transaction Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="SUCCESS">Success</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Transaction</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-full w-[90vw] sm:max-w-2xl px-2">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this transaction?</p>
            {deletingTransaction && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Transaction Details:</p>
                <p className="text-sm text-gray-600">
                  Amount: {formatCurrency(deletingTransaction.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  Date: {format(new Date(deletingTransaction.transactionDate), 'dd/MM/yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  Description: {deletingTransaction.description}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 