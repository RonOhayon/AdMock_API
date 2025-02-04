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

app.get('/api/stats/:packageId', async (req, res) => {
  try {
      const { packageId } = req.params;
      console.log('Fetching stats for package:', packageId);

      const snapshot = await db.collection('ad_events')
          .where('packageId', '==', packageId)
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
          
          // Count views and clicks
          if (data.type === 'view') views++;
          if (data.type === 'click') clicks++;
      });

      res.json({
          packageId,
          stats: {
              totalViews: views,
              totalClicks: clicks,
              ctr: views > 0 ? (clicks / views * 100).toFixed(2) : 0
          },
          events: events
      });

  } catch (error) {
      console.error('Error fetching package stats:', error);
      res.status(500).json({ error: 'Failed to fetch package stats' });
  }
});
app.get('/stats', async (req, res) => {
    try {
      console.log('Fetching stats...');
  
      // Suppose your ad events are in `ad_events` collection
      const snapshot = await db.collection('ad_events').get();
  
      let totalViews = 0;
      let totalClicks = 0;
  
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'view') totalViews++;
        if (data.type === 'click') totalClicks++;
      });
  
      res.json({
        success: true,
        totalViews,
        totalClicks,

      });
    } catch (error) {
      console.error('Firestore stats error:', {
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
app.post('/api/adtrack/view/arrays', async (req, res) => {
  try {
      let events = req.body;

      // Ensure the request is an array
      if (!Array.isArray(events)) {
          events = [events]; // Convert single object to an array
      }

      const results = [];

      for (const event of events) {
          const { packageId, adId, deviceId, timestamp } = event;

          if (!packageId || !adId || !deviceId || !timestamp) {
              return res.status(400).json({ error: 'Missing required fields' });
          }

          const viewData = {
              packageId,
              adId,
              deviceId,
              type: 'view',
              timestamp: new Date(timestamp) // Convert to JavaScript Date object
          };

          const docRef = await db.collection('ad_events').add(viewData);
          results.push({ success: true, documentId: docRef.id });
      }

      res.status(201).json({
          success: true,
          message: `${results.length} views recorded`,
          results
      });

  } catch (error) {
      console.error('Error recording views:', error);
      res.status(500).json({
          success: false,
          error: error.message
      });
  }
});

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


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Test the Firestore connection at /test');
});