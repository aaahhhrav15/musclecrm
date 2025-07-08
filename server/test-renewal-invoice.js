const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/MuscleCRM';

async function testRenewalInvoiceCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up test data
    await Customer.deleteMany({ email: 'renewal-test@example.com' });
    await Invoice.deleteMany({ customerId: { $in: await Customer.find({ email: 'renewal-test@example.com' }).distinct('_id') } });

    // Create a test customer with initial membership
    const testCustomer = new Customer({
      userId: new mongoose.Types.ObjectId(), // Mock user ID
      gymId: new mongoose.Types.ObjectId(), // Mock gym ID
      name: 'Renewal Test Customer',
      email: 'renewal-test@example.com',
      phone: '1234567890',
      source: 'walk-in',
      membershipType: 'basic',
      membershipFees: 2000,
      membershipDuration: 6,
      joinDate: new Date(),
      membershipStartDate: new Date(),
      membershipEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      transactionDate: new Date(),
      paymentMode: 'card',
      totalSpent: 2000
    });

    await testCustomer.save();
    console.log('✅ Test customer created:', testCustomer.name);

    // Simulate renewal by updating the customer
    const renewalData = {
      membershipType: 'premium',
      membershipFees: 5000,
      membershipDuration: 12,
      membershipStartDate: new Date(),
      membershipEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      totalSpent: testCustomer.totalSpent + 5000,
      transactionDate: new Date(),
      paymentMode: 'card'
    };

    console.log('🔄 Simulating renewal with data:', renewalData);

    // Update customer (simulating the PUT request)
    const updatedCustomer = await Customer.findByIdAndUpdate(
      testCustomer._id,
      renewalData,
      { new: true }
    );

    console.log('✅ Customer updated for renewal');

    // Check if invoice was created (this would normally be done by the route)
    const invoice = await Invoice.findOne({ customerId: testCustomer._id });
    if (invoice) {
      console.log('✅ Invoice found:', invoice.invoiceNumber);
      console.log('   Amount:', invoice.amount);
      console.log('   Status:', invoice.status);
      console.log('   Items:', invoice.items);
    } else {
      console.log('❌ No invoice found for customer');
    }

    // Clean up
    await Customer.deleteOne({ _id: testCustomer._id });
    if (invoice) {
      await Invoice.deleteOne({ _id: invoice._id });
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
testRenewalInvoiceCreation(); 