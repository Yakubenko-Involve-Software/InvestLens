// State
let allRoutes = [];
let filteredRoutes = [];
let stopsData = {};
let currentSort = { key: 'id', asc: true };
let activeFilters = { search: '', risk: 'All' };

// DOM Elements
let map;
let routeList, timelineList;
let searchFilter, riskFilter;
let routeLayers = [];

async function initAI() {
    // DOM elements initialization
    routeList = document.getElementById('route-list')?.querySelector('tbody');
    timelineList = document.getElementById('timeline-list');
    searchFilter = document.getElementById('ai-search-filter');
    riskFilter = document.getElementById('ai-risk-filter');

    if (!routeList || !timelineList || !searchFilter || !riskFilter) {
        console.error('One or more AI widget elements are missing.');
        return;
    }

    // Initialize map
    initAIMap();

    // Event Listeners
    document.getElementById('back-to-overview')?.addEventListener('click', backToOverview);
    searchFilter.addEventListener('input', () => {
        activeFilters.search = searchFilter.value;
        applyFiltersAndRender();
    });
    riskFilter.addEventListener('change', () => {
        activeFilters.risk = riskFilter.value;
        applyFiltersAndRender();
    });
    
    // Load data
    allRoutes = allRoutesData;
    stopsData = stopsDataAll;
    
    // Initialize
    initAISorting();
    applyFiltersAndRender();
}

function applyFiltersAndRender() {
    let tempRoutes = [...allRoutes];

    // Filter by risk
    if (activeFilters.risk !== 'All') {
        tempRoutes = tempRoutes.filter(r => r.risk === activeFilters.risk);
    }

    // Filter by search term (name)
    if (activeFilters.search) {
        const searchTerm = activeFilters.search.toLowerCase();
        tempRoutes = tempRoutes.filter(r => r.name.toLowerCase().includes(searchTerm));
    }

    filteredRoutes = tempRoutes;
    renderRouteTable();
    addRoutesToAIMap();
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

    const clusters = [
        { lat: 38.715, lng: -9.16 }, { lat: 38.74, lng: -9.12 }, { lat: 38.75, lng: -9.17 },
        { lat: 38.72, lng: -9.13 }, { lat: 38.73, lng: -9.15 }, { lat: 38.76, lng: -9.14 }
    ];
    const shapes = ['diamond', 'rectangle', 'triangle', 'circle', 'hexagon'];

    filteredRoutes.forEach((routeInfo, i) => {
        if (!routeInfo) return;

        let clusterIndex = 0;
        if (routeInfo.risk === 'High') clusterIndex = i % 2;
        else if (routeInfo.risk === 'Med') clusterIndex = 2 + (i % 2);
        else clusterIndex = 4 + (i % 2);
        
        const cluster = clusters[clusterIndex];
        const path = [];
        const shape = shapes[i % shapes.length];

        const centerLat = cluster.lat + (Math.random() - 0.5) * 0.015;
        const centerLng = cluster.lng + (Math.random() - 0.5) * 0.015;
        const latRadius = 0.002 + Math.random() * 0.004;
        const lngRadius = 0.002 + Math.random() * 0.004;

        if (shape === 'diamond') {
            path.push([centerLat + latRadius, centerLng], [centerLat, centerLng - lngRadius], [centerLat - latRadius, centerLng], [centerLat, centerLng + lngRadius], [centerLat + latRadius, centerLng]);
        } else if (shape === 'rectangle') {
            path.push([centerLat + latRadius, centerLng - lngRadius], [centerLat + latRadius, centerLng + lngRadius], [centerLat - latRadius, centerLng + lngRadius], [centerLat - latRadius, centerLng - lngRadius], [centerLat + latRadius, centerLng - lngRadius]);
        } else {
            const numPoints = shape === 'circle' ? 8 : 6;
            for (let j = 0; j <= numPoints; j++) {
                const angle = (j / numPoints) * 2 * Math.PI;
                path.push([centerLat + latRadius * Math.cos(angle), centerLng + lngRadius * Math.sin(angle)]);
            }
        }

        const color = routeInfo.risk === 'High' ? '#DC3545' : routeInfo.risk === 'Med' ? '#FFC107' : '#28A745';
        
        const polyline = L.polyline(path, { color: color, weight: 2, opacity: 0.7 });
        polyline.addTo(map);

        const markers = path.map((point, pIndex) => {
            const isEndPoint = pIndex === path.length - 1;
            return L.circleMarker(point, {
                radius: isEndPoint ? 6 : 4,
                color: color,
                weight: 2,
                fillColor: isEndPoint ? color : '#FFFFFF',
                fillOpacity: 1
            }).addTo(map);
        });

        routeLayers.push({ polyline: polyline, markers: markers, id: routeInfo.id });
    });

    setTimeout(() => map.invalidateSize(), 100);
}

function renderOverview() {
    renderRouteTable();
    summaryCards.classList.remove('hidden');
    timelineView.classList.add('hidden');
}

function renderRouteTable() {
    // Sort routes
    const sortedRoutes = [...filteredRoutes].sort((a, b) => {
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
