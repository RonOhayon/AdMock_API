const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

const db = admin.firestore();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Test Firestore connection
app.get('/test', async (req, res) => {
    try {
        console.log('Testing Firestore connection...');
        
        // Try to write a test document
        const docRef = await db.collection('test_collection').add({
            test: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('Test document written with ID:', docRef.id);
        
        res.json({
            success: true,
            message: 'Firestore connection successful',
            documentId: docRef.id
        });
    } catch (error) {
        console.error('Firestore test error:', {
            code: error.code,
            message: error.message
        });
        
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    }
});

// Record ad view
app.post('/api/adtrack/view', async (req, res) => {
    try {
        const { packageId, adId, deviceId } = req.body;
        
        if (!packageId || !adId || !deviceId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const viewData = {
            packageId,
            adId,
            deviceId,
            type: 'view',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('ad_events').add(viewData);
        
        res.status(201).json({
            success: true,
            message: 'Ad view recorded',
            documentId: docRef.id
        });
    } catch (error) {
        console.error('Error recording view:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Test the Firestore connection at /test');
});