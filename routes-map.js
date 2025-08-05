let routesMap = null;
let routeLayers = [];
let activeRoute = null;

function initRoutesMap(allRoutesData) {
    console.log('initRoutesMap called with data:', allRoutesData);
    
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded!');
        const mapElement = document.getElementById('routes-map');
        if (mapElement) {
            mapElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #666; background: #f9f9f9; border-radius: 8px; margin: 20px;">Map library is loading... Please wait or refresh the page.</div>';
        }
        // Try to wait a bit longer for Leaflet to load
        setTimeout(() => initRoutesMap(allRoutesData), 1000);
        return;
    }
    console.log('Leaflet library found:', L);
    
    if (routesMap) {
        console.log('Removing existing map...');
        routesMap.remove();
        routesMap = null;
        routeLayers = [];
    }

    const mapElement = document.getElementById('routes-map');
    console.log('Map element found:', mapElement);
    if (!mapElement) {
        console.error('Routes map element not found');
        return;
    }
    
    // Show loading indicator
    mapElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 16px; background: #f0f0f0;"><div>Loading map...</div></div>';
    
    console.log('Map element dimensions:', {
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight
    });

    console.log('Creating Leaflet map...');
    // Clear the loading indicator
    mapElement.innerHTML = '';
    
    try {
        routesMap = L.map(mapElement).setView([38.736946, -9.142685], 13);
        console.log('Map created successfully:', routesMap);

        console.log('Adding tile layer...');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(routesMap);
        console.log('Tile layer added successfully');
        
        // Force map to invalidate size immediately after creation
        setTimeout(() => {
            routesMap.invalidateSize();
            console.log('Map size invalidated');
        }, 100);
        
        // Add ResizeObserver to handle container size changes
        const resizeObserver = new ResizeObserver(() => {
            routesMap.invalidateSize();
            console.log('Map size invalidated due to resize');
        });
        resizeObserver.observe(mapElement);
        
    } catch (error) {
        console.error('Error creating map:', error);
        // Try a simple fallback
        mapElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Map loading... Please refresh if not visible.</div>';
        return;
    }

    // Add routes with delay like in AI Optimizer
    setTimeout(() => {
        console.log('Adding routes to map...');
        if (allRoutesData && allRoutesData.length > 0) {
            addRoutesToRoutesMap(allRoutesData);
        } else {
            console.error('No routes data available');
        }
    }, 500);
}

function addRoutesToRoutesMap(allRoutesData) {
    console.log('addRoutesToRoutesMap called with:', allRoutesData);
    const routesData = generateRoutesData(allRoutesData);
    console.log('Generated routes data:', routesData);
    
    routesData.forEach((routeData, index) => {
        const polyline = L.polyline(routeData.path, { 
            color: routeData.color,
            weight: 2,
            opacity: 0.9
        });
        
        polyline.on('click', () => {
            setActiveRoute(polyline, routeData, allRoutesData); 
        });

        routeLayers.push({polyline: polyline, markers: [], id: routeData.id});
        polyline.addTo(routesMap);

        routeData.path.forEach((point, pIndex) => {
            const isEndPoint = pIndex === routeData.path.length - 1;
            const circleMarker = L.circleMarker(point, {
                radius: isEndPoint ? 6 : 4,
                color: routeData.color,
                weight: 2,
                fillColor: isEndPoint ? routeData.color : '#FFFFFF',
                fillOpacity: 1
            }).addTo(routesMap);
            routeLayers[index].markers.push(circleMarker);
        });
    });
    
    setTimeout(() => {
        routesMap.invalidateSize();
        // Force a second invalidation to ensure proper rendering
        setTimeout(() => {
            routesMap.invalidateSize();
        }, 200);
    }, 100);
    
    // Expose selectRoute globally so table clicks can highlight the route
    window.selectRoute = (routeId) => {
        const routeIndex = routesData.findIndex(r => r.id === routeId);
        if (routeIndex !== -1) {
            setActiveRoute(routeLayers[routeIndex].polyline, routesData[routeIndex], allRoutesData);
        }
    };
}

function setActiveRoute(polyline, routeData, allRoutesData) {
    // Reset all polylines to default style
    routeLayers.forEach(layer => {
        layer.polyline.setStyle({ weight: 2, opacity: 0.5 });
    });
    
    // Highlight selected polyline
    polyline.setStyle({ weight: 4, opacity: 1 });
    
    updateRoutesKpis(routeData, allRoutesData);
    
    if(window.renderRoutesTable) {
        window.renderRoutesTable(routeData.id);
    }
}

function updateRoutesStatsCards(allRoutesData) {
    const statsContainer = document.getElementById('routes-stats-cards');
    if (!statsContainer) return;

    const totalKm = allRoutesData.reduce((sum, r) => sum + r.km, 0);
    const totalStops = allRoutesData.reduce((sum, r) => sum + r.stops, 0);
    const avgEfficiency = 89; // Static value as shown in the image
    const costSavings = 2340; // Static value as shown in the image

    const stats = {
        'Active Routes': allRoutesData.length,
        'Total Distance': `${totalKm} km`,
        'Avg Efficiency': `${avgEfficiency}%`,
        'Cost Savings': `€${costSavings.toLocaleString()}`
    };

    const colors = [
        'bg-blue-50 border-blue-200 text-blue-800',
        'bg-green-50 border-green-200 text-green-800', 
        'bg-yellow-50 border-yellow-200 text-yellow-800',
        'bg-purple-50 border-purple-200 text-purple-800'
    ];

    statsContainer.innerHTML = Object.entries(stats).map(([key, value], index) => `
        <div class="bg-white p-4 rounded-lg shadow border-l-4 ${colors[index]}">
            <p class="text-sm font-medium">${key}</p>
            <p class="text-2xl font-bold mt-1">${value}</p>
        </div>
    `).join('');
}

function updateRoutesKpis(routeData = null, allRoutesData) {
    const kpiContainer = document.getElementById('routes-kpis');
    if (!kpiContainer) return;

    let kpiData;

    if (routeData) {
        kpiData = {
            activeRoutes: 24,
            distance: `${routeData.km} km`,
            distancePerStop: `${(routeData.km / routeData.stops).toFixed(1)} km`,
            successRate: `${(70 + Math.random() * 10).toFixed(1)} %`,
            co2: `${(routeData.km * 0.16).toFixed(1)} kg`
        };
    } else {
        const totalKm = allRoutesData.reduce((sum, r) => sum + r.km, 0);
        const totalStops = allRoutesData.reduce((sum, r) => sum + r.stops, 0);
        kpiData = {
            activeRoutes: 24,
            distance: `${totalKm.toFixed(1)} km`,
            distancePerStop: `${(totalKm / totalStops).toFixed(1)} km`,
            successRate: '78.0 %',
            co2: `${(totalKm * 0.16).toFixed(1)} kg`
        };
    }
    
    kpiContainer.innerHTML = `
        <div class="text-center">
            <p class="text-xs text-gray-500">Active Routes</p>
            <p class="text-lg font-bold text-gray-800">${kpiData.activeRoutes}</p>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500">Total Distance</p>
            <p class="text-lg font-bold text-gray-800">${kpiData.distance}</p>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500">Distance/Stop</p>
            <p class="text-lg font-bold text-gray-800">${kpiData.distancePerStop}</p>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500">Success Rate</p>
            <p class="text-lg font-bold text-gray-800">${kpiData.successRate}</p>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500">CO₂ Total</p>
            <p class="text-lg font-bold text-gray-800">${kpiData.co2}</p>
        </div>
    `;
}

function generateRoutesData(allRoutesData) {
    const routes = [];
    const clusters = [
        { lat: 38.715, lng: -9.16 }, // Estrela area for Red routes (High risk)
        { lat: 38.74, lng: -9.12 },   // Beato area for Yellow routes (Med risk)
        { lat: 38.75, lng: -9.17 }  // Benfica area for Green routes (Low risk)
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

        routes.push({
            ...routeInfo,
            path: path,
            color: routeInfo.risk === 'High' ? '#F44336' : routeInfo.risk === 'Med' ? '#FFC107' : '#4CAF50' // Red, Yellow, Green
        });
    });

    return routes;
}
window.initRoutesMap = initRoutesMap;

// Add test function to manually trigger map initialization
window.testRoutesMap = function() {
    console.log('Manual test of routes map...');
    const mapElement = document.getElementById('routes-map');
    if (mapElement) {
        console.log('Map element found, dimensions:', {
            width: mapElement.offsetWidth,
            height: mapElement.offsetHeight
        });
        initRoutesMap(allRoutesData);
    } else {
        console.error('Map element not found');
    }
};