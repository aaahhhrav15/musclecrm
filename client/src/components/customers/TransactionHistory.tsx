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
import transactionService from '@/services/transactionService';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  _id: string;
  userId: string;
  gymId: string;
  transactionDate: string;
  amount: number;
  paymentMode: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionHistoryProps {
  userId: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await transactionService.getUserTransactions(userId);
      setTransactions(data);
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
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>
                  {format(new Date(transaction.transactionDate), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                <TableCell className="capitalize">
                  {transaction.paymentMode.replace('_', ' ')}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}; 