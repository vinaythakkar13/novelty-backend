import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseAdmin;

try {
    // We expect either a path to service account JSON or the JSON string itself
    let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

    if (serviceAccount && serviceAccount.private_key) {
        // Handle escaped newlines in environment variables
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (serviceAccount) {
        firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully');
    } else {
        console.warn('Firebase Service Account credentials missing. Notifications will be disabled.');
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
}

export default firebaseAdmin;
