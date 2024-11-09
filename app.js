let userPosition = null;
const institutionsCoordinates = {
    "conalep169": { lat: 21.5123, lon: -104.9024 },
    "uan": { lat: 21.5135, lon: -104.8935 },
    "tecnologico": { lat: 21.5107, lon: -104.8853 },
    "cecyten": { lat: 21.5152, lon: -104.9126 },
    "cetis100": { lat: 21.5181, lon: -104.8901 }
};

const busesByDestination = {
    "conalep169": ["Mololoa Villas del Prado", "Mololoa Álamo", "Llanitos y Prado", "Llanitos Aurora", "Llanitos 2 Álamo", "Progreso 5", "Progreso 4", "Progreso 3", "México", "Pedregal"],
    "uan": ["Mololoa Villas del Prado", "Mololoa Álamo", "Llanitos y Prado", "Llanitos Aurora", "Llanitos 2 Álamo", "Cantera Hospitales 1", "Cantera Hospitales 2", "Progreso 6-2", "Progreso 5", "Progreso 4", "Progreso 2", "Progreso 1", "Agrónomos Universidad", "México", "Sauces 2", "Sauces 1", "Río Suchiate", "Peñitas", "Amado Nervo", "UNINAY", "Cuauhtémoc"],
    "tecnologico": ["Mololoa Villas del Prado", "Mololoa Álamo", "Llanitos y Prado", "Llanitos Aurora", "Llanitos 2 Álamo", "Cantera Hospitales 2", "Cantera Hospitales 1", "Progreso 5", "Progreso 4", "Insurgentes", "Allende", "Sauces 2", "Sauces 1", "Amado Nervo"],
    "cecyten": ["Progreso 4", "Progreso 5", "Insurgentes", "Allende"],
    "cetis100": ["Progreso 6-2", "México", "Cuauhtémoc"]
};

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userPosition = { lat: position.coords.latitude, lon: position.coords.longitude };
            document.getElementById("locationStatus").innerHTML = `<h3>Ubicación obtenida</h3><p>Lat: ${userPosition.lat.toFixed(2)}, Lon: ${userPosition.lon.toFixed(2)}</p>`;
            enableSelections();
        }, error => {
            alert("No se pudo obtener la ubicación. Asegúrate de permitir el acceso.");
        });
    } else {
        alert("La geolocalización no es compatible con este navegador.");
    }
}

function enableSelections() {
    document.getElementById("destinationSelect").disabled = false;
    document.getElementById("passengerType").disabled = false;
}

function updateBusOptions() {
    const destination = document.getElementById("destinationSelect").value;
    const busSelect = document.getElementById("busSelect");
    busSelect.innerHTML = "<option value=''>Elige un camión...</option>";

    if (destination) {
        busSelect.disabled = false;
        busesByDestination[destination].forEach(bus => {
            const option = document.createElement("option");
            option.value = bus;
            option.textContent = bus;
            busSelect.appendChild(option);
        });
    }
}

function showCredentialOption() {
    const passengerType = document.getElementById("passengerType").value;
    document.getElementById("credentialOption").style.display = (passengerType === "student" || passengerType === "senior" || passengerType === "child") ? "block" : "none";
    document.getElementById("childAgeInput").style.display = (passengerType === "child") ? "block" : "none";
}

function calculateFare(passengerType, hasCredential, age = null) {
    let fare = 10;

    switch (passengerType) {
        case "normal":
            fare = 10;
            break;
        case "child":
            if (age < 5) {
                fare = 0;
            } else if (age >= 5 && age <= 12) {
                fare = 5;
            } else if (age > 12) {
                fare = hasCredential ? 5 : 10;
            }
            break;
        case "student":
            fare = hasCredential ? 5 : 10;
            break;
        case "senior":
            fare = hasCredential ? 5 : 10;
            break;
        case "disabled":
            fare = 5;
            break;
    }
    return fare;
}

function calculateTripDetails() {
    const destination = document.getElementById("destinationSelect").value;
    const bus = document.getElementById("busSelect").value;
    const passengerType = document.getElementById("passengerType").value;
    const hasCredential = document.getElementById("hasCredential").checked;
    const age = passengerType === "child" ? parseInt(document.getElementById("childAge").value) : null;

    if (!userPosition || !destination || !bus || !passengerType) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const destinationCoords = institutionsCoordinates[destination];
    const distanceToInstitution = calculateDistance(userPosition.lat, userPosition.lon, destinationCoords.lat, destinationCoords.lon);
    const travelTimeToInstitution = estimateTravelTime(distanceToInstitution);
    const fare = calculateFare(passengerType, hasCredential, age);

    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + travelTimeToInstitution);

    const remainingTime = arrivalTime - new Date();

    document.getElementById("arrivalTime").innerHTML = `<h3>Hora estimada de llegada</h3><p>${arrivalTime.toLocaleTimeString()}</p>`;
    document.getElementById("travelTime").innerHTML = `<h3>Tiempo en llegar a la institucion </h3><p>${travelTimeToInstitution} minutos</p>`;
    document.getElementById("fare").innerHTML = `<h3>Costo del pasaje</h3><p>$${fare} pesos</p>`;

    let timeLeft = remainingTime;
    let timeInterval = setInterval(function() {
        if (timeLeft <= 0) {
            clearInterval(timeInterval);
            document.getElementById("remainingTime").innerHTML = `<h3>¡Has llegado!</h3>`;
        } else {
            timeLeft -= 60000; // Reduce time by 1 minute
            const minutesLeft = Math.floor(timeLeft / 60000);
            document.getElementById("remainingTime").innerHTML = `<h3>Tiempo restante para llegar</h3><p>${minutesLeft} minutos</p>`;
        }
    }, 60000); // Update every minute
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Return distance in meters
}

function estimateTravelTime(distance) {
    const avgSpeed = 30; // Assuming an average speed of 30 km/h
    return Math.round((distance / 1000) / avgSpeed * 60); // Return time in minutes
}
