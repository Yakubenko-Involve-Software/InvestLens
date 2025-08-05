// State
let allRoutes = [];
let filteredRoutes = [];
let stopsData = {};
let currentSort = { key: 'id', asc: true };


// DOM Elements
let map;
let routeList, timelineList;
let routeLayers = [];

async function initAI() {
    // DOM elements initialization
    routeList = document.getElementById('route-list')?.querySelector('tbody');
    timelineList = document.getElementById('timeline-list');

    if (!routeList || !timelineList) {
        console.error('One or more AI widget elements are missing.');
        return;
    }

    // Initialize map
    initAIMap();

    // Event Listeners
    document.getElementById('back-to-overview')?.addEventListener('click', backToOverview);
    
    // Load data
    allRoutes = allRoutesData;
    stopsData = stopsDataAll;
    
    // Initialize
    initAISorting();
    renderRouteTable();
}

function renderRouteTable() {
    // Sort routes based on current sort settings
    const sortedRoutes = [...allRoutes].sort((a, b) => {
        const valA = a[currentSort.key];
        const valB = b[currentSort.key];
        
        if (typeof valA === 'string') {
            return currentSort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return currentSort.asc ? valA - valB : valB - valA;
        }
    });
    
    routeList.innerHTML = sortedRoutes.map(route => `
        <tr class="hover:bg-gray-50 cursor-pointer" onclick="setFocus('${route.id}')">
            <td class="py-2 px-3 text-sm">${route.id}</td>
            <td class="py-2 px-3 text-sm">${route.name}</td>
            <td class="py-2 px-3 text-sm">${route.stops}</td>
            <td class="py-2 px-3 text-sm">${route.km}</td>
            <td class="py-2 px-3 text-sm">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getRiskClass(route.risk)}">
                    ${route.risk}
                </span>
            </td>
        </tr>
    `).join('');
    

}

function initAIMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }

    // Initialize Leaflet map
    map = L.map(mapElement, {
        zoomControl: false
    }).setView([38.736946, -9.142685], 13);

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Add some sample routes (similar to routes-map.js)
    setTimeout(() => {
        if (allRoutesData && allRoutesData.length > 0) {
            addRoutesToAIMap();
        }
    }, 500);
}

function addRoutesToAIMap() {
    // Clear existing layers
    routeLayers.forEach(layer => {
        map.removeLayer(layer.polyline);
        layer.markers.forEach(marker => map.removeLayer(marker));
    });
    routeLayers = [];

    // Define 3 districts with their colors and center coordinates
    const districts = [
        { 
            name: 'Центр', 
            center: { lat: 38.736946, lng: -9.142685 }, 
            color: '#DC3545', // Red
            routes: []
        },
        { 
            name: 'Північ', 
            center: { lat: 38.755, lng: -9.155 }, 
            color: '#FFC107', // Yellow
            routes: []
        },
        { 
            name: 'Південь', 
            center: { lat: 38.715, lng: -9.130 }, 
            color: '#28A745', // Green
            routes: []
        }
    ];

    // Create exactly 9 routes - 3 per district
    for (let districtIndex = 0; districtIndex < 3; districtIndex++) {
        const district = districts[districtIndex];
        
        for (let routeIndex = 0; routeIndex < 3; routeIndex++) {
            const globalRouteIndex = districtIndex * 3 + routeIndex;
            const routeInfo = allRoutes[globalRouteIndex] || allRoutes[globalRouteIndex % allRoutes.length];
            
            // Generate route path around district center
            const path = [];
            const centerLat = district.center.lat + (Math.random() - 0.5) * 0.02;
            const centerLng = district.center.lng + (Math.random() - 0.5) * 0.02;
            const latRadius = 0.003 + Math.random() * 0.005;
            const lngRadius = 0.003 + Math.random() * 0.005;
            
            // Create different route shapes
            const shapes = ['circle', 'rectangle', 'triangle'];
            const shape = shapes[routeIndex];
            
            if (shape === 'circle') {
                // Circular route
                for (let j = 0; j <= 8; j++) {
                    const angle = (j / 8) * 2 * Math.PI;
                    path.push([
                        centerLat + latRadius * Math.cos(angle), 
                        centerLng + lngRadius * Math.sin(angle)
                    ]);
                }
            } else if (shape === 'rectangle') {
                // Rectangular route
                path.push(
                    [centerLat + latRadius, centerLng - lngRadius],
                    [centerLat + latRadius, centerLng + lngRadius],
                    [centerLat - latRadius, centerLng + lngRadius],
                    [centerLat - latRadius, centerLng - lngRadius],
                    [centerLat + latRadius, centerLng - lngRadius]
                );
            } else {
                // Triangular route
                for (let j = 0; j <= 3; j++) {
                    const angle = (j / 3) * 2 * Math.PI + Math.PI/2;
                    path.push([
                        centerLat + latRadius * Math.cos(angle), 
                        centerLng + lngRadius * Math.sin(angle)
                    ]);
                }
            }
            
            // Create polyline with district color
            const polyline = L.polyline(path, { 
                color: district.color, 
                weight: 3, 
                opacity: 0.8 
            });
            polyline.addTo(map);

            // Add markers along the route
            const markers = path.map((point, pIndex) => {
                const isEndPoint = pIndex === path.length - 1;
                return L.circleMarker(point, {
                    radius: isEndPoint ? 6 : 4,
                    color: district.color,
                    weight: 2,
                    fillColor: isEndPoint ? district.color : '#FFFFFF',
                    fillOpacity: 1
                }).addTo(map);
            });

            // Add click event to highlight route
            polyline.on('click', () => {
                setFocus(routeInfo.id);
            });

            // Store route layer information
            routeLayers.push({ 
                polyline: polyline, 
                markers: markers, 
                id: routeInfo.id,
                district: district.name,
                color: district.color
            });
        }
    }

    setTimeout(() => map.invalidateSize(), 100);
}

function renderOverview() {
    renderRouteTable();
}

function renderRouteTable() {
    // Sort routes - show only first 9 routes for the map
    const routesToShow = allRoutes.slice(0, 9);
    const sortedRoutes = [...routesToShow].sort((a, b) => {
        const valA = a[currentSort.key];
        const valB = b[currentSort.key];
        if (typeof valA === 'string') {
            return currentSort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return currentSort.asc ? valA - valB : valB - valA;
        }
    });

    // Render route list
    routeList.innerHTML = sortedRoutes.map(route => `
        <tr class="border-b border-gray-200 hover:bg-blue-50 cursor-pointer" onclick="setFocus('${route.id}')">
            <td class="py-2 px-3 text-sm">${route.id}</td>
            <td class="py-2 px-3 text-sm">${route.name}</td>
            <td class="py-2 px-3 text-sm">${route.stops}</td>
            <td class="py-2 px-3 text-sm">${route.km}</td>
            <td class="py-2 px-3 text-sm">
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

function initAISorting() {
    const sortableHeaders = document.querySelectorAll('#route-list th[data-sort-key]');
    
    sortableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sortKey;
            if (currentSort.key === sortKey) {
                currentSort.asc = !currentSort.asc;
            } else {
                currentSort.key = sortKey;
                currentSort.asc = true;
            }

            // Update sort icons
            sortableHeaders.forEach(header => {
                const icon = header.querySelector('i');
                if (header.dataset.sortKey === currentSort.key) {
                    icon.className = currentSort.asc 
                        ? 'ri-arrow-up-line ml-1 align-middle text-gray-800' 
                        : 'ri-arrow-down-line ml-1 align-middle text-gray-800';
                } else {
                    icon.className = 'ri-arrow-up-down-line ml-1 align-middle text-gray-400';
                }
            });

            renderRouteTable();
        });
    });
}

function backToOverview() {
    renderOverview();
    // Reset all routes to default style
    routeLayers.forEach(layer => {
        layer.polyline.setStyle({ weight: 2, opacity: 0.7 });
        layer.markers.forEach(marker => {
            marker.setStyle({ opacity: 1, fillOpacity: 1 });
        });
    });
    timelineList.innerHTML = '';
}

async function setFocus(routeId) {
    console.log(`Setting focus to route ${routeId}`);
    
    // Highlight route on map
    highlightRouteOnMap(routeId);

    // Render timeline
    renderTimeline(routeId);
}

function highlightRouteOnMap(routeId) {
    // Reset all routes to default style
    routeLayers.forEach(layer => {
        layer.polyline.setStyle({ weight: 2, opacity: 0.5 });
        layer.markers.forEach(marker => {
            marker.setStyle({ opacity: 0.5 });
        });
    });
    
    // Highlight selected route
    const selectedLayer = routeLayers.find(layer => layer.id === routeId);
    if (selectedLayer) {
        selectedLayer.polyline.setStyle({ weight: 4, opacity: 1 });
        selectedLayer.markers.forEach(marker => {
            marker.setStyle({ opacity: 1 });
        });
        
        // Center map on the selected route
        const bounds = selectedLayer.polyline.getBounds();
        map.fitBounds(bounds, { padding: [20, 20] });
    }
}

function renderTimeline(routeId) {
    const stops = stopsData[routeId] || [];
    timelineList.innerHTML = stops.map(stop => `
        <li class="mb-2">
            <div class="flex items-center">
                <div class="bg-gray-300 rounded-full h-4 w-4"></div>
                <div class="ml-4">
                    <p class="font-bold">${stop.eta} - ${stop.addr}</p>
                    ${stop.warning ? `<p class="text-sm text-red-500">${stop.warning}</p>` : ''}
                    ${stop.ai ? `<p class="text-sm text-blue-500">${stop.ai}</p>` : ''}
                </div>
            </div>
        </li>
    `).join('');
}

// Functions related to KPIs, summary cards, and AI simulation have been removed
// since we now use static KPI cards in the template

// Add the glow animation style to the document head
const style = document.createElement('style');
style.innerHTML = `
@keyframes glow {
    0% { box-shadow: 0 0 0 #22c55e80; }
    50% { box-shadow: 0 0 10px #22c55e; }
    100% { box-shadow: 0 0 0 #22c55e00; }
}
.kpi-glow {
    animation: glow .8s ease-in-out;
}
`;
document.head.appendChild(style);
