// State
let allRoutes = [];
let filteredRoutes = [];
let stopsData = {};
let currentSort = { key: 'id', asc: true };


// DOM Elements
let map;
let routeList, timelineList;
let routeLayers = [];

// Make map available globally
window.aiMap = null;

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
    initToggleButtons();
    
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
    console.log('Initializing AI map...');
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }
    
    console.log('Map element found, dimensions:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

    // Initialize Leaflet map
    map = L.map(mapElement, {
        zoomControl: false
    }).setView([38.736946, -9.142685], 13);
    
    // Make map available globally
    window.aiMap = map;

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Force size recalculation
    setTimeout(() => {
        map.invalidateSize();
        console.log('Map size invalidated');
    }, 100);

    // Add some sample routes (similar to routes-map.js)
    setTimeout(() => {
        if (allRoutesData && allRoutesData.length > 0) {
            console.log('Adding routes to AI map...');
            addRoutesToAIMap();
        } else {
            console.warn('No routes data available for AI map');
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

function initToggleButtons() {
    const tomorrowBtn = document.getElementById('toggle-tomorrow');
    const todayBtn = document.getElementById('toggle-today');
    const optimizeBtn = document.getElementById('optimize-btn');

    if (!tomorrowBtn || !todayBtn || !optimizeBtn) {
        console.error('Toggle buttons or optimize button not found');
        return;
    }

    // Default data for Tomorrow
    const tomorrowData = {
        'routes-optimised': '15 %',
        'stops-merged': '7',
        'calls-scheduled': '2',
        'time-saved': '42 min',
        'success-rate': '+7.2 %',
        'spoilage-risk': '-0.8 %',
        'efficiency-gain': '15 %',
        'cost-reduction': '€2,340'
    };

    // Empty data for Today
    const todayData = {
        'routes-optimised': '0 %',
        'stops-merged': '0',
        'calls-scheduled': '0',
        'time-saved': '0 min',
        'success-rate': '0 %',
        'spoilage-risk': '0 %',
        'efficiency-gain': '0 %',
        'cost-reduction': '€0'
    };

    function updateToggleState(activeBtn, inactiveBtn) {
        // Update button styles
        activeBtn.className = 'flex-1 py-2 px-3 text-sm font-medium rounded-md bg-blue-600 text-white transition-colors';
        inactiveBtn.className = 'flex-1 py-2 px-3 text-sm font-medium rounded-md text-gray-600 hover:text-gray-800 transition-colors';
    }

    function updateOptimizationData(data) {
        Object.entries(data).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                
                // Update colors based on value
                element.className = element.className.replace(/text-(blue|green|red|gray)-\d+/, '');
                if (value === '0' || value === '0 %' || value === '0 min' || value === '€0') {
                    element.className += ' text-gray-400';
                } else if (id === 'routes-optimised' || id === 'efficiency-gain') {
                    element.className += ' text-blue-600';
                } else if (id === 'time-saved' || id === 'success-rate' || id === 'spoilage-risk' || id === 'cost-reduction') {
                    element.className += ' text-green-600';
                } else {
                    element.className += ' text-gray-900';
                }
            }
        });
    }

    function updateOptimizeButton(isDefault) {
        if (isDefault) {
            // Default state - Tomorrow selected
            optimizeBtn.className = 'w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors';
            optimizeBtn.style.opacity = '1';
        } else {
            // Active state - Today selected, data cleared
            optimizeBtn.className = 'w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors animate-pulse';
            optimizeBtn.style.opacity = '1';
        }
    }

    // Event listeners
    tomorrowBtn.addEventListener('click', () => {
        updateToggleState(tomorrowBtn, todayBtn);
        updateOptimizationData(tomorrowData);
        updateOptimizeButton(true); // Default state
    });

    todayBtn.addEventListener('click', () => {
        updateToggleState(todayBtn, tomorrowBtn);
        updateOptimizationData(todayData);
        updateOptimizeButton(false); // Active state
    });

    // Initialize with Tomorrow selected (default)
    updateToggleState(tomorrowBtn, todayBtn);
    updateOptimizationData(tomorrowData);
    updateOptimizeButton(true);
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
