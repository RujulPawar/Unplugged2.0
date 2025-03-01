let map;
let directionsService;
let directionsRenderer;
let userLocation = { lat: 19.236158823957446, lng: 72.84104464787482 };

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: userLocation,
        zoom: 15,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

    const parkingSpots = [
        { name: "Infinity Mall Parking", lat: 19.2342, lng: 72.8440, real: true },
        { name: "City Center Parking", lat: 19.2355, lng: 72.8425 },
        { name: "Metro Plaza Parking", lat: 19.2370, lng: 72.8432 },
        { name: "High Street Parking", lat: 19.2385, lng: 72.8418 },
        { name: "Green Park Parking", lat: 19.2338, lng: 72.8405 },
        { name: "Grand Tower Parking", lat: 19.2325, lng: 72.8430 },
        { name: "Tech Hub Parking", lat: 19.2392, lng: 72.8422 },
        { name: "Skyline Mall Parking", lat: 19.2367, lng: 72.8450 },
        { name: "Central Square Parking", lat: 19.2309, lng: 72.8411 },
        { name: "Westside Parking", lat: 19.2348, lng: 72.8462 }
    ];

    const parkingList = document.getElementById("parking-list");
    parkingList.innerHTML = "";

    parkingSpots.forEach((spot) => {
        let occupancy = Math.floor(Math.random() * 100); // Random occupancy %

        // Adding markers to the map
        const marker = new google.maps.Marker({
            position: { lat: spot.lat, lng: spot.lng },
            map: map,
            title: spot.name,
            icon: spot.real ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" : null
        });

        // Info window when marker is clicked
        const infoWindow = new google.maps.InfoWindow({
            content: `<strong>${spot.name}</strong><br>Occupancy: ${occupancy}%`
        });

        marker.addListener("click", () => {
            infoWindow.open(map, marker);
            getDirections(spot);
        });

        // Adding parking spots to list
        const li = document.createElement("li");
        li.innerHTML = `<strong>${spot.name}</strong> - Occupancy: ${occupancy}%`;
        li.addEventListener("click", () => getDirections(spot));
        parkingList.appendChild(li);
    });

    function getDirections(destination) {
        directionsService.route({
            origin: userLocation,
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: google.maps.TravelMode.DRIVING
        }, (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
            } else {
                alert("Directions request failed due to " + status);
            }
        });
    }
}

// ✅ Fix for "View on Map" Button
function openMap() {
    document.getElementById("map-card").style.display = "block";
    document.getElementById("overlay").style.display = "block";
}

// ✅ Fix for "Close Map" Button
function closeMap() {
    document.getElementById("map-card").style.display = "none";
    document.getElementById("overlay").style.display = "none";
}
