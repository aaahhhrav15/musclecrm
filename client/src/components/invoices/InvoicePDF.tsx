import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  category?: string;
  duration?: string;
  startDate?: string;
}

interface Customer {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Gym {
  name?: string;
  logo?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: Customer;
  items: InvoiceItem[];
  amount: number;
  createdAt: string;
  notes?: string;
  bookingId?: {
    type: string;
  };
  gym?: Gym;
}

interface InvoicePDFProps {
  invoice: Invoice;
}

// Utility functions
const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};

const formatCurrency = (amount: number, currency = 'INR') => {
  const numAmount = parseFloat(amount?.toString() || '0');
  
  const formatted = numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `₹${formatted}`;
};

const generateItemSubtext = (item: InvoiceItem) => {
  const details = [];
  if (item.category) details.push(item.category);
  if (item.duration) details.push(`${item.duration}`);
  if (item.startDate) details.push(`From ${formatDate(item.startDate)}`);
  return details.join(' • ');
};

// Modern Icon Components
const EmailIcon = () => (
  <svg className="w-4 h-4 inline mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4 inline mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4 inline mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const WebIcon = () => (
  <svg className="w-4 h-4 inline mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
  </svg>
);

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const gym = invoice.gym || {};
  const customer = invoice.customerId || {};
  const items = invoice.items || [];
  const totalAmount = invoice.amount || items.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Enhanced address formatting
  const formatAddress = (address: Gym['address']) => {
    if (!address) return '';
    const parts = [
      address.street,
      [address.city, address.state].filter(Boolean).join(', '),
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Enhanced contact formatting
  const formatContact = (contactInfo: Gym['contactInfo']) => {
    if (!contactInfo) return '';
    const parts = [];
    if (contactInfo.phone) parts.push(`Phone: ${contactInfo.phone}`);
    if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`);
    if (contactInfo.website) parts.push(`Web: ${contactInfo.website}`);
    return parts.join('  |  ');
  };

  // Handle logo loading
  useEffect(() => {
    if (gym.logo && !gym.logo.startsWith('data:image/')) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setLogoLoaded(true);
      img.onerror = () => setLogoError(true);
      img.src = gym.logo;
    } else if (gym.logo) {
      setLogoLoaded(true);
    }
  }, [gym.logo]);

  const generatePDF = async () => {
    if (!pdfRef.current) return;

    setIsGenerating(true);
    try {
      // Wait a bit for any images to fully load and layout to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(pdfRef.current, {
        scale: 1.5, // Increased scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
        foreignObjectRendering: false,
        removeContainer: true,
        imageTimeout: 15000,
        ignoreElements: (element) => {
          // Ignore any elements that might cause layout shifts
          if (element instanceof HTMLElement) {
            return element.classList.contains('ignore-pdf') || 
                   element.style.position === 'fixed' ||
                   element.style.position === 'absolute';
          }
          return false;
        },
        onclone: (clonedDoc) => {
          // Ensure the cloned document has proper dimensions and layout
          const clonedElement = clonedDoc.querySelector('[data-pdf-content]') || clonedDoc.body;
          if (clonedElement && clonedElement instanceof HTMLElement) {
            clonedElement.style.width = '794px';
            clonedElement.style.maxWidth = '794px';
            clonedElement.style.overflow = 'hidden';
            clonedElement.style.position = 'relative';
            
            // Fix any flexbox or grid layout issues
            const flexContainers = clonedElement.querySelectorAll('.flex, .grid');
            flexContainers.forEach((container) => {
              if (container instanceof HTMLElement) {
                container.style.display = container.classList.contains('grid') ? 'grid' : 'flex';
                container.style.position = 'relative';
              }
            });
            
            // Ensure proper text alignment
            const textElements = clonedElement.querySelectorAll('h1, h2, h3, p, span, div');
            textElements.forEach((element) => {
              if (element instanceof HTMLElement) {
                element.style.position = 'relative';
                element.style.transform = 'none';
                element.style.transition = 'none';
              }
            });
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm (corrected)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Action Button */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            <div className="relative flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isGenerating ? 'Generating PDF...' : 'Download PDF'}</span>
            </div>
          </button>
        </div>

        {/* PDF Content Container */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div 
            ref={pdfRef}
            data-pdf-content
            className="bg-white relative pdf-content"
            style={{ 
              width: '794px', 
              minHeight: '1123px', 
              margin: '0 auto',
              maxWidth: '794px',
              overflow: 'hidden'
            }}
          >
            <style>
              {`
                .pdf-content h1.text-white {
                  -webkit-text-fill-color: white !important;
                  color: white !important;
                }
                
                /* Ensure layout consistency during PDF generation */
                .pdf-content * {
                  box-sizing: border-box !important;
                }
                
                .pdf-content .flex {
                  display: flex !important;
                  position: relative !important;
                }
                
                .pdf-content .grid {
                  display: grid !important;
                  position: relative !important;
                }
                
                .pdf-content .relative {
                  position: relative !important;
                }
                
                .pdf-content .absolute {
                  position: absolute !important;
                }
                
                /* Prevent layout shifts */
                .pdf-content h1, .pdf-content h2, .pdf-content h3,
                .pdf-content p, .pdf-content span, .pdf-content div {
                  position: relative !important;
                  transform: none !important;
                  transition: none !important;
                }
                
                /* Ensure proper spacing and alignment */
                .pdf-content .space-y-6 > * + * {
                  margin-top: 1.5rem !important;
                }
                
                .pdf-content .space-y-4 > * + * {
                  margin-top: 1rem !important;
                }
                
                .pdf-content .space-y-3 > * + * {
                  margin-top: 0.75rem !important;
                }
                
                .pdf-content .space-y-2 > * + * {
                  margin-top: 0.5rem !important;
                }
                
                /* Fix grid layouts */
                .pdf-content .grid-cols-2 {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
                
                .pdf-content .grid-cols-12 {
                  grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
                }
                
                .pdf-content .gap-6 {
                  gap: 1.5rem !important;
                }
                
                .pdf-content .gap-4 {
                  gap: 1rem !important;
                }
              `}
            </style>

            {/* Modern Header with Geometric Pattern */}
            <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-blue-400 rounded-full -translate-x-20 -translate-y-20"></div>
                <div className="absolute top-20 right-0 w-32 h-32 bg-purple-400 rounded-full translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-indigo-400 rounded-full translate-y-12"></div>
              </div>
              
              <div className="relative px-8 py-10">
                <div className="flex justify-between items-start">
                  {/* Company Info Section */}
                  <div className="flex items-start space-x-6">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                      {gym.logo && logoLoaded && !logoError ? (
                        <img 
                          src={gym.logo} 
                          alt="Logo" 
                          className="w-14 h-14 rounded-xl object-contain"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {gym.name?.charAt(0) || 'G'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <h1 className="text-4xl font-bold text-white" style={{ WebkitTextFillColor: 'white' }}>
                        {gym.name || 'Fitness Studio'}
                      </h1>
                                              <div className="space-y-2 text-white/90">
                        <div className="flex items-center">
                          <LocationIcon />
                          <span className="text-sm">{formatAddress(gym.address) || 'Your Address Here'}</span>
                        </div>
                        {gym.contactInfo?.phone && (
                          <div className="flex items-center">
                            <PhoneIcon />
                            <span className="text-sm">{gym.contactInfo.phone}</span>
                          </div>
                        )}
                        {gym.contactInfo?.email && (
                          <div className="flex items-center">
                            <EmailIcon />
                            <span className="text-sm">{gym.contactInfo.email}</span>
                          </div>
                        )}
                        {gym.contactInfo?.website && (
                          <div className="flex items-center">
                            <WebIcon />
                            <span className="text-sm">{gym.contactInfo.website}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Invoice Details Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl min-w-[280px]">
                    <div className="text-center space-y-4">
                      <div>
                        <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">Invoice</p>
                        <p className="text-2xl font-bold text-white">
                          {invoice.invoiceNumber || 'INR-001'}
                        </p>
                      </div>
                      <div className="h-px bg-white/20"></div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Issue Date:</span>
                          <span className="text-white font-semibold">{formatDate(invoice.createdAt)}</span>
                        </div>
                        {invoice.bookingId && (
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">Service:</span>
                            <span className="text-white font-semibold">{invoice.bookingId.type}</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2">
                        <span className="inline-block bg-green-500/20 text-green-100 text-xs font-bold px-4 py-2 rounded-full border border-green-400/30">
                          ISSUED
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="px-8 py-8 space-y-6" style={{ minHeight: '400px', position: 'relative' }}>
              {/* Billing Information Cards */}
              <div className="grid grid-cols-2 gap-6">
                {/* Bill To Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200/50 shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">Bill To</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-slate-900">{customer.name || 'Customer Name'}</p>
                    {customer.email && (
                      <div className="flex items-center text-slate-600">
                        <EmailIcon />
                        <span className="text-sm">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center text-slate-600">
                        <PhoneIcon />
                        <span className="text-sm">{customer.phone}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start text-slate-600">
                        <LocationIcon />
                        <span className="text-sm leading-relaxed">{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Summary Card */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-5 border border-slate-200/50 shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-3 h-8 bg-gradient-to-b from-slate-500 to-gray-600 rounded-full"></div>
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">Invoice Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Issue Date:</span>
                      <span className="font-bold text-slate-900">{formatDate(invoice.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Currency:</span>
                      <span className="font-bold text-slate-900">Indian Rupees (₹)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Total Amount:</span>
                      <span className="font-bold text-lg text-indigo-600">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modern Items Table */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/50" style={{ marginBottom: '20px' }}>
                {/* Table Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4">
                  <div className="grid grid-cols-12 gap-4 items-center text-sm font-bold uppercase tracking-wider">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-center">Unit Price</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                </div>
                
                {/* Table Body */}
                <div className="divide-y divide-slate-100">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 transition-colors hover:bg-slate-50 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-6">
                            <p className="font-semibold text-slate-900 text-base">{item.description || 'Service'}</p>
                            <p className="text-xs text-slate-500 mt-1 italic">{generateItemSubtext(item)}</p>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold">
                              {item.quantity || 1}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-slate-700 font-medium">
                              {formatCurrency(item.unitPrice || 0)}
                            </span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="font-bold text-base text-indigo-600">
                              {formatCurrency(item.amount || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <div className="text-slate-400 text-lg italic">No items found</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Summary Card */}
              <div className="flex justify-end">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-5 shadow-2xl min-w-[280px]">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold uppercase tracking-wide">Total Amount:</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {invoice.notes && invoice.notes.trim() && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-amber-800 mb-2">Special Notes</h3>
                      <p className="text-amber-700 leading-relaxed text-sm">{invoice.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modern Footer */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden px-8 py-8">
              <div className="relative text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-white">
                    Thank you for choosing {gym.name || 'our fitness studio'}!
                  </p>
                  <p className="text-slate-300 text-sm">
                    This invoice was generated electronically and is valid without signature.
                  </p>
                </div>
                
                <div className="h-px bg-slate-700 max-w-md mx-auto"></div>
                
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm">
                    Questions? Contact us at {gym.contactInfo?.email || 'info@gym.com'}
                  </p>
                  <p className="text-white font-bold">
                    <span className="text-blue-400">
                      Powered by MuscleCRM
                    </span>
                    <span className="text-slate-300"> • Premium Fitness Management</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDF;