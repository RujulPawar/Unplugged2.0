document.addEventListener("DOMContentLoaded", () => {
    // Select AQI Card
    const aqiCard = document.getElementById("aqiCard");

    if (aqiCard) {
        aqiCard.onclick = () => {
            window.location.href = "/aqi";
        };
    }

    const parkingCard = document.getElementById("parkingCard");

    if (parkingCard) {
        parkingCard.onclick = () => {
            window.location.href = "/parking";
        };
    }
    // WebSocket connection
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
        console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateSensorValue(data.topic, data.value);
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
});
