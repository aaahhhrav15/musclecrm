const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');
const Transaction = require('./models/Transaction');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/MuscleCRM';

async function testManualInvoiceTransaction() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up test data
    await Customer.deleteMany({ email: 'manual-invoice-test@example.com' });
    await Invoice.deleteMany({ customerId: { $in: await Customer.find({ email: 'manual-invoice-test@example.com' }).distinct('_id') } });
    await Transaction.deleteMany({ userId: { $in: await Customer.find({ email: 'manual-invoice-test@example.com' }).distinct('_id') } });

    // Create a test customer
    const testCustomer = new Customer({
      userId: new mongoose.Types.ObjectId(), // Mock user ID
      gymId: new mongoose.Types.ObjectId(), // Mock gym ID
      name: 'Manual Invoice Test Customer',
      email: 'manual-invoice-test@example.com',
      phone: '1234567890',
      source: 'walk-in',
      membershipType: 'premium',
      membershipFees: 5000,
      membershipDuration: 12,
      joinDate: new Date(),
      membershipStartDate: new Date(),
      membershipEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      transactionDate: new Date(),
      paymentMode: 'card',
      totalSpent: 5000
    });

    await testCustomer.save();
    console.log('✅ Test customer created:', testCustomer.name);

    // Simulate manual invoice creation
    const invoiceData = {
      customerId: testCustomer._id,
      items: [
        {
          description: 'Personal Training Session',
          quantity: 5,
          unitPrice: 1000,
          amount: 5000
        }
      ],
      amount: 5000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Manual invoice for personal training sessions',
      status: 'pending',
      currency: 'INR'
    };

    console.log('🔄 Creating manual invoice with data:', invoiceData);

    // Create invoice (simulating the POST request)
    const invoice = new Invoice({
      userId: testCustomer.userId,
      gymId: testCustomer.gymId,
      customerId: testCustomer._id,
      invoiceNumber: 'INV00001',
      items: invoiceData.items,
      amount: invoiceData.amount,
      currency: invoiceData.currency,
      status: invoiceData.status,
      dueDate: invoiceData.dueDate,
      notes: invoiceData.notes
    });

    await invoice.save();
    console.log('✅ Invoice created:', invoice.invoiceNumber);

    // Check if transaction was created (this would normally be done by the route)
    const transaction = await Transaction.findOne({ userId: testCustomer._id });
    if (transaction) {
      console.log('✅ Transaction found:', transaction._id);
      console.log('   Type:', transaction.transactionType);
      console.log('   Amount:', transaction.amount);
      console.log('   Status:', transaction.status);
      console.log('   Description:', transaction.description);
    } else {
      console.log('❌ No transaction found for customer');
    }

    // Clean up
    await Customer.deleteOne({ _id: testCustomer._id });
    if (invoice) {
      await Invoice.deleteOne({ _id: invoice._id });
    }
    if (transaction) {
      await Transaction.deleteOne({ _id: transaction._id });
    }

    console.log('🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testManualInvoiceTransaction(); 