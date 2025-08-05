function initLiveMap() {
    const mapElement = document.getElementById('live-map-container');
    if (!mapElement) {
        console.error('Live map element not found');
        return;
    }

    const liveMap = L.map(mapElement, {
        zoomControl: false
    }).setView([38.736946, -9.142685], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(liveMap);

    // Add 24 moving vehicle markers and populate table
    addLiveVehicles(liveMap);

    // Invalidate size to ensure proper rendering
    setTimeout(() => {
        liveMap.invalidateSize();
    }, 100);
}

function addLiveVehicles(map) {
    const tableBody = document.querySelector('#live-map-table tbody');
    if (!tableBody) return;

    // Use all routes data
    const routes = allRoutesData;
    
    // Populate table
    tableBody.innerHTML = routes.map(route => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="py-2 px-4 font-semibold">${route.id}</td>
            <td class="py-2 px-4">${route.name}</td>
            <td class="py-2 px-4">${route.stops}</td>
            <td class="py-2 px-4">${route.km}</td>
            <td class="py-2 px-4">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getRiskClass(route.risk)}">
                    ${route.risk}
                </span>
            </td>
        </tr>
    `).join('');
}

function getRiskClass(risk) {
    switch (risk) {
        case 'High': return 'bg-red-100 text-red-800';
        case 'Med': return 'bg-yellow-100 text-yellow-800';
        case 'Low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
