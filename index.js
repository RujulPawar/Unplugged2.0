// index.js
const express = require('express');
const path = require('path');
require('dotenv').config();
const WebSocket = require('ws');
const mqtt = require('mqtt');

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

// Route for the maintenance page
app.get('/maintenance', (req, res) => {
  res.render('maintenance');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//Testing