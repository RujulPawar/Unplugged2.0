const express = require('express');
const path = require('path');
require('dotenv').config();
const WebSocket = require('ws');
const mqtt = require('mqtt');
const { fetchWeatherData, prepareWeatherDataForTemplate } = require('./weather');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route for login page
app.get('/login', (req, res) => {
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
    return res.render('login', { errorMessage: 'Invalid Email or Password' });
});

// Routes
app.get('/', (req, res) => {
    res.redirect('/nagarnetra');
});

// Route to render nagarnetra.ejs
app.get('/nagarnetra', (req, res) => {
    return res.render('nagarnetra');
});

app.get('/environmental-monitoring', (req, res) => {
    return res.render('environmental-monitoring');
});

// Weather route with direct API integration
app.get('/weather', async (req, res) => {
    try {
        // Fetch data from Python API
        const weatherData = await fetchWeatherData();

        // Prepare data for the template
        const templateData = prepareWeatherDataForTemplate(weatherData);

        // Render the weather page with data
        res.render('weather', {
            weather: templateData || {
                current: { temperature: '--', humidity: '--', pressure: '--', prediction: '--' },
                status: {},
                forecast: [],
                chart: { labels: [], tempData: [] }
            }
        });
    } catch (error) {
        console.error('Error rendering weather page:', error);
        res.status(500).send('Error loading weather data');
    }
});

// Route for the maintenance page
app.get('/maintenance', (req, res) => {
    res.render('maintenance');
});

// MQTT Setup
const connectMQTT = () => {
    const options = {
        host: process.env.MQTT_HOST,
        port: parseInt(process.env.MQTT_PORT),
        protocol: 'mqtts',
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        reconnectPeriod: 5000 // Reconnect every 5 seconds if connection is lost
    };

    const client = mqtt.connect(options);

    // Initialize the WebSocket server
    const wss = new WebSocket.Server({ port: 8080 });

    client.on('connect', function () {
        console.log('Connected to MQTT broker');
        const topics = [
            'sensor/temperature',
            'sensor/pressure',
            'sensor/humidity',
            'sensor/latitude',
            'sensor/longitude'
        ];

        topics.forEach(topic => client.subscribe(topic));
    });

    client.on('message', function (topic, message) {
        wss.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ topic, value: message.toString() }));
            }
        });
    });

    client.on('error', function (error) {
        console.error('MQTT Error:', error);
    });

    client.on('disconnect', function () {
        console.log('Disconnected from MQTT broker');
    });

    return { client, wss };
};

// Start MQTT and WebSocket servers
// Only start MQTT if environment variables are available
if (process.env.MQTT_HOST && process.env.MQTT_USERNAME) {
    const { client, wss } = connectMQTT();

    // Handle process termination gracefully
    process.on('SIGINT', () => {
        console.log('Closing MQTT connection and WebSocket server');
        if (client) client.end();
        if (wss) wss.close();
        process.exit(0);
    });
} else {
    console.log('MQTT credentials not found. MQTT client not started.');
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});