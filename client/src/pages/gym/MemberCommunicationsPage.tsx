import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Users, User } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = 'https://api.musclecrm.com';

interface Customer {
  _id: string;
  userId: string;
  gymId: string;
  name: string;
  email: string;
  phone: string;
}

interface ApiResponse {
  success: boolean;
  customers: Customer[];
  total: number;
}

type MessageType = 'broadcast' | 'individual';

const MemberCommunicationsPage: React.FC = () => {
  const [whatsappContent, setWhatsappContent] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>('broadcast');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (messageType === 'individual') {
      fetchCustomers();
    }
  }, [messageType]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching customers...');
      
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/api/customers`);
      console.log('API Response:', response);
      
      if (!response.data) {
        throw new Error('No data received from API');
      }

      if (!response.data.success) {
        throw new Error('API request was not successful');
      }

      if (!Array.isArray(response.data.customers)) {
        console.error('Invalid customers data:', response.data.customers);
        throw new Error('Invalid customers data format');
      }

      console.log('Customers data:', response.data.customers);
      setCustomers(response.data.customers);
      
      if (response.data.customers.length === 0) {
        setError('No customers found');
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch customers');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!whatsappContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (messageType === 'individual' && !selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    try {
      setIsLoading(true);
      if (messageType === 'broadcast') {
        await axios.post(`${API_BASE_URL}/api/communications/whatsapp/broadcast`, {
          content: whatsappContent
        });
        toast.success('WhatsApp broadcast sent successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/communications/whatsapp/individual`, {
          customerId: selectedCustomer,
          content: whatsappContent
        });
        toast.success('WhatsApp message sent successfully');
      }
      setWhatsappContent('');
      setSelectedCustomer('');
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast.error('Failed to send WhatsApp message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Customer Communications</h1>
          <p className="text-gray-500 mt-1">
            Send WhatsApp messages to your customers
          </p>
        </div>

        {/* Communications Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-xl">Send WhatsApp Messages</CardTitle>
              <CardDescription>
                Choose to send a broadcast or individual message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Message Type Selection */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => setMessageType('broadcast')}
                    variant={messageType === 'broadcast' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Broadcast to All
                  </Button>
                  <Button
                    onClick={() => setMessageType('individual')}
                    variant={messageType === 'individual' ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Send to Individual
                  </Button>
                </div>

                {/* Customer Selection (only for individual messages) */}
                {messageType === 'individual' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Select Customer</label>
                    <Select
                      value={selectedCustomer}
                      onValueChange={setSelectedCustomer}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={isLoading ? "Loading customers..." : "Select a customer"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading customers...
                          </SelectItem>
                        ) : error ? (
                          <SelectItem value="error" disabled>
                            {error}
                          </SelectItem>
                        ) : customers && customers.length > 0 ? (
                          customers.map((customer) => (
                            <SelectItem key={customer._id} value={customer._id}>
                              {customer.name} ({customer.phone})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No customers available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {error && (
                      <p className="mt-2 text-sm text-red-500">{error}</p>
                    )}
                  </div>
                )}

                {/* Message Input */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <Textarea
                    placeholder="Enter your WhatsApp message"
                    value={whatsappContent}
                    onChange={(e) => setWhatsappContent(e.target.value)}
                    className="mt-1 h-40"
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || (messageType === 'individual' && !selectedCustomer)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isLoading ? 'Sending...' : `Send ${messageType === 'broadcast' ? 'Broadcast' : 'Message'}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MemberCommunicationsPage; 