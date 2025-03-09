const express = require('express');
const path = require('path');
require('dotenv').config();
const WebSocket = require('ws');
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const session = require('express-session');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { initializeApp } = require('firebase/app');

// Firebase Admin SDK Initialization (For Server-side Authentication)
const serviceAccount = require('./smartcity-1.json'); // Firebase service account key
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Firebase Client SDK (For User Authentication)
const firebaseConfig = {
    apiKey: "AIzaSyB8XtUwmoQf-PBvUE8UWry4-posX9KZM1A",
    authDomain: "smartcity-1.firebaseapp.com",
    projectId: "smartcity-1",
    storageBucket: "smartcity-1.firebasestorage.app",
    messagingSenderId: "121826649542",
    appId: "1:121826649542:web:33c819c4f96df4a7287ec7",
    measurementId: "G-6GYKQE5KRR"
  };
  

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

// Initialize Express app
const app = express();
const PORT = 8000;

// Configure middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true if using HTTPS
}));

// Set view engine
app.set('view engine', 'ejs');
app.set("views", path.resolve("./views"));

// Authentication Routes
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/nagarnetra');
    }
    return res.render("login", { errorMessage: null });
});

app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/nagarnetra');
    }
    return res.render("register", { errorMessage: null });
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        req.session.user = userCredential.user;
        return res.redirect('/nagarnetra');
    } catch (error) {
        return res.render('register', { errorMessage: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        req.session.user = userCredential.user;
        return res.redirect('/nagarnetra');
    } catch (error) {
        return res.render('login', { errorMessage: 'Invalid Email or Password' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Protected route middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    next();
};

// Main Application Routes
app.get('/nagarnetra', requireAuth, (req, res) => res.render('nagarnetra'));
app.get('/environmentalmonitoring', requireAuth, (req, res) => res.render('environmentalmonitoring'));
app.get('/maintenance', requireAuth, (req, res) => res.render('maintenance'));
app.get('/aqi', requireAuth, (req, res) => res.render('aqi', { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY }));
app.get('/urbantrafficmanagement', requireAuth, (req, res) => res.render('urbantrafficmanagement'));
app.get('/publicsafety', requireAuth, (req, res) => res.render('publicsafety'));
app.get('/surveillance', requireAuth, (req, res) => res.render('surveillance'));
app.get('/adaptivetraffic', requireAuth, (req, res) => res.render('adaptivetraffic'));
app.get('/dynamiclane', requireAuth, (req, res) => res.render('dynamiclane'));
app.get('/smartparking', requireAuth, (req, res) => res.render('smartparking'));
app.get('/wastealert', requireAuth, (req, res) => res.render('wastealert'));
app.get('/weatherprediction', requireAuth, (req, res) => res.render('weatherprediction'));
app.get('/windandrain', requireAuth, (req, res) => res.render('windandrain'));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
