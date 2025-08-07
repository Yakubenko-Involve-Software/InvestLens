function initLiveMap() {
    const mapElement = document.getElementById('live-map-container');
    if (!mapElement) {
        console.error('Live map element not found!');
        return;
    }

    // Ensure map container has a defined height
    if (mapElement.offsetHeight === 0) {
        mapElement.style.height = 'calc(100vh - 120px)';
    }

    const liveMap = L.map(mapElement, {
        zoomControl: false,
        attributionControl: true
    }).setView([38.736946, -9.142685], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
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

let currentRoutes = [];
let vehicleMarkers = [];
let currentSortKey = null;
let currentSortDirection = 'asc';

function addLiveVehicles(map) {
    const tableBody = document.querySelector('#live-map-table tbody');
    if (!tableBody) {
        console.error('Live map table body not found!');
        return;
    }

    currentRoutes = [...allRoutesData];
    vehicleMarkers = [];

    // Add sorting functionality
    setupTableSorting(map);

    renderTable(map);

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

function setupTableSorting(map) {
    const tableHeaders = document.querySelectorAll('#live-map-table th[data-sort-key]');
    
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort-key');
            
            if (currentSortKey === sortKey) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortKey = sortKey;
                currentSortDirection = 'asc';
            }
            
            sortRoutes(sortKey, currentSortDirection);
            renderTable(map);
            updateSortIndicators();
        });
    });
}

function sortRoutes(key, direction) {
    currentRoutes.sort((a, b) => {
        let aValue, bValue;
        
        switch (key) {
            case 'id':
                aValue = a.id;
                bValue = b.id;
                break;
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'risk':
                const riskOrder = { 'High': 3, 'Med': 2, 'Low': 1 };
                aValue = riskOrder[a.risk] || 0;
                bValue = riskOrder[b.risk] || 0;
                break;
            default:
                return 0;
        }
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function updateSortIndicators() {
    const tableHeaders = document.querySelectorAll('#live-map-table th[data-sort-key]');
    
    tableHeaders.forEach(header => {
        const icon = header.querySelector('i');
        const sortKey = header.getAttribute('data-sort-key');
        
        if (sortKey === currentSortKey) {
            icon.className = currentSortDirection === 'asc' 
                ? 'ri-arrow-up-line ml-1 align-middle text-blue-600'
                : 'ri-arrow-down-line ml-1 align-middle text-blue-600';
        } else {
            icon.className = 'ri-arrow-up-down-line ml-1 align-middle text-gray-400';
        }
    });
}

function renderTable(map) {
    const tableBody = document.querySelector('#live-map-table tbody');
    
    // Clear existing markers
    vehicleMarkers.forEach(v => map.removeLayer(v.marker));
    vehicleMarkers = [];

    tableBody.innerHTML = currentRoutes.map(route => {
        const initialPosition = getRandomPosition();
        
        const iconHtml = `
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${getRiskBgColor(route.risk)} shadow-md">
                <div class="text-xs font-bold text-white">${route.id}</div>
            </div>`;

        const vehicleIcon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
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
}

function getRiskBgColor(risk) {
    switch (risk) {
        case 'High': return 'bg-red-500';
        case 'Med': return 'bg-yellow-500';
        case 'Low': return 'bg-green-500';
        default: return 'bg-gray-400';
    }
}

function getRandomPosition() {
    // Specific land coordinates in Lisbon area to avoid markers in the sea
    const landPositions = [
        [38.7223, -9.1393], // Alfama
        [38.7071, -9.1357], // Bairro Alto
        [38.7436, -9.1602], // Benfica
        [38.7169, -9.1395], // Chiado
        [38.7436, -9.1301], // Campo Grande
        [38.7267, -9.1545], // Estrela
        [38.7614, -9.1477], // Lumiar
        [38.7344, -9.1394], // Marquês de Pombal
        [38.7505, -9.1849], // Restelo
        [38.7436, -9.1548], // Avenidas Novas
        [38.7578, -9.1639], // Alvalade Norte
        [38.7393, -9.1376], // Saldanha
        [38.7267, -9.1447], // Santos
        [38.7169, -9.1282], // Cais do Sodré
        [38.7267, -9.1647], // Campo de Ourique
        [38.7505, -9.1477], // Olivais
        [38.7344, -9.1647], // Lapa
        [38.7578, -9.1376], // Areeiro
        [38.7223, -9.1647], // Madragoa
        [38.7436, -9.1376], // Arroios
        [38.7071, -9.1647], // Príncipe Real
        [38.7614, -9.1602], // Carnide
        [38.7267, -9.1376], // Rato
        [38.7505, -9.1647]  // Marvila
    ];
    
    return landPositions[Math.floor(Math.random() * landPositions.length)];
}

function getRiskClass(risk) {
    switch (risk) {
        case 'High': return 'bg-red-100 text-red-800';
        case 'Med': return 'bg-yellow-100 text-yellow-800';
        case 'Low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
