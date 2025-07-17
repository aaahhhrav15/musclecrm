import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5001';

const WaiverFormsPage: React.FC = () => {
  const handleDownload = async () => {
    try {
      // Fetch the PDF file as a blob
      const response = await axios.get(`${API_BASE_URL}/api/waiver-forms/download`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Create a blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'gym-waiver-form.pdf';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      toast.success('Waiver form downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download waiver form');
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
          <h1 className="text-2xl font-semibold text-gray-900">Member Onboarding Documents</h1>
          <p className="text-gray-500 mt-1">
            Access and manage member waiver forms and other onboarding documents
          </p>
        </div>

        {/* Waiver Form Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-xl">Download Member Waiver Form</CardTitle>
              <CardDescription>
                Print this form and collect a signed copy from new members during registration.
                This form includes liability waivers and health declarations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Form Includes:</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Liability Waiver</li>
                    <li>Health Declaration</li>
                    <li>Emergency Contact Information</li>
                    <li>Photo/Video Release</li>
                    <li>Terms and Conditions</li>
                  </ul>
                </div>
                <Button
                  onClick={handleDownload}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Waiver Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default WaiverFormsPage; 