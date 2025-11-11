/**
 * Script to set admin custom claims for Firebase users
 * 
 * Usage:
 * 1. Make sure you're logged in: firebase login
 * 2. Run: node scripts/setAdminClaim.js <email>
 * 
 * Example: node scripts/setAdminClaim.js admin@example.com
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Please provide an email address');
  console.log('Usage: node scripts/setAdminClaim.js <email>');
  console.log('Example: node scripts/setAdminClaim.js admin@example.com\n');
  process.exit(1);
}

// Try to initialize Firebase Admin with different methods
let initialized = false;

// Method 1: Try with service account key if it exists (optional)
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized with service account\n');
    initialized = true;
  } catch (error) {
    console.log('⚠️  Service account initialization failed, trying alternative method...\n');
  }
}

// Method 2: Use application default credentials (works with Firebase CLI)
if (!initialized) {
  try {
    admin.initializeApp({
      projectId: 'pageperfectai',
      credential: admin.credential.applicationDefault()
    });
    console.log('✅ Firebase Admin initialized with application default credentials\n');
    initialized = true;
  } catch (error) {
    console.log('⚠️  Application default credentials failed, trying project ID only...\n');
  }
}

// Method 3: Initialize with just project ID (for some environments)
if (!initialized) {
  try {
    admin.initializeApp({
      projectId: 'pageperfectai'
    });
    console.log('✅ Firebase Admin initialized\n');
    initialized = true;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    console.log('\n💡 Try running: firebase login');
    console.log('Or download service account key to scripts/serviceAccountKey.json\n');
    process.exit(1);
  }
}

// Set admin claim
async function setAdminClaim(userEmail) {
  try {
    console.log(`🔍 Looking up user: ${userEmail}...`);
    
    // Get user by email
    const user = await admin.auth().getUserByEmail(userEmail);
    console.log(`✅ User found: ${user.uid}`);
    
    // Set custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin claim set for ${userEmail}`);
    
    console.log('\n📋 Important Notes:');
    console.log('1. The user must sign out and sign in again for the claim to take effect');
    console.log('2. You can verify the claim in Firebase Console > Authentication > Users');
    console.log('3. The user can now access the admin panel at /admin\n');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: User ${userEmail} not found`);
      console.log('Make sure the user has already signed up in the application.\n');
    } else {
      console.error('❌ Error setting admin claim:', error.message);
    }
    process.exit(1);
  }
}

// Run the script
setAdminClaim(email);