from flask import Flask, jsonify
import joblib
import paho.mqtt.client as mqtt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Load the ML model and label encoder
model, label_encoder = joblib.load("weather_model.pkl")

# Weather data storage
weather_data = {
    "temperature": None,
    "humidity": None,
    "pressure": None
}

# MQTT Configuration
MQTT_BROKER = os.getenv("MQTT_HOST", "a14097d0a00e4d709ae1273df20c672d.s1.eu.hivemq.cloud")
MQTT_PORT = int(os.getenv("MQTT_PORT", "8883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "tanishq")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "Pass@123")

# MQTT Topics
MQTT_TOPICS = ["sensor/temperature", "sensor/humidity", "sensor/pressure"]

print(f"🔄 Connecting to MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")


# Callback: When connected to MQTT broker
def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ Connected to MQTT Broker!")
        for topic in MQTT_TOPICS:
            client.subscribe(topic)
            print(f"📡 Subscribed to topic: {topic}")
    else:
        print(f"❌ Connection failed with reason code {reason_code}")


# Callback: When a message is received
def on_message(client, userdata, msg):
    topic = msg.topic
    value = msg.payload.decode("utf-8")

    try:
        if topic == "sensor/temperature":
            weather_data["temperature"] = float(value)
        elif topic == "sensor/humidity":
            weather_data["humidity"] = float(value)
        elif topic == "sensor/pressure":
            weather_data["pressure"] = float(value)
        print(f"📡 {topic}: {value}")
    except ValueError:
        print(f"⚠️ Invalid data received: {value}")


# Initialize MQTT client (New API requires version 2)
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

# Secure Connection
client.tls_set()

# Assign callbacks
client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()  # Run MQTT loop in the background
except Exception as e:
    print(f"❌ MQTT Connection Error: {e}")


# Flask Homepage Route
@app.route('/')
def home():
    return "🌦 Weather API is running! Access /predict-weather for predictions."


# Prediction API Route
@app.route('/predict-weather', methods=['GET'])
def predict_weather():
    if None in weather_data.values():
        return jsonify({"error": "Sensor data not yet received"}), 503

    temp = weather_data["temperature"]
    humidity = weather_data["humidity"]
    pressure = weather_data["pressure"]

    prediction = model.predict([[temp, humidity, pressure]])
    condition = label_encoder.inverse_transform(prediction)[0]

    return jsonify({
        "temperature": temp,
        "humidity": humidity,
        "pressure": pressure,
        "prediction": condition
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
