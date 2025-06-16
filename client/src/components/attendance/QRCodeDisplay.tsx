import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  gymId: string;
  gymName: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  isOpen,
  onClose,
  gymId,
  gymName,
}) => {
  const [gymCode, setGymCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGymCode = async () => {
      try {
        const response = await axiosInstance.get('/gym/info');
        if (response.data.success && response.data.gym) {
          setGymCode(response.data.gym.gymCode);
        }
      } catch (error) {
        console.error('Error fetching gym code:', error);
        toast({
          title: "Error",
          description: "Failed to load gym code",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchGymCode();
    }
  }, [isOpen, toast]);

  const qrValue = `https://web-production-6057.up.railway.app/mark_attendance/${gymCode}`;
  console.log("qrValue is ", qrValue);
  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const svg = document.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = 'qr-code.png';
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gym QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 p-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={qrValue}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code to check in at {gymName}
              </p>
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay; 