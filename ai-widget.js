// State
let allRoutes = [];
let allOrders = [];
let summaryData = {};
let stopsData = {};
let currentSort = { key: 'id', asc: true };

// DOM Elements
let map;
let routeList, kpiSnap, timelineList, summaryCards, modal;
let modalTitle, modalList, modalClose;
let routeLayers = [];

async function initAI() {
    // DOM elements initialization
    routeList = document.getElementById('route-list')?.querySelector('tbody');
    kpiSnap = document.getElementById('kpi-snap');
    timelineList = document.getElementById('timeline-list');
    summaryCards = document.getElementById('summary-cards');
    modal = document.getElementById('summary-modal');
    modalTitle = document.getElementById('modal-title');
    modalList = document.getElementById('modal-list');
    modalClose = document.getElementById('modal-close');

    if (!routeList || !kpiSnap || !timelineList || !summaryCards || !modal) {
        console.error('One or more AI widget elements are missing.');
        return;
    }

    // Initialize map
    initAIMap();

    // Event Listeners
    document.getElementById('back-to-overview')?.addEventListener('click', backToOverview);
    modalClose?.addEventListener('click', () => modal.classList.add('hidden'));
    
    // Load data directly
    allRoutes = allRoutesData;
    allOrders = allOrdersData;
    summaryData = summaryBaseData;
    stopsData = stopsDataAll;
    
    // Initialize sorting
    initAISorting();
    
    // Initial Render
    renderOverview();
    renderSummaryCards();
    updateKPIs(); // For total KPIs
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
    const clusters = [
        { lat: 38.715, lng: -9.16 }, // Red routes (High risk)
        { lat: 38.74, lng: -9.12 },   // Yellow routes (Med risk)
        { lat: 38.75, lng: -9.17 }  // Green routes (Low risk)
    ];
    const shapes = ['diamond', 'rectangle', 'triangle'];

    // Get 3 routes for each risk category
    const highRiskRoutes = allRoutesData.filter(r => r.risk === 'High').slice(0, 3);
    const medRiskRoutes = allRoutesData.filter(r => r.risk === 'Med').slice(0, 3);
    const lowRiskRoutes = allRoutesData.filter(r => r.risk === 'Low').slice(0, 3);

    const routesToDisplay = [...highRiskRoutes, ...medRiskRoutes, ...lowRiskRoutes];

    routesToDisplay.forEach((routeInfo, i) => {
        if (!routeInfo) return;

        const clusterIndex = routeInfo.risk === 'High' ? 0 : routeInfo.risk === 'Med' ? 1 : 2;
        const cluster = clusters[clusterIndex];
        const path = [];
        const shape = shapes[i % 3];

        const centerLat = cluster.lat + (Math.random() - 0.5) * 0.01;
        const centerLng = cluster.lng + (Math.random() - 0.5) * 0.01;
        const latRadius = 0.002 + Math.random() * 0.003;
        const lngRadius = 0.002 + Math.random() * 0.003;

        if (shape === 'diamond') {
            path.push([centerLat + latRadius, centerLng]);
            path.push([centerLat, centerLng - lngRadius]);
            path.push([centerLat - latRadius, centerLng]);
            path.push([centerLat, centerLng + lngRadius]);
            path.push([centerLat + latRadius, centerLng]);
        } else if (shape === 'rectangle') {
            path.push([centerLat + latRadius, centerLng - lngRadius]);
            path.push([centerLat + latRadius, centerLng + lngRadius]);
            path.push([centerLat - latRadius, centerLng + lngRadius]);
            path.push([centerLat - latRadius, centerLng - lngRadius]);
            path.push([centerLat + latRadius, centerLng - lngRadius]);
        } else { // triangle
            path.push([centerLat + latRadius, centerLng]);
            path.push([centerLat - latRadius, centerLng - lngRadius]);
            path.push([centerLat - latRadius, centerLng + lngRadius]);
            path.push([centerLat + latRadius, centerLng]);
        }

        const color = routeInfo.risk === 'High' ? '#F44336' : routeInfo.risk === 'Med' ? '#FFC107' : '#4CAF50';
        
        const polyline = L.polyline(path, { 
            color: color,
            weight: 2,
            opacity: 0.7
        }).addTo(map);

        const markers = [];
        // Add markers
        path.forEach((point, pIndex) => {
            const isEndPoint = pIndex === path.length - 1;
            const marker = L.circleMarker(point, {
                radius: isEndPoint ? 6 : 4,
                color: color,
                weight: 2,
                fillColor: isEndPoint ? color : '#FFFFFF',
                fillOpacity: 1
            }).addTo(map);
            markers.push(marker);
        });

        // Store route layer data
        routeLayers.push({
            polyline: polyline,
            markers: markers,
            id: routeInfo.id,
            routeData: routeInfo
        });
    });

    // Invalidate size to ensure proper rendering
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

function renderOverview() {
    renderRouteTable();

    // Reset map view (pseudo-code)
    console.log("Rendering map with all routes (thin polylines)");

    // Hide timeline
    document.getElementById('timeline-drawer').classList.add('hidden');
}

function renderRouteTable() {
    // Sort routes
    const sortedRoutes = [...allRoutes].sort((a, b) => {
        const valA = a[currentSort.key];
        const valB = b[currentSort.key];
        if (valA < valB) return currentSort.asc ? -1 : 1;
        if (valA > valB) return currentSort.asc ? 1 : -1;
        return 0;
    });

    // Render route list
    routeList.innerHTML = sortedRoutes.map(route => `
        <tr class="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onclick="setFocus('${route.id}')">
            <td class="py-3 px-4 font-semibold">${route.id}</td>
            <td class="py-3 px-4">${route.name}</td>
            <td class="py-3 px-4">${route.stops}</td>
            <td class="py-3 px-4">${route.km}</td>
            <td class="py-3 px-4">
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
    updateKPIs();
    
    // Reset all routes to default style
    routeLayers.forEach(layer => {
        layer.polyline.setStyle({ weight: 2, opacity: 0.7 });
        layer.markers.forEach(marker => {
            marker.setStyle({ opacity: 1 });
        });
    });
    
    document.getElementById('timeline-drawer').classList.remove('hidden'); // Should be visible again
}

async function setFocus(routeId) {
    console.log(`Setting focus to route ${routeId}`);
    
    // Highlight route on map
    highlightRouteOnMap(routeId);
    
    // Show timeline
    document.getElementById('timeline-drawer').classList.remove('hidden');

    // Render timeline
    renderTimeline(routeId);

    // Update KPIs for the selected courier
    const courier = allRoutes.find(r => r.id === routeId);
    if (courier) {
        updateKPIs(courier);
    }
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

function updateKPIs(courier = null) {
    let kpiHtml = '';
    if (courier) {
        const avgKm = (courier.km / courier.stops).toFixed(1);
        kpiHtml = `
            <div class="bg-white p-3 rounded shadow w-full">
                <p class="text-sm text-gray-500">Distance</p>
                <p class="text-lg font-bold">${courier.km} km</p>
            </div>
            <div class="bg-white p-3 rounded shadow w-full">
                <p class="text-sm text-gray-500">km/Stop</p>
                <p class="text-lg font-bold">${avgKm}</p>
            </div>
            <div class="bg-white p-3 rounded shadow w-full">
                <p class="text-sm text-gray-500">Success % (sim)</p>
                <p class="text-lg font-bold">96.5%</p> <!-- Placeholder -->
            </div>
        `;
    } else {
        // Totals
        const totalKm = allRoutes.reduce((sum, r) => sum + r.km, 0);
        const totalStops = allRoutes.reduce((sum, r) => sum + r.stops, 0);
        const avgKmTotal = (totalKm / totalStops).toFixed(1);

        kpiHtml = `
            <div class="bg-white p-3 rounded shadow w-full">
                <p class="text-sm text-gray-500">Total Distance</p>
                <p class="text-lg font-bold">${totalKm} km</p>
            </div>
            <div class="bg-white p-3 rounded shadow w-full">
                <p class="text-sm text-gray-500">Avg km/Stop</p>
                <p class="text-lg font-bold">${avgKmTotal}</p>
            </div>
            <div class="bg-white p-3 rounded shadow w-full">
                <p class="text-sm text-gray-500">Overall Success %</p>
                <p class="text-lg font-bold">92.0%</p>
            </div>
             <div class="col-span-2">
                <button onclick="runAI()" class="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600">Run AI</button>
            </div>
        `;
    }
    kpiSnap.innerHTML = kpiHtml;
}

function renderSummaryCards() {
    summaryCards.innerHTML = `
        <div class="bg-white p-3 rounded shadow">
            <p class="text-sm text-gray-500">Routes Optimised</p>
            <p class="text-2xl font-bold">${summaryData.routesOptimised}</p>
        </div>
        <div class="bg-white p-3 rounded shadow">
            <p class="text-sm text-gray-500">Stops Merged</p>
            <p class="text-2xl font-bold">${summaryData.stopsMerged}</p>
        </div>
        <div class="bg-white p-3 rounded shadow">
            <p class="text-sm text-gray-500">Calls Scheduled</p>
            <p class="text-2xl font-bold">${summaryData.callsScheduled}</p>
        </div>
        <div class="bg-white p-3 rounded shadow w-full">
            <p class="text-sm text-gray-500">Time Saved</p>
            <p class="text-2xl font-bold">${summaryData.timeSavedMin} min</p>
        </div>
        <div class="bg-white p-3 rounded shadow w-full">
            <p class="text-sm text-gray-500">Success Delta</p>
            <p class="text-2xl font-bold text-green-500">+${summaryData.successDelta}%</p>
        </div>
        <div class="bg-white p-3 rounded shadow w-full">
            <p class="text-sm text-gray-500">Spoilage Delta</p>
            <p class="text-2xl font-bold text-red-500">${summaryData.spoilageDelta}%</p>
        </div>
        <div class="bg-white p-3 rounded shadow w-full">
            <p class="text-sm text-gray-500">Efficiency Gain</p>
            <p class="text-2xl font-bold text-green-500">${summaryData.effGainPct}%</p>
        </div>
    `;
}

function showSummaryDetail(key) {
    let title = '';
    let addresses = [];
    
    const stopsA = stopsData['A'];

    switch(key) {
        case 'routesOptimised':
            title = 'Optimised Routes';
            addresses = stopsA.filter(s => s.ai === 'Optimised').map(s => s.addr);
            break;
        case 'stopsMerged':
            title = 'Merged Stops';
            addresses = [stopsA[2].addr, stopsA[4].addr]; // Mock
            break;
        case 'callsScheduled':
            title = 'Scheduled Calls';
            addresses = stopsA.filter(s => s.warning && s.warning.includes('Call')).map(s => s.addr);
            break;
    }

    modalTitle.textContent = title;
    modalList.innerHTML = addresses.map(addr => `<li>${addr}</li>`).join('');
    modal.classList.remove('hidden');
}

function runAI() {
    // Simulate AI running and updating KPIs
    const totalKm = allRoutes.reduce((sum, r) => sum + r.km, 0);
    const totalStops = allRoutes.reduce((sum, r) => sum + r.stops, 0);

    const newKm = 90;
    const newAvgKm = (newKm / (totalStops - 3)).toFixed(1); //-3 for removed stops
    const newSuccess = "99.2%";

    kpiSnap.innerHTML = `
        <div class="bg-white p-3 rounded shadow kpi-glow">
            <p class="text-sm text-gray-500">Total Distance</p>
            <p class="text-lg font-bold">${newKm} km</p>
        </div>
        <div class="bg-white p-3 rounded shadow kpi-glow">
            <p class="text-sm text-gray-500">Avg km/Stop</p>
            <p class="text-lg font-bold">${newAvgKm}</p>
        </div>
        <div class="bg-gray-100 p-2 rounded kpi-glow">
            <p class="text-sm text-gray-500">Overall Success %</p>
            <p class="text-lg font-bold">${newSuccess}</p>
        </div>
         <div class="col-span-2">
            <button class="w-full py-2 px-4 bg-gray-400 text-white rounded cursor-not-allowed">AI Run Complete</button>
        </div>
    `;
    
    // Animate KPI cards
    const kpiCards = kpiSnap.querySelectorAll('.kpi-glow');
    kpiCards.forEach(card => {
        card.style.animation = 'glow .8s ease-in-out';
        setTimeout(() => {
            card.style.animation = '';
        }, 800);
    });

    // Handle warnings and update summary
    handleWarnings();
}

function handleWarnings() {
    // This is a simulation based on stops_A.json
    const stopsA = stopsData['A'];
    if (!stopsA) return;

    let callsScheduled = summaryData.callsScheduled;
    
    stopsA.forEach(stop => {
        if (stop.warning) {
            if (stop.warning.includes("Call before delivery")) {
                callsScheduled++;
                // In a real app, you'd update the timeline item badge here
                console.log(`Call scheduled for: ${stop.addr}`);
            }
            if (stop.warning.includes("Traffic jam risk")) {
                console.log(`Stop moved to tomorrow for: ${stop.addr}`);
                // Modify data and re-render
            }
            if (stop.warning.includes("Better to deliver evening")) {
                 console.log(`Stop moved to evening for: ${stop.addr}`);
                // Modify data and re-render
            }
        }
    });

    summaryData.callsScheduled = callsScheduled;
    
    // Animate and re-render summary cards
    renderSummaryCards();
    const callCard = summaryCards.children[2]; // brittle selector
    if (callCard) {
        callCard.classList.add('kpi-glow');
         setTimeout(() => {
            callCard.classList.remove('kpi-glow');
        }, 800);
    }
}

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
