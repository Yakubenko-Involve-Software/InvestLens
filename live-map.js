function initLiveMap() {
    const mapElement = document.getElementById('live-map-container');
    if (!mapElement) {
        console.error('Live map element not found!');
        return;
    }

    // Ensure map container has a defined height
    if (mapElement.offsetHeight === 0) {
        mapElement.style.height = 'calc(100vh - 150px)';
    }

    const liveMap = L.map(mapElement, {
        zoomControl: false,
        attributionControl: true
    }).setView([38.736946, -9.142685], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(liveMap);
    
    L.control.zoom({ position: 'topright' }).addTo(liveMap);

    addLiveVehicles(liveMap);

    setTimeout(() => {
        liveMap.invalidateSize();
    }, 100);
}

function addLiveVehicles(map) {
    const tableBody = document.querySelector('#live-map-table tbody');
    if (!tableBody) {
        console.error('Live map table body not found!');
        return;
    }

    const routes = allRoutesData;
    const vehicleMarkers = [];

    tableBody.innerHTML = routes.map(route => {
        const initialPosition = getRandomPosition(map.getBounds());
        
        const iconHtml = `
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md">
                <div class="w-4 h-4 rounded-full ${getRiskBgColor(route.risk)}"></div>
                <div class="absolute -top-1 -right-1 text-xs font-bold">${route.id}</div>
            </div>`;

        const vehicleIcon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker(initialPosition, { icon: vehicleIcon })
            .bindPopup(`<b>Courier:</b> ${route.name}<br><b>Risk:</b> ${route.risk}`)
            .addTo(map);
            
        vehicleMarkers.push({ marker, route });

        return `
            <tr class="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onclick="panToVehicle('${route.id}')">
                <td class="p-2 font-semibold text-blue-600">${route.id}</td>
                <td class="p-2">${route.name}</td>
                <td class="p-2">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${getRiskClass(route.risk)}">
                        ${route.risk}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    // Make panToVehicle globally available
    window.panToVehicle = (routeId) => {
        const vehicle = vehicleMarkers.find(v => v.route.id === routeId);
        if (vehicle) {
            map.panTo(vehicle.marker.getLatLng());
            vehicle.marker.openPopup();
        }
    };

    // Simulate vehicle movement
    setInterval(() => {
        vehicleMarkers.forEach(v => {
            const currentPos = v.marker.getLatLng();
            const newLat = currentPos.lat + (Math.random() - 0.5) * 0.001;
            const newLng = currentPos.lng + (Math.random() - 0.5) * 0.001;
            v.marker.setLatLng([newLat, newLng]);
        });
    }, 3000);
}

function getRiskBgColor(risk) {
    switch (risk) {
        case 'High': return 'bg-red-500';
        case 'Med': return 'bg-yellow-500';
        case 'Low': return 'bg-green-500';
        default: return 'bg-gray-400';
    }
}

function getRandomPosition(bounds) {
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const lngSpan = northEast.lng - southWest.lng;
    const latSpan = northEast.lat - southWest.lat;

    return L.latLng(
        southWest.lat + latSpan * Math.random(),
        southWest.lng + lngSpan * Math.random()
    );
}

function getRiskClass(risk) {
    switch (risk) {
        case 'High': return 'bg-red-100 text-red-800';
        case 'Med': return 'bg-yellow-100 text-yellow-800';
        case 'Low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
