# 📢 AdMock API

AdMock API is a lightweight, customizable ad service designed to help developers integrate mock ads into their applications for testing or demo purposes.

## 🚀 Features
- 🖼️ **Mock Ads** – Serve test ads for development and QA.
- 📡 **REST API** – Simple API endpoints for ad retrieval.
- 📊 **Ad Tracking** – Log ad impressions and clicks.
- 🔧 **Customizable Responses** – Configure ad content dynamically.
- 🔥 **Firestore Integration** – Store and retrieve ad event data.

---

## 📦 Installation
### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/RonOhayon/AdMock_API.git
cd AdMock_API
```

### **2️⃣ Install Dependencies**
```sh
npm install
```

### **3️⃣ Set Up Firebase**
Create a `.env` file in the project root and add your Firebase credentials:
```sh
FIREBASE_SERVICE_ACCOUNT={ "type": "service_account", "project_id": "your_project_id", ... }
```

### **4️⃣ Run the Server**
```sh
node server.js
```

By default, the API runs on `http://localhost:3000/`.

---

## 🛠️ API Endpoints
### **📡 Test API Connection**
```sh
GET /
```
#### **Response:**
```json
{ "message": "Server is running" }
```

### **📊 Get Stats for a Package**
```sh
GET /api/stats/:packageId
```
#### **Response:**
```json
{
  "packageId": "com.example.app",
  "stats": {
    "totalViews": 100,
    "totalClicks": 10,
    "ctr": "10.00"
  },
  "events": [
    { "id": "doc1", "type": "view", "timestamp": "2024-02-02T12:00:00Z" }
  ]
}
```

### **📊 Get Overall Stats**
```sh
GET /stats
```
#### **Response:**
```json
{
  "success": true,
  "totalViews": 500,
  "totalClicks": 50
}
```

### **🖱️ Record an Ad View**
```sh
POST /api/adtrack/view
```
#### **Request Body:**
```json
{
  "packageId": "com.example.app",
  "adId": "test_ad_1",
  "deviceId": "device_123"
}
```
#### **Response:**
```json
{
  "success": true,
  "message": "Ad view recorded",
  "documentId": "doc_123"
}
```

### **🔗 Record an Ad Click**
```sh
POST /api/adtrack/click
```
#### **Request Body:**
```json
{
  "packageId": "com.example.app",
  "adId": "test_ad_1",
  "deviceId": "device_123"
}
```
#### **Response:**
```json
{
  "success": true,
  "message": "Ad click recorded",
  "documentId": "doc_456"
}
```

---

## 🔧 Configuration
Modify `config.js` to adjust API settings such as:
- Default ad responses
- Logging levels
- Firebase Firestore configurations

---

## 📜 License
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing
Contributions are welcome! Feel free to submit issues and pull requests.

📩 Contact: [GitHub Issues](https://github.com/RonOhayon/AdMock_API/issues)

---

## ⭐ Support
If you find this project useful, consider giving it a **⭐ star** on GitHub!

