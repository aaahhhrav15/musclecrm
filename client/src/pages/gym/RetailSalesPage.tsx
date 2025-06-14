import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RetailSale {
  _id: string;
  productName: string;
  quantity: number;
  price: number;
  totalAmount: number;
  saleDate: string;
  gymId: string;
}

const RetailSalesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<RetailSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSale, setEditingSale] = useState<RetailSale | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    quantity: 1,
    price: 0,
    saleDate: new Date()
  });
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/gym/retail-sales');
      setSales(response.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (sale?: RetailSale) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        productName: sale.productName,
        quantity: sale.quantity,
        price: sale.price,
        saleDate: new Date(sale.saleDate)
      });
    } else {
      setEditingSale(null);
      setFormData({
        productName: '',
        quantity: 1,
        price: 0,
        saleDate: new Date()
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSale(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saleData = {
        ...formData,
        totalAmount: formData.quantity * formData.price
      };

      if (editingSale) {
        await axios.put(`/api/gym/retail-sales/${editingSale._id}`, saleData);
        toast({
          title: "Success",
          description: "Sale updated successfully",
        });
      } else {
        await axios.post('/api/gym/retail-sales', saleData);
        toast({
          title: "Success",
          description: "Sale added successfully",
        });
      }

      handleCloseDialog();
      fetchSales();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save sale",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await axios.delete(`/api/gym/retail-sales/${id}`);
        toast({
          title: "Success",
          description: "Sale deleted successfully",
        });
        fetchSales();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete sale",
          variant: "destructive",
        });
      }
    }
  };

  const filteredSales = sales
    .filter(sale => !dateFilter || new Date(sale.saleDate).toDateString() === dateFilter.toDateString())
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'date':
          return multiplier * (new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
        case 'amount':
          return multiplier * (a.totalAmount - b.totalAmount);
        case 'product':
          return multiplier * a.productName.localeCompare(b.productName);
        default:
          return 0;
      }
    });

  const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Retail Sales</h1>
              <p className="text-gray-600 mt-1">Manage your gym's retail sales and track revenue</p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Sale
            </Button>
          </div>
        </div>

        {/* Stats and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Sales Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Sales</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">${totalAmount.toFixed(2)}</p>
          </div>

          {/* Filters */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dateFilter">Filter by Date</Label>
                <Input
                  id="dateFilter"
                  type="date"
                  value={dateFilter ? format(dateFilter, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setDateFilter(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="product">Product</option>
                </select>
              </div>
              <div>
                <Label htmlFor="sortOrder">Order</Label>
                <Button
                  id="sortOrder"
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full"
                >
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${sale.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(sale.saleDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(sale)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(sale._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Sale Modal */}
        <Dialog open={openDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingSale ? 'Edit Sale' : 'Add New Sale'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    required
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleDate">Sale Date</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={format(formData.saleDate, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ ...formData, saleDate: new Date(e.target.value) })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSale ? 'Update' : 'Add'} Sale
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default RetailSalesPage; 