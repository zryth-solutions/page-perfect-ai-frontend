/**
 * Script to add user documents to Firestore for existing Firebase Auth users
 * Run this script once to create user documents for users who don't have them yet
 */

const admin = require('firebase-admin');
const serviceAccount = require('../path-to-your-service-account-key.json'); // Update this path

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Add user documents for authenticated users
 */
async function addUserDocuments() {
  const users = [
    {
      uid: 'yRW0CC2zYsOeJ57yoGxwdX...', // Replace with actual UID from Firebase Auth
      email: 'manas@zryth.com',
      role: 'user', // Change to 'admin' if needed
    },
    {
      uid: 'u8afn4km570p95VaTgMAAJhZ...', // Replace with actual UID from Firebase Auth
      email: 'sharshit416@gmail.com',
      role: 'user', // Change to 'admin' if needed
    }
  ];

  try {
    for (const user of users) {
      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          email: user.email,
          role: user.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ Created user document for ${user.email}`);
      } else {
        console.log(`ℹ️  User document already exists for ${user.email}`);
      }
    }

    console.log('\n✅ All user documents processed successfully!');
  } catch (error) {
    console.error('❌ Error adding user documents:', error);
  } finally {
    process.exit(0);
  }
}

addUserDocuments();

