const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import the ApiKey model
const ApiKey = require('./models/ApiKey');

async function fixAWSPermissions() {
  try {
    console.log('🔧 Adding results permissions to AWS API keys...\n');
    
    // Update all API keys to include results permissions
    const result = await ApiKey.updateMany(
      {}, // Update all documents
      {
        $addToSet: {
          permissions: {
            $each: ['results_create', 'results_read', 'results_update', 'results_delete']
          }
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} API keys with results permissions`);
    
    // Show all API keys and their permissions
    const apiKeys = await ApiKey.find({});
    console.log('\n📋 Current API Keys:');
    apiKeys.forEach((key, index) => {
      console.log(`\n${index + 1}. ${key.clientName} (${key.clientEmail})`);
      console.log(`   API Key: ${key.apiKey.substring(0, 20)}...`);
      console.log(`   Permissions: [${key.permissions.join(', ')}]`);
      console.log(`   Has results permissions: ${key.permissions.includes('results_create') && key.permissions.includes('results_read')}`);
    });
    
    console.log('\n🎉 All API keys now have results permissions!');
    
  } catch (error) {
    console.error('❌ Error updating permissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAWSPermissions();
