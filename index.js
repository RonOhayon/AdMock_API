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

// 1. Record ad view
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

// 2. Record ad click
app.post('/api/adtrack/click', async (req, res) => {
    try {
        const { packageId, adId, deviceId } = req.body;
        
        if (!packageId || !adId || !deviceId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const clickData = {
            packageId,
            adId,
            deviceId,
            type: 'click',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('ad_events').add(clickData);
        
        res.status(201).json({
            success: true,
            message: 'Ad click recorded',
            documentId: docRef.id
        });
    } catch (error) {
        console.error('Error recording click:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 3. Get all events for a package
app.get('/api/analytics/package/:packageId', async (req, res) => {
    try {
        const { packageId } = req.params;
        const { startDate, endDate } = req.query;

        let query = db.collection('ad_events')
            .where('packageId', '==', packageId);

        if (startDate && endDate) {
            query = query
                .where('timestamp', '>=', new Date(startDate))
                .where('timestamp', '<=', new Date(endDate));
        }

        const snapshot = await query.get();
        const events = [];
        
        snapshot.forEach(doc => {
            events.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json({
            success: true,
            packageId,
            events,
            totalEvents: events.length
        });
    } catch (error) {
        console.error('Error fetching package events:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. Get analytics for a specific ad
app.get('/api/analytics/ad/:adId', async (req, res) => {
    try {
        const { adId } = req.params;
        const snapshot = await db.collection('ad_events')
            .where('adId', '==', adId)
            .get();

        const events = [];
        let views = 0;
        let clicks = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            events.push({
                id: doc.id,
                ...data
            });
            
            if (data.type === 'view') views++;
            if (data.type === 'click') clicks++;
        });

        res.json({
            success: true,
            adId,
            summary: {
                totalViews: views,
                totalClicks: clicks,
                ctr: views > 0 ? (clicks / views * 100).toFixed(2) + '%' : '0%'
            },
            events
        });
    } catch (error) {
        console.error('Error fetching ad analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. Get events by timeframe
app.get('/api/analytics/timeframe', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Both startDate and endDate are required'
            });
        }

        const snapshot = await db.collection('ad_events')
            .where('timestamp', '>=', new Date(startDate))
            .where('timestamp', '<=', new Date(endDate))
            .get();

        const events = [];
        snapshot.forEach(doc => {
            events.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json({
            success: true,
            timeframe: {
                start: startDate,
                end: endDate
            },
            events,
            totalEvents: events.length
        });
    } catch (error) {
        console.error('Error fetching events by timeframe:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});