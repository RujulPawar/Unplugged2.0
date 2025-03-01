// index.js
const express = require('express');
const path = require('path');
require('dotenv').config();
const WebSocket = require('ws');
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 8000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Set view engine
app.set('view engine', 'ejs');
app.set("views", path.resolve("./views"));

// Route for login page
app.get('/', (req, res) => {
    return res.render("login", { errorMessage: null });
});


let parkingSpots = [
    { latitude: 28.7041, longitude: 77.1025, status: "Available" },
    { latitude: 28.7055, longitude: 77.1030, status: "Occupied" }
];

// Route to handle login submission
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const mockUser = {
        email: 'admin@gmail.com',
        password: 'Test@1234'
    };

    if (email === mockUser.email && password === mockUser.password) {
        return res.redirect('/nagarnetra');
    }
    res.render('login', { errorMessage: 'Invalid Email or Password' });
});

// Route to render nagarnetra.ejs
app.get('/nagarnetra', (req, res) => {
    return res.render('nagarnetra');
});

app.get('/environmental-monitoring', (req, res) => {
    return res.render('environmental-monitoring');
});

// MQTT
const options = {
    host: process.env.MQTT_HOST,
    port: parseInt(process.env.MQTT_PORT),
    protocol: 'mqtts',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
};

const client = mqtt.connect(options);

// Initialize the WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// MQTT setup
client.on('connect', function () {
    console.log('Connected to MQTT broker');
    client.subscribe('sensor/temperature');
    client.subscribe('sensor/pressure');
    client.subscribe('sensor/humidity');
    client.subscribe('sensor/mq7');
    client.subscribe('sensor/latitude');
    client.subscribe('sensor/longitude');
    client.subscribe('parking/sensor1');
    client.subscribe('parking/sensor2');
});

client.on('message', function (topic, message) {
    // Broadcast the message to all connected WebSocket clients
    wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ topic, value: message.toString() }));
        }
    });
});

client.on('error', function (error) {
    console.error('MQTT Error:', error);
});

// Route for the maintenance page
app.get('/maintenance', (req, res) => {
  res.render('maintenance');
});

app.get('/aqi', (req, res) => {
    res.render('aqi', {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    });
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Email templates based on AQI range
const getEmailContent = (alertData) => {
    const isPoor = alertData.aqi >= 101 && alertData.aqi <= 150;
    const isUnhealthy = alertData.aqi > 150;

    if (isPoor) {
        return `
            <h2>Air Quality Alert - Poor AQI (${alertData.aqi})</h2>
            <p>Air quality is <strong>poor</strong>. Sensitive individuals may experience discomfort.</p>
            <ul>
                <li><strong>Outdoor exercise:</strong> Limit prolonged exposure.</li>
                <li><strong>Skin & Health:</strong> Use oil-control products.</li>
                <li><strong>Travel:</strong> Not ideal for long trips.</li>
                <li><strong>Precaution:</strong> Wear a mask if needed, stay hydrated.</li>
            </ul>
        `;
    } else if (isUnhealthy) {
        return `
            <h2>Air Quality Alert - Unhealthy AQI (${alertData.aqi})</h2>
            <p>Air quality is <strong>unhealthy</strong>. Health effects possible for everyone, especially sensitive groups.</p>
            <ul>
                <li><strong>Outdoor activities:</strong> Avoid strenuous exercise.</li>
                <li><strong>Windows & Purifier:</strong> Keep indoors clean.</li>
                <li><strong>Skin & Health:</strong> Hydrate, use oil-free products.</li>
                <li><strong>Precaution:</strong> Wear a mask, limit time outside.</li>
            </ul>
        `;
    }
};

// Add this route to your Express app
app.post('/send-alert-email', async (req, res) => {
    try {
        const alertData = req.body;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECIPIENT, // Configure recipient email
            subject: `Air Quality Alert - ${alertData.airQuality} AQI (${alertData.aqi})`,
            html: getEmailContent(alertData)
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Alert email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send alert email' });
    }
});

app.get('/urbantrafficmanagement', (req, res) => {
  res.render('urbantrafficmanage');
});

app.get('/publicsafety', (req, res) => {
  res.render('publicsafety');
});

app.get("/api/parking", (req, res) => {
    res.json({ availableSlots: Math.floor(Math.random() * 20) + 1 }); // Replace with MQTT or DB data
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});