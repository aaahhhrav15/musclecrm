import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.musclecrm.com/api';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && isScanning) {
      // Initialize scanner
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      // Start scanning
      scannerRef.current.render(handleScan, handleError);
    }

    // Cleanup
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isOpen, isScanning]);

  const handleScan = async (decodedText: string) => {
    if (!isProcessing) {
      setIsProcessing(true);
      try {
        // Parse the QR code data
        const data = JSON.parse(decodedText);
        
        // Send check-in request to backend
        const response = await axios.post(`${API_URL}/gym/attendance/check-in`, {
          memberId: data.memberId,
          notes: 'QR Code check-in'
        });

        if (response.data.success) {
          toast({
            title: "Check-in Successful",
            description: `Welcome ${response.data.data.memberId.name}!`,
          });
          onSuccess();
          onClose();
        }
      } catch (error: any) {
        toast({
          title: "Check-in Failed",
          description: error.response?.data?.message || "Failed to process check-in",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleError = (error: string) => {
    console.error('QR Scanner Error:', error);
    toast({
      title: "Scanner Error",
      description: "Failed to access camera. Please check permissions.",
      variant: "destructive",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-square w-full max-w-sm mx-auto">
          {isScanning ? (
            <div id="qr-reader" className="w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <QrCode className="h-32 w-32 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setIsScanning(!isScanning)}
            disabled={isProcessing}
          >
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </Button>
          {isProcessing && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner; 