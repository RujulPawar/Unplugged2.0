// WebSocket connection
const ws = new WebSocket('ws://localhost:8080');

// Elements
const aqiCard = document.getElementById('aqiCard');

// WebSocket event handlers
ws.onopen = () => {
    console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateSensorValue(data.topic, data.value);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// Redirect to AQI page when AQI card is clicked
aqiCard.onclick = () => {
    window.location.href = '/aqi';
};

parkingCard.onclick = () => {
    window.location.href = '/parking';
};