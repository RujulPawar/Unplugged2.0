// index.js
const express = require('express');
const path = require('path');
require('dotenv').config();
const WebSocket = require('ws');
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');

// Initialize Express app
const app = express();
const PORT = 8000;

// Configure middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Set view engine
app.set('view engine', 'ejs');
app.set("views", path.resolve("./views"));

// Email configuration
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

// MQTT Configuration
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

// MQTT event handlers
client.on('connect', function () {
    console.log('Connected to MQTT broker');
    client.subscribe('sensor/temperature');
    client.subscribe('sensor/pressure');
    client.subscribe('sensor/humidity');
    client.subscribe('sensor/mq7');
    client.subscribe('sensor/latitude');
    client.subscribe('sensor/longitude');
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

// Authentication routes
app.get('/', (req, res) => {
    return res.render("login", { errorMessage: null });
});

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

// Main application routes
app.get('/nagarnetra', (req, res) => {
    return res.render('nagarnetra');
});

app.get('/environmentalmonitoring', (req, res) => {
    return res.render('environmentalmonitoring');
});

app.get('/maintenance', (req, res) => {
    res.render('maintenance');
});

app.get('/aqi', (req, res) => {
    res.render('aqi', {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    });
});

app.get('/urbantrafficmanagement', (req, res) => {
    res.render('urbantrafficmanagement');
});

app.get('/publicsafety', (req, res) => {
    res.render('publicsafety');
});

app.get('/surveillance', (req, res) => {
    return res.render('surveillance');
});

app.get('/adaptivetraffic', (req, res) => {
    return res.render('adaptivetraffic');
});

app.get('/dynamiclane', (req, res) => {
    return res.render('dynamiclane');
});

app.get('/smartparking', (req, res) => {
    return res.render('smartparking');
});

app.get('/wastealert', (req, res) => {
    return res.render('wastealert');
});

app.get('/weatherprediction', (req, res) => {
    return res.render('weatherprediction');
});

app.get('/windandrain', (req, res) => {
    return res.render('windandrain');
});

// API routes
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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});