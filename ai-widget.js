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
    console.log('=== Initializing AI Widget ===');
    
    // DOM elements initialization
    routeList = document.getElementById('route-list')?.querySelector('tbody');
    timelineList = document.getElementById('timeline-list');

    if (!routeList || !timelineList) {
        console.warn('AI widget: optional elements missing (routeList or timelineList). Proceeding with map init only.');
    }

    // Initialize map with a delay to ensure DOM is ready
    setTimeout(() => {
        console.log('🚀 Initializing AI map after DOM delay...');
        initAIMap();
    }, 300);

    // Event Listeners
    document.getElementById('back-to-overview')?.addEventListener('click', backToOverview);
    
    // Initialize toggle buttons with small delay to ensure DOM is ready
    setTimeout(() => {
        initToggleButtons();
    }, 200);
    
    // Load data
    allRoutes = allRoutesData;
    stopsData = stopsDataAll;
    
    // Initialize table/sorting only if elements exist
    if (routeList) {
        initAISorting();
        renderRouteTable();
    } else {
        console.log('AI widget: skipping route table rendering (routeList not found).');
    }
    
    console.log('=== AI Widget initialization completed ===');
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
    console.log('=== Initializing AI map ===');
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('❌ Map element not found');
        return;
    }
    
    console.log('✅ Map element found, dimensions:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

    // Force the container to have proper dimensions if it doesn't
    if (mapElement.offsetHeight === 0 || mapElement.offsetWidth === 0) {
        console.warn('⚠️ Map container has zero dimensions. Forcing dimensions...');
        mapElement.style.height = '400px';
        mapElement.style.width = '100%';
        mapElement.style.minHeight = '400px';
        mapElement.style.display = 'block';
        mapElement.style.position = 'relative';
        
        // Wait a bit more for the styles to apply
        setTimeout(() => {
            console.log('🔄 Retrying map initialization after forcing dimensions...');
            initAIMap();
        }, 500);
        return;
    }

    // Remove existing map if it exists
    if (map) {
        console.log('🗑️ Removing existing map...');
        map.remove();
        map = null;
        routeLayers = [];
    }

    console.log('🗺️ Creating new Leaflet map...');
    
    // Initialize Leaflet map with Live Map configuration
    try {
        map = L.map(mapElement, {
            zoomControl: false,
            attributionControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
            touchZoom: true
        }).setView([38.736946, -9.142685], 13);
        
        console.log('✅ Map created successfully:', map);
    } catch (error) {
        console.error('❌ Error creating map:', error);
        return;
    }
    
    // Make map available globally
    window.aiMap = map;

    // Add tile layer with Live Map configuration
    try {
        console.log('🌍 Adding tile layer...');
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        console.log('✅ Tile layer added successfully');
    } catch (error) {
        console.error('❌ Error adding tile layer:', error);
        // Fallback to OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
        console.log('✅ Fallback tile layer added');
    }

    // Add zoom control like Live Map
    L.control.zoom({ position: 'topright' }).addTo(map);
    console.log('✅ Zoom control added');

    // Force size recalculation multiple times
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
            console.log('🔄 Map size invalidated (100ms)');
        }
    }, 100);
    
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
            console.log('🔄 Map size invalidated (500ms)');
        }
    }, 500);
    
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
            console.log('🔄 Map size invalidated (1000ms)');
        }
    }, 1000);

    // Add routes to the map
    setTimeout(() => {
        if (allRoutesData && allRoutesData.length > 0) {
            console.log('🛣️ Adding routes to AI map...');
            addRoutesToAIMap();
        } else {
            console.warn('⚠️ No routes data available for AI map');
            // Add a sample marker to show the map is working
            L.marker([38.736946, -9.142685]).addTo(map)
                .bindPopup('AI Map is working! No routes data available.')
                .openPopup();
            console.log('✅ Sample marker added');
        }
    }, 500);
    
    // Add ResizeObserver to handle dynamic resizing
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            if (map) {
                map.invalidateSize();
            }
        });
        resizeObserver.observe(mapElement);
        console.log('✅ ResizeObserver added');
    }
    
    console.log('=== AI Map initialization completed ===');
}

// Add test function to manually trigger AI map initialization
window.testAIMap = function() {
    console.log('=== MANUAL AI MAP TEST ===');
    const mapElement = document.getElementById('map');
    
    if (!mapElement) {
        console.error('❌ AI Map element not found!');
        alert('AI Map element not found! Check if you are on AI Optimizer page.');
        return;
    }
    
    console.log('✅ AI Map element found');
    console.log('📏 Container dimensions:', {
        offsetWidth: mapElement.offsetWidth,
        offsetHeight: mapElement.offsetHeight,
        clientWidth: mapElement.clientWidth,
        clientHeight: mapElement.clientHeight
    });
    
    console.log('🎨 Container styles:', {
        display: window.getComputedStyle(mapElement).display,
        position: window.getComputedStyle(mapElement).position,
        width: window.getComputedStyle(mapElement).width,
        height: window.getComputedStyle(mapElement).height,
        background: window.getComputedStyle(mapElement).background
    });
    
    console.log('📊 Available data:', allRoutesData ? allRoutesData.length + ' routes' : 'No data');
    console.log('🔧 Leaflet available:', typeof L !== 'undefined');
    
    if (map) {
        console.log('⚠️ Existing AI map found, removing...');
        map.remove();
        map = null;
        routeLayers = [];
    }
    
    console.log('🚀 Initializing AI map...');
    initAIMap();
    
    setTimeout(() => {
        if (map) {
            console.log('✅ AI Map initialized successfully!');
            console.log('🗺️ Map object:', map);
            console.log('📍 Map center:', map.getCenter());
            console.log('🔍 Map zoom:', map.getZoom());
            alert('AI Map test completed! Check console for details.');
        } else {
            console.error('❌ AI Map initialization failed!');
            alert('AI Map initialization failed! Check console for errors.');
        }
    }, 2000);
};

// Add a simple function to check if the map container exists and has proper dimensions
window.checkAIMapContainer = function() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('❌ Map container not found!');
        return false;
    }
    
    const dimensions = {
        offsetWidth: mapElement.offsetWidth,
        offsetHeight: mapElement.offsetHeight,
        clientWidth: mapElement.clientWidth,
        clientHeight: mapElement.clientHeight
    };
    
    console.log('📏 Map container dimensions:', dimensions);
    
    if (dimensions.offsetWidth === 0 || dimensions.offsetHeight === 0) {
        console.warn('⚠️ Map container has zero dimensions!');
        return false;
    }
    
    console.log('✅ Map container is properly sized');
    return true;
};

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

            // Add markers along the route with Live Map style
            const markers = path.map((point, pIndex) => {
                const isEndPoint = pIndex === path.length - 1;
                
                // Create custom div icon similar to Live Map
                const iconHtml = `
                    <div class="relative flex items-center justify-center w-6 h-6 rounded-full ${getRiskBgColor(routeInfo.risk)} shadow-md border-2 border-white">
                        <div class="text-xs font-bold text-white">${routeInfo.id}</div>
                    </div>`;

                const routeIcon = L.divIcon({
                    html: iconHtml,
                    className: '',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                const marker = L.marker(point, { icon: routeIcon })
                    .bindPopup(`<b>Route:</b> ${routeInfo.id}<br><b>Courier:</b> ${routeInfo.name}<br><b>Risk:</b> ${routeInfo.risk}`)
                    .addTo(map);
                    
                return marker;
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

function getRiskBgColor(risk) {
    switch (risk) {
        case 'High': return 'bg-red-500';
        case 'Med': return 'bg-yellow-500';
        case 'Low': return 'bg-green-500';
        default: return 'bg-gray-500';
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
    console.log('=== Initializing toggle buttons ===');
    
    // Try multiple times to find elements (DOM might still be loading)
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryInit() {
        attempts++;
        console.log(`Attempt ${attempts} to find toggle elements...`);
        
        const tomorrowBtn = document.getElementById('toggle-tomorrow');
        const todayBtn = document.getElementById('toggle-today');
        const optimizeBtn = document.getElementById('optimize-btn');

        if (!tomorrowBtn || !todayBtn || !optimizeBtn) {
            console.log('Some elements not found:', {
                tomorrowBtn: !!tomorrowBtn,
                todayBtn: !!todayBtn, 
                optimizeBtn: !!optimizeBtn
            });
            
            if (attempts < maxAttempts) {
                console.log(`Retrying in 300ms... (attempt ${attempts + 1}/${maxAttempts})`);
                setTimeout(tryInit, 300);
                return;
            } else {
                console.error('❌ Could not find toggle buttons after', maxAttempts, 'attempts');
                return;
            }
        }
        
        console.log('✅ All toggle buttons found successfully on attempt', attempts);
        console.log('Found elements:', {
            tomorrowBtn: tomorrowBtn.textContent,
            todayBtn: todayBtn.textContent,
            optimizeBtn: optimizeBtn.textContent
        });
        
        // Remove any existing event listeners
        const newTomorrowBtn = tomorrowBtn.cloneNode(true);
        const newTodayBtn = todayBtn.cloneNode(true);
        tomorrowBtn.parentNode.replaceChild(newTomorrowBtn, tomorrowBtn);
        todayBtn.parentNode.replaceChild(newTodayBtn, todayBtn);
        
        setupToggleFunctionality(newTomorrowBtn, newTodayBtn, optimizeBtn);
    }
    
    tryInit();
}

function setupToggleFunctionality(tomorrowBtn, todayBtn, optimizeBtn) {
    console.log('=== Setting up toggle functionality ===');
    
    // Track current toggle state
    let currentToggleState = 'tomorrow'; // 'tomorrow' or 'today'

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

    // Current data for Today (shows current state, needs optimization)
    const todayData = {
        'routes-optimised': '5 %',
        'stops-merged': '2',
        'calls-scheduled': '0',
        'time-saved': '8 min',
        'success-rate': '+2.1 %',
        'spoilage-risk': '+1.2 %',
        'efficiency-gain': '3 %',
        'cost-reduction': '€480'
    };

    function updateToggleState(activeBtn, inactiveBtn) {
        console.log('🔄 Updating toggle state:', {
            activeBtn: activeBtn.textContent,
            inactiveBtn: inactiveBtn.textContent
        });
        
        // Update button styles
        activeBtn.className = 'flex-1 py-2 px-3 text-sm font-medium rounded-md bg-blue-600 text-white transition-colors';
        inactiveBtn.className = 'flex-1 py-2 px-3 text-sm font-medium rounded-md text-gray-600 hover:text-gray-800 transition-colors';
        
        // Update state tracking
        currentToggleState = activeBtn.textContent.toLowerCase();
        
        console.log('✅ Toggle state updated successfully. Current state:', currentToggleState);
    }

    function updateOptimizationData(data) {
        console.log('📊 Updating optimization data:', data);
        Object.entries(data).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                
                // Update colors based on value and context
                element.className = element.className.replace(/text-(blue|green|red|gray)-\d+/, '');
                if (value === '0' || value === '0 %' || value === '0 min' || value === '€0') {
                    element.className += ' text-gray-400';
                } else if (id === 'routes-optimised' || id === 'efficiency-gain') {
                    element.className += ' text-blue-600';
                } else if (id === 'spoilage-risk') {
                    // Spoilage risk: negative is good (green), positive is bad (red)
                    if (value.startsWith('-')) {
                        element.className += ' text-green-600';
                    } else {
                        element.className += ' text-red-600';
                    }
                } else if (id === 'time-saved' || id === 'success-rate' || id === 'cost-reduction') {
                    element.className += ' text-green-600';
                } else {
                    element.className += ' text-gray-900';
                }
            } else {
                console.warn(`⚠️ Element with id '${id}' not found`);
            }
        });
        console.log('✅ Optimization data updated');
    }

    function updateOptimizeButton(isDefault) {
        if (isDefault) {
            // Default state - Tomorrow selected (normal appearance)
            optimizeBtn.className = 'w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors';
            optimizeBtn.style.opacity = '1';
            optimizeBtn.disabled = false;
            optimizeBtn.textContent = 'Optimize';
            // Remove any animation or special effects
            optimizeBtn.style.animation = 'none';
            optimizeBtn.style.boxShadow = 'none';
            optimizeBtn.classList.remove('animate-pulse', 'shadow-lg');
        } else {
            // Active state - Today selected, needs optimization (highlighted)
            optimizeBtn.className = 'w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors animate-pulse shadow-lg';
            optimizeBtn.style.opacity = '1';
            optimizeBtn.disabled = false;
            optimizeBtn.textContent = 'Optimize Now!';
        }
    }

    // Event listeners
    console.log('🔗 Attaching event listeners...');
    
    tomorrowBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🟦 Tomorrow button clicked - setting default state');
        updateToggleState(tomorrowBtn, todayBtn);
        updateOptimizationData(tomorrowData);
        updateOptimizeButton(true); // Default state
        currentToggleState = 'tomorrow';
        console.log('✅ Optimize button set to default state');
    });

    todayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🟨 Today button clicked - setting active state');
        updateToggleState(todayBtn, tomorrowBtn);
        updateOptimizationData(todayData);
        updateOptimizeButton(false); // Active state
        currentToggleState = 'today';
        console.log('✅ Optimize button set to active state');
    });

    console.log('✅ Event listeners attached successfully');
    
    // Initialize with Tomorrow selected (default)
    console.log('Initializing with Tomorrow data and default button state...');
    updateToggleState(tomorrowBtn, todayBtn);
    updateOptimizationData(tomorrowData);
    updateOptimizeButton(true); // Ensure default state
    console.log('Initial button state set to default');
    
    // Add click handler for optimize button
    optimizeBtn.addEventListener('click', () => {
        console.log('Optimize button clicked');
        
        // Show feedback
        const originalText = optimizeBtn.textContent;
        optimizeBtn.textContent = 'Optimizing...';
        optimizeBtn.disabled = true;
        optimizeBtn.className = 'w-full py-3 px-4 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed transition-colors';
        
        // Simulate optimization process
        setTimeout(() => {
            optimizeBtn.textContent = 'Optimization Complete!';
            optimizeBtn.className = 'w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg transition-colors';
            
            // Reset after 2 seconds
            setTimeout(() => {
                optimizeBtn.textContent = originalText;
                optimizeBtn.disabled = false;
                // Use the tracked state to determine button appearance
                if (currentToggleState === 'tomorrow') {
                    updateOptimizeButton(true); // Default state for Tomorrow
                } else {
                    updateOptimizeButton(false); // Active state for Today
                }
            }, 2000);
        }, 1500);
    });
    
    console.log('Toggle buttons initialization complete');
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

// Global function for testing toggle functionality from browser console
window.testToggleFunctionality = function() {
    console.log('=== Testing Toggle Functionality ===');
    
    const tomorrowBtn = document.getElementById('toggle-tomorrow');
    const todayBtn = document.getElementById('toggle-today');
    const optimizeBtn = document.getElementById('optimize-btn');
    
    console.log('Elements found:', {
        tomorrowBtn: !!tomorrowBtn,
        todayBtn: !!todayBtn,
        optimizeBtn: !!optimizeBtn
    });
    
    if (tomorrowBtn && todayBtn && optimizeBtn) {
        console.log('✅ All elements found');
        
        // Test Tomorrow click
        console.log('🟦 Testing Tomorrow click...');
        tomorrowBtn.click();
        setTimeout(() => {
            console.log('Tomorrow state:', {
                buttonText: optimizeBtn.textContent,
                buttonClass: optimizeBtn.className,
                routesOptimised: document.getElementById('routes-optimised')?.textContent
            });
            
            // Test Today click
            console.log('🟨 Testing Today click...');
            todayBtn.click();
            setTimeout(() => {
                console.log('Today state:', {
                    buttonText: optimizeBtn.textContent,
                    buttonClass: optimizeBtn.className,
                    routesOptimised: document.getElementById('routes-optimised')?.textContent
                });
                
                console.log('✅ Toggle functionality test completed');
            }, 500);
        }, 500);
    } else {
        console.error('❌ Some elements not found');
    }
};

// Add a simple function to manually trigger toggle initialization
window.forceInitToggles = function() {
    console.log('=== Force Initializing Toggles ===');
    initToggleButtons();
};

// Auto-test when AI widget is loaded (for debugging)
window.addEventListener('load', () => {
    setTimeout(() => {
        if (document.getElementById('toggle-tomorrow')) {
            console.log('🔄 AI Widget toggle elements detected, running auto-test...');
            window.testToggleFunctionality();
        }
    }, 2000);
});
