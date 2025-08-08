let routesMap = null;
let routeLayers = [];
let activeRoute = null;

function initRoutesMap(allRoutesData) {
    console.log('=== initRoutesMap called ===');
    console.log('allRoutesData:', allRoutesData);
    
    if (routesMap) {
        console.log('Removing existing map');
        routesMap.remove();
        routesMap = null;
        routeLayers = [];
    }

    const mapElement = document.getElementById('routes-map');
    console.log('Map element:', mapElement);
    
    if (!mapElement) {
        console.error('Map element #routes-map not found.');
        return;
    }
    
    // Ensure the map container has proper dimensions
    if (mapElement.offsetHeight === 0 || mapElement.offsetWidth === 0) {
        console.warn('Map container has zero dimensions. Waiting for layout...');
        setTimeout(() => initRoutesMap(allRoutesData), 300); // Retry after a longer delay
        return;
    }
    
    console.log('Map element dimensions:', {
        width: mapElement.offsetWidth,
        height: mapElement.offsetHeight,
        clientWidth: mapElement.clientWidth,
        clientHeight: mapElement.clientHeight
    });

    console.log('Creating Leaflet map...');
    try {
        // Create the map with Live Map configuration
        routesMap = L.map(mapElement, {
            zoomControl: false,
            attributionControl: true
        }).setView([38.736946, -9.142685], 13);
        
        console.log('Map created successfully:', routesMap);
    } catch (error) {
        console.error('Error creating map:', error);
        return;
    }
    
    // Add tile layer with Live Map configuration
    try {
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(routesMap);
    } catch (error) {
        console.error('Error adding tile layer:', error);
        // Fallback to OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(routesMap);
    }

    // Add zoom control like Live Map
    L.control.zoom({ position: 'topright' }).addTo(routesMap);

    // Add routes to the map
    if (allRoutesData && allRoutesData.length > 0) {
        addRoutesToRoutesMap(allRoutesData);
    } else {
        console.warn('No routes data available');
        // Add a sample marker to show the map is working
        L.marker([38.736946, -9.142685]).addTo(routesMap)
            .bindPopup('Map is working! No routes data available.')
            .openPopup();
    }

    // Ensure the map is properly displayed
    setTimeout(() => {
        if (routesMap) {
            routesMap.invalidateSize();
            console.log('Map size invalidated (100ms)');
        }
    }, 100);
    
    setTimeout(() => {
        if (routesMap) {
            routesMap.invalidateSize();
            console.log('Map size invalidated (500ms)');
        }
    }, 500);
    
    setTimeout(() => {
        if (routesMap) {
            routesMap.invalidateSize();
            console.log('Map size invalidated (1000ms)');
        }
    }, 1000);
    
    // Add ResizeObserver to handle dynamic resizing
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            if (routesMap) {
                routesMap.invalidateSize();
            }
        });
        resizeObserver.observe(mapElement);
    }
    
    // Make map available globally
    window.routesMap = routesMap;
    
    console.log('=== Map initialization completed ===');
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

        // Add markers at route points with Live Map style
        routeData.path.forEach((point, pIndex) => {
            const isEndPoint = pIndex === routeData.path.length - 1;
            
            // Create custom div icon similar to Live Map
            const iconHtml = `
                <div class="relative flex items-center justify-center w-6 h-6 rounded-full ${getRiskBgColor(routeData.risk)} shadow-md border-2 border-white">
                    <div class="text-xs font-bold text-white">${routeData.id}</div>
                </div>`;

            const routeIcon = L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker(point, { icon: routeIcon })
                .bindPopup(`<b>Route:</b> ${routeData.id}<br><b>Courier:</b> ${routeData.name}<br><b>Risk:</b> ${routeData.risk}`)
                .addTo(routesMap);
                
            routeLayers[index].markers.push(marker);
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
    
    // Make panToRoute globally available (similar to Live Map's panToVehicle)
    window.panToRoute = (routeId) => {
        const routeLayer = routeLayers.find(layer => layer.id === routeId);
        if (routeLayer && routeLayer.markers.length > 0) {
            // Pan to the first marker of the route
            routesMap.panTo(routeLayer.markers[0].getLatLng());
            routeLayer.markers[0].openPopup();
            // Highlight the route
            setActiveRoute(routeLayer.polyline, routesData.find(r => r.id === routeId), allRoutesData);
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
        { lat: 38.75, lng: -9.17 },   // Benfica area for Green routes (Low risk)
        { lat: 38.72, lng: -9.13 },   // Alfama area (additional cluster)
        { lat: 38.73, lng: -9.15 },   // Campo de Ourique area (additional cluster)
        { lat: 38.76, lng: -9.14 }    // Alvalade area (additional cluster)
    ];
    const shapes = ['diamond', 'rectangle', 'triangle', 'circle', 'hexagon'];

    // Display all routes, distribute them across clusters
    allRoutesData.forEach((routeInfo, i) => {
        if (!routeInfo) return;

        // Determine cluster based on risk and index for better distribution
        let clusterIndex;
        if (routeInfo.risk === 'High') {
            clusterIndex = i % 2; // Use first 2 clusters for high risk
        } else if (routeInfo.risk === 'Med') {
            clusterIndex = 2 + (i % 2); // Use clusters 2-3 for medium risk
        } else {
            clusterIndex = 4 + (i % 2); // Use clusters 4-5 for low risk
        }
        
        const cluster = clusters[clusterIndex];
        const path = [];
        const shape = shapes[i % shapes.length];

        // Add some randomness to avoid overlapping
        const centerLat = cluster.lat + (Math.random() - 0.5) * 0.015;
        const centerLng = cluster.lng + (Math.random() - 0.5) * 0.015;
        const latRadius = 0.002 + Math.random() * 0.004;
        const lngRadius = 0.002 + Math.random() * 0.004;

        // Generate different shapes for variety
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
        } else if (shape === 'triangle') {
            path.push([centerLat + latRadius, centerLng]);
            path.push([centerLat - latRadius, centerLng - lngRadius]);
            path.push([centerLat - latRadius, centerLng + lngRadius]);
            path.push([centerLat + latRadius, centerLng]);
        } else if (shape === 'circle') {
            // Generate circular path
            const numPoints = 8;
            for (let j = 0; j <= numPoints; j++) {
                const angle = (j / numPoints) * 2 * Math.PI;
                const lat = centerLat + latRadius * Math.cos(angle);
                const lng = centerLng + lngRadius * Math.sin(angle);
                path.push([lat, lng]);
            }
        } else { // hexagon
            const numPoints = 6;
            for (let j = 0; j <= numPoints; j++) {
                const angle = (j / numPoints) * 2 * Math.PI;
                const lat = centerLat + latRadius * Math.cos(angle);
                const lng = centerLng + lngRadius * Math.sin(angle);
                path.push([lat, lng]);
            }
        }

        // Assign colors based on risk level
        let color;
        if (routeInfo.risk === 'High') {
            color = '#DC3545'; // Red
        } else if (routeInfo.risk === 'Med') {
            color = '#FFC107'; // Yellow
        } else {
            color = '#28A745'; // Green
        }

        routes.push({
            ...routeInfo,
            path: path,
            color: color
        });
    });

    return routes;
}
window.initRoutesMap = initRoutesMap;
window.updateRoutesKpis = updateRoutesKpis;
window.refreshRoutesMap = function() {
    if (routesMap) {
        setTimeout(() => {
            routesMap.invalidateSize();
        }, 100);
    }
};

// Force map initialization
window.forceInitRoutesMap = function() {
    console.log('🚀 FORCE INIT ROUTES MAP');
    if (typeof allRoutesData !== 'undefined') {
        initRoutesMap(allRoutesData);
    } else {
        console.error('allRoutesData not available');
    }
};

// Add test function to manually trigger map initialization
window.testRoutesMap = function() {
    console.log('=== MANUAL MAP TEST ===');
    const mapElement = document.getElementById('routes-map');
    
    if (!mapElement) {
        console.error('❌ Map element not found!');
        alert('Map element not found! Check if you are on Routes page.');
        return;
    }
    
    console.log('✅ Map element found');
    console.log('📏 Container dimensions:', {
        offsetWidth: mapElement.offsetWidth,
        offsetHeight: mapElement.offsetHeight,
        clientWidth: mapElement.clientWidth,
        clientHeight: mapElement.clientHeight,
        scrollWidth: mapElement.scrollWidth,
        scrollHeight: mapElement.scrollHeight
    });
    
    console.log('🎨 Container styles:', {
        display: window.getComputedStyle(mapElement).display,
        position: window.getComputedStyle(mapElement).position,
        width: window.getComputedStyle(mapElement).width,
        height: window.getComputedStyle(mapElement).height,
        visibility: window.getComputedStyle(mapElement).visibility
    });
    
    console.log('📊 Available data:', allRoutesData ? allRoutesData.length + ' routes' : 'No data');
    console.log('🔧 Leaflet available:', typeof L !== 'undefined');
    
    if (routesMap) {
        console.log('⚠️ Existing map found, removing...');
        routesMap.remove();
        routesMap = null;
        routeLayers = [];
    }
    
    console.log('🚀 Initializing map...');
    initRoutesMap(allRoutesData);
    
    setTimeout(() => {
        if (routesMap) {
            console.log('✅ Map initialized successfully!');
            alert('Map test completed! Check console for details.');
        } else {
            console.error('❌ Map initialization failed!');
            alert('Map initialization failed! Check console for errors.');
        }
    }, 2000);
};