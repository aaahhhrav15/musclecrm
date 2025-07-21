import * as React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer';

// Register fonts
Font.register({ family: 'Helvetica', src: undefined });
Font.register({ family: 'Helvetica-Bold', src: undefined, fontWeight: 'bold' });

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  
  // HEADER STYLES
  headerBanner: {
    backgroundColor: '#667EEA',
    background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 32,
    paddingRight: 32,
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    maxWidth: '65%',
  },
  logoContainer: {
    width: 72,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  companyInfo: {
    color: '#FFFFFF',
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  companyTagline: {
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  companyAddress: {
    fontSize: 9,
    opacity: 0.85,
    lineHeight: 1.3,
    maxWidth: 250,
  },
  invoiceBadge: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'flex-start',
    width: 180,
    maxWidth: '35%',
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 6,
  },
  invoiceDate: {
    fontSize: 10,
    color: '#718096',
    marginBottom: 8,
  },

  // CONTENT AREA
  contentArea: {
    paddingHorizontal: 32,
  },

  // BILLING SECTION
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  billToCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    borderLeft: '3 solid #667EEA',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#667EEA',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 6,
  },
  customerDetail: {
    fontSize: 9,
    color: '#718096',
    marginBottom: 3,
    lineHeight: 1.3,
  },
  invoiceInfoCard: {
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    padding: 16,
    width: '48%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 9,
    color: '#718096',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 10,
    color: '#2D3748',
    fontWeight: 'bold',
  },

  // TABLE STYLES
  tableContainer: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1 solid #E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#667EEA',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottom: '1 solid #F1F5F9',
    minHeight: 40,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#F8FAFC',
  },
  tableRowOdd: {
    backgroundColor: '#FFFFFF',
  },
  descriptionCell: {
    flex: 3,
    paddingRight: 8,
  },
  itemDescription: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 1,
  },
  itemSubtext: {
    fontSize: 8,
    color: '#718096',
    fontStyle: 'italic',
  },
  quantityCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  priceCell: {
    flex: 1.5,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  amountCell: {
    flex: 1.5,
    alignItems: 'flex-end',
    paddingLeft: 4,
  },
  cellText: {
    fontSize: 9,
    color: '#2D3748',
  },
  amountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#667EEA',
  },

  // SUMMARY SECTION
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    border: '2 solid #667EEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 200,
  },
  totalLabel: {
    fontSize: 12,
    color: '#667EEA',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginLeft: 16,
  },

  // NOTES SECTION
  notesSection: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderLeft: '4 solid #F56565',
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#C53030',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 10,
    color: '#744210',
    lineHeight: 1.6,
  },

  // PAYMENT TERMS
  paymentTerms: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderLeft: '4 solid #48BB78',
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2F855A',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  termItem: {
    fontSize: 10,
    color: '#2F855A',
    marginBottom: 6,
    paddingLeft: 12,
  },

  // FOOTER
  footer: {
    backgroundColor: '#2D3748',
    padding: 24,
    marginTop: 'auto',
  },
  footerContent: {
    alignItems: 'center',
  },
  footerText: {
    color: '#A0AEC0',
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerBrand: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
  },

  // DECORATIVE ELEMENTS
  decorativeLine: {
    height: 3,
    backgroundColor: '#667EEA',
    borderRadius: 2,
    marginVertical: 12,
  },
  statusBadge: {
    backgroundColor: '#C6F6D5',
    color: '#2F855A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
});

// Utility functions
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

function formatCurrency(amount, currency = 'INR') {
  const numAmount = parseFloat(amount || 0);
  
  // Format with Indian numbering system (lakhs/crores)
  const formatted = numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `Rs. ${formatted}`;
}

function generateItemSubtext(item) {
  const details = [];
  if (item.category) details.push(item.category);
  if (item.duration) details.push(`${item.duration} sessions`);
  if (item.startDate) details.push(`From ${formatDate(item.startDate)}`);
  return details.join(' • ');
}

const InvoicePDF = ({ invoice }) => {
  const gym = invoice.gym || {};
  const customer = invoice.customerId || {};
  const items = invoice.items || [];
  const totalAmount = invoice.amount || items.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Enhanced address formatting
  const formatAddress = (address) => {
    if (!address) return '';
    const parts = [
      address.street,
      [address.city, address.state].filter(Boolean).join(', '),
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.join('\n');
  };

  // Enhanced contact formatting
  const formatContact = (contactInfo) => {
    if (!contactInfo) return '';
    const parts = [];
    if (contactInfo.phone) parts.push(`Phone: ${contactInfo.phone}`);
    if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`);
    if (contactInfo.website) parts.push(`Web: ${contactInfo.website}`);
    return parts.join('  |  ');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* GRADIENT HEADER */}
        <View style={styles.headerBanner}>
          <View style={styles.headerContent}>
            <View style={styles.leftHeader}>
              <View style={styles.logoContainer}>
                {gym.logo && gym.logo.startsWith('data:image/') ? (
                  <Image src={gym.logo} style={styles.logo} />
                ) : (
                  <Text style={{ fontSize: 24, color: '#667EEA', fontWeight: 'bold' }}>
                    {gym.name?.charAt(0) || 'G'}
                  </Text>
                )}
              </View>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{gym.name || 'Fitness Studio'}</Text>
                <Text style={styles.companyAddress}>
                  {formatAddress(gym.address) || 'Your Address Here'}
                </Text>
                <Text style={styles.companyAddress}>
                  {formatContact(gym.contactInfo)}
                </Text>
              </View>
            </View>
            
            <View style={styles.invoiceBadge}>
              <Text style={styles.invoiceNumber}>Invoice Number: {invoice.invoiceNumber || 'INV-001'}</Text>
              <Text style={styles.invoiceDate}>{formatDate(invoice.createdAt)}</Text>
              <View style={styles.statusBadge}>
                <Text>ISSUED</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.contentArea}>
          {/* BILLING INFORMATION */}
          <View style={styles.billingSection}>
            <View style={styles.billToCard}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <Text style={styles.customerName}>{customer.name || 'Customer Name'}</Text>
              {customer.email && <Text style={styles.customerDetail}>Email: {customer.email}</Text>}
              {customer.phone && <Text style={styles.customerDetail}>Phone: {customer.phone}</Text>}
              {customer.address && <Text style={styles.customerDetail}>Address: {customer.address}</Text>}
            </View>

            <View style={styles.invoiceInfoCard}>
              <Text style={styles.sectionTitle}>Invoice Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Issue Date:</Text>
                <Text style={styles.infoValue}>{formatDate(invoice.createdAt)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Currency:</Text>
                <Text style={styles.infoValue}>Indian Rupees (Rs.)</Text>
              </View>
              {invoice.bookingId && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Service:</Text>
                  <Text style={styles.infoValue}>{invoice.bookingId.type}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ITEMS TABLE */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>Description</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'center' }]}>Price</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Amount</Text>
            </View>
            
            {items.length > 0 ? (
              items.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                  ]}
                >
                  <View style={styles.descriptionCell}>
                    <Text style={styles.itemDescription}>{item.description || 'Service'}</Text>
                    <Text style={styles.itemSubtext}>{generateItemSubtext(item)}</Text>
                  </View>
                  <View style={styles.quantityCell}>
                    <Text style={styles.cellText}>{item.quantity || 1}</Text>
                  </View>
                  <View style={styles.priceCell}>
                    <Text style={styles.cellText}>
                      {formatCurrency(item.unitPrice || 0)}
                    </Text>
                  </View>
                  <View style={styles.amountCell}>
                    <Text style={styles.amountText}>
                      {formatCurrency(item.amount || 0)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.tableRow, styles.tableRowEven]}>
                <Text style={[styles.cellText, { flex: 1, textAlign: 'center', fontStyle: 'italic' }]}>
                  No items found
                </Text>
              </View>
            )}
          </View>

          {/* TOTAL SUMMARY */}
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(totalAmount)}
              </Text>
            </View>
          </View>

          {/* NOTES */}
          {invoice.notes && invoice.notes.trim() && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Special Notes</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Thank you for choosing {gym.name || 'our fitness studio'}!
            </Text>
            <Text style={styles.footerText}>
              This invoice was generated electronically and is valid without signature.
            </Text>
            <Text style={styles.footerText}>
              Questions? Contact us at {gym.contactInfo?.email || 'info@gym.com'}
            </Text>
            <Text style={styles.footerBrand}>
              Powered by MuscleCRM • Premium Fitness Management
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;