const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Initialize Firebase with environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'Server is running!' });
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

// Record ad click
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

// Get analytics for a specific package
app.get('/api/analytics/:packageId', async (req, res) => {
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
        
        const analytics = {
            totalViews: 0,
            totalClicks: 0,
            clickThroughRate: 0,
            events: []
        };

        snapshot.forEach(doc => {
            const event = doc.data();
            analytics.events.push({
                id: doc.id,
                ...event
            });
            
            if (event.type === 'view') analytics.totalViews++;
            if (event.type === 'click') analytics.totalClicks++;
        });

        analytics.clickThroughRate = analytics.totalViews > 0 
            ? (analytics.totalClicks / analytics.totalViews * 100).toFixed(2) 
            : 0;

        res.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get stats for chart
app.get('/stats', async (req, res) => {
    try {
        const snapshot = await db.collection('ad_events')
            .where('type', '==', 'view')
            .orderBy('timestamp', 'asc')
            .get();

        // Group views by date
        const viewsByDate = {};
        
        snapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firebase timestamp to date string
            const date = data.timestamp.toDate().toLocaleDateString();
            viewsByDate[date] = (viewsByDate[date] || 0) + 1;
        });

        // Format data for the chart
        const chartData = Object.keys(viewsByDate).map(date => ({
            name: date,
            views: viewsByDate[date]
        }));

        // Sort by date
        chartData.sort((a, b) => new Date(a.name) - new Date(b.name));

        res.json(chartData);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});