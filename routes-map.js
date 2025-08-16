let routesMap = null;
// Use a uniquely named collection to avoid collisions with other pages
let routesPageLayers = [];
let activeRoute = null;

function initRoutesMap(allRoutesData) {
    console.log('=== initRoutesMap called ===');
    console.log('allRoutesData:', allRoutesData);
    
    if (routesMap) {
        console.log('Removing existing map');
        routesMap.remove();
        routesMap = null;
        routesPageLayers = [];
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
    // Helper to clamp points to safe land bounds (rough Lisbon; avoid river to the east)
    function clampToLand(lat, lng) {
        const minLat = 38.715, maxLat = 38.790; // away from water
        // Allow spread but keep clear of river
        const minLng = -9.250, maxLng = -9.155; // west of ~-9.155
        let clampedLat = Math.min(Math.max(lat, minLat), maxLat);
        let clampedLng = Math.min(Math.max(lng, minLng), maxLng - 0.002);
        return [clampedLat, clampedLng];
    }

    // Choose candidates with real stops (use global stopsDataAll binding, not window property)
    const hasStops = typeof stopsDataAll !== 'undefined';
    if (!hasStops) console.warn('stopsDataAll is not defined; falling back to synthetic routes');
    const pool = hasStops
        ? allRoutesData.filter(r => Array.isArray(stopsDataAll[r.id]) && stopsDataAll[r.id].length >= 2)
        : [];
    const candidates = pool.slice(0, Math.min(pool.length, 24));

    // A spread of mainland anchor points across Lisbon; used to translate paths without resizing
    const landAnchors = [
        // West (Ajuda, Restelo, Benfica)
        [38.725, -9.210], [38.735, -9.205], [38.745, -9.198], [38.740, -9.192],
        // Central-West (Alcântara, Campolide)
        [38.725, -9.190], [38.735, -9.185], [38.745, -9.180], [38.750, -9.175],
        // Central (Avenidas Novas, Saldanha)
        [38.740, -9.170], [38.735, -9.168], [38.745, -9.165], [38.750, -9.162],
        // North (Lumiar, Telheiras)
        [38.760, -9.190], [38.760, -9.175], [38.755, -9.165], [38.755, -9.180],
        // Southwest (Estrela, Lapa, Campo de Ourique)
        [38.720, -9.190], [38.725, -9.184], [38.730, -9.178], [38.735, -9.172],
        // Northwest (Carnide, Pontinha)
        [38.755, -9.205], [38.750, -9.200], [38.745, -9.195], [38.740, -9.188]
    ];
    let routesData = [];
    // Helper to compute a convex hull for a set of lat/lng points (monotone chain)
    function convexHullLatLng(points) {
        if (!points || points.length <= 3) return points ? points.slice() : [];
        const arr = points.map(([la, ln]) => ({ x: ln, y: la, ll: [la, ln] }))
                          .sort((a,b)=> a.x===b.x ? a.y-b.y : a.x-b.x);
        const cross = (o,a,b)=> (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
        const lower=[]; for(const p of arr){ while(lower.length>=2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop(); lower.push(p);} 
        const upper=[]; for(let i=arr.length-1;i>=0;i--){ const p=arr[i]; while(upper.length>=2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop(); upper.push(p);} 
        const h=lower.concat(upper.slice(1,-1));
        return h.map(p=>p.ll);
    }
    for (let i = 0; i < candidates.length; i++) {
        const r = candidates[i];
        const stops = stopsDataAll[r.id];
        if (!stops || stops.length < 2) continue;
        const orig = stops.map(s => [s.lat, s.lon]);
        // Keep original size; compute centroid then translate entire path to anchor with tiny jitter
        const centroid = orig.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]).map(v => v / orig.length);
        // Prefer central anchors for routes A and B so they appear next to others
        let anchor = landAnchors[i % landAnchors.length];
        const routeLetter = getRouteLetter(r.id);
        if (routeLetter === 'A') {
            anchor = [38.740, -9.170]; // central-west
        } else if (routeLetter === 'B') {
            anchor = [38.735, -9.168]; // central
        } else if (routeLetter === 'C') {
            anchor = [38.736, -9.175]; // align C with cluster as well
        }
        const jitterLat = (Math.random() - 0.5) * 0.004;
        const jitterLng = (Math.random() - 0.5) * 0.004;
        const target = [anchor[0] + jitterLat, anchor[1] + jitterLng];
        const scale = (routeLetter === 'A' || routeLetter === 'B') ? 0.22 : 0.18; // make A/B a bit longer
        let path = orig.map(([lat, lng]) => {
            const scaledLat = (lat - centroid[0]) * scale;
            const scaledLng = (lng - centroid[1]) * scale;
            return clampToLand(target[0] + scaledLat, target[1] + scaledLng);
        });
        // If any point is still too close to sea (east) or south, shift whole path inland and re-clamp
        const maxLngPath = Math.max(...path.map(p => p[1]));
        const minLatPath = Math.min(...path.map(p => p[0]));
        const eastThreshold = -9.157; // keep west of this
        const southThreshold = 38.720; // keep north of this
        let shiftLng = 0, shiftLat = 0;
        if (maxLngPath > eastThreshold) {
            shiftLng = eastThreshold - maxLngPath - 0.003; // negative shift (west)
        }
        if (minLatPath < southThreshold) {
            shiftLat = southThreshold - minLatPath + 0.003; // positive shift (north)
        }
        if (shiftLng !== 0 || shiftLat !== 0) {
            path = path.map(([lat, lng]) => clampToLand(lat + shiftLat, lng + shiftLng));
        }
        // For route C, enforce a hull-like loop so its shape matches the others' polygonal loops
        if (routeLetter === 'C') {
            const hull = convexHullLatLng(path);
            if (hull && hull.length >= 3) path = hull;
        }
        // Ensure closed loop
        if (path.length > 1) {
            const [s0, s1] = path[0];
            const [e0, e1] = path[path.length - 1];
            if (Math.abs(s0 - e0) > 1e-9 || Math.abs(s1 - e1) > 1e-9) path.push([s0, s1]);
        }
        let color = '#28A745';
        if (r.risk === 'High') color = '#DC3545';
        else if (r.risk === 'Med') color = '#FFC107';
        routesData.push({ ...r, path, color });
    }

    // Fallback: if no routes from real stops, use existing synthetic generator
    if (routesData.length === 0) {
        console.warn('No routes generated from stopsDataAll; using generateRoutesData fallback');
        routesData = generateRoutesData(allRoutesData).slice(0, 24);
    }
    console.log('Generated routes data:', routesData);
    
    routesData.forEach((routeData, index) => {
        const polyline = L.polyline(routeData.path, { color: routeData.color, weight: 4, opacity: 0.95, lineJoin: 'round', lineCap: 'round' });
        
        polyline.on('click', () => {
            setActiveRoute(polyline, routeData, allRoutesData); 
        });

        routesPageLayers.push({polyline: polyline, markers: [], id: routeData.id});
        polyline.addTo(routesMap);

        // Blue ID at start/end on the line
        const startLatLng = L.latLng(routeData.path[0][0], routeData.path[0][1]);
        const iconHtml = `
            <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#fff;border:2px solid #2563eb;">
                <div style="color:#2563eb;font-weight:700;font-size:12px;">${getRouteLetter(routeData.id)}</div>
            </div>`;
        const routeIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
        const startMarker = L.marker(startLatLng, { icon: routeIcon }).addTo(routesMap);
        routesPageLayers[index].markers.push(startMarker);

        // Small vertex dots
        const points = (routeData.path.length > 1 && routeData.path[0][0] === routeData.path[routeData.path.length - 1][0] && routeData.path[0][1] === routeData.path[routeData.path.length - 1][1]) ? routeData.path.slice(0, -1) : routeData.path;
        points.forEach(pt => {
            const dot = L.circleMarker(pt, { radius: 4, color: '#ffffff', weight: 2, fillColor: routeData.color, fillOpacity: 1 }).addTo(routesMap);
            routesPageLayers[index].markers.push(dot);
        });
         
    });
    
    // Fit to all routes so they are visible immediately
    if (routesPageLayers.length > 0) {
        const group = L.featureGroup(routesPageLayers.map(l => l.polyline));
        routesMap.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
    
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
            setActiveRoute(routesPageLayers[routeIndex].polyline, routesData[routeIndex], allRoutesData);
        }
    };
    
    // Make panToRoute globally available (similar to Live Map's panToVehicle)
    window.panToRoute = (routeId) => {
        const routeLayer = routesPageLayers.find(layer => layer.id === routeId);
        if (routeLayer && routeLayer.markers.length > 0) {
            // Pan to the first marker of the route
            routesMap.panTo(routeLayer.markers[0].getLatLng());
            routeLayer.markers[0].openPopup?.();
            // Highlight the route
            setActiveRoute(routeLayer.polyline, routesData.find(r => r.id === routeId), allRoutesData);
        }
    };
}

// Unique name to prevent clashes with AI Optimizer helpers
function getRoutesRiskBgColor(risk) {
    switch (risk) {
        case 'High': return 'bg-red-500';
        case 'Med': return 'bg-yellow-500';
        case 'Low': return 'bg-green-500';
        default: return 'bg-gray-400';
    }
}

function getRouteLetter(id) {
    const lettersOnly = String(id).match(/[A-Za-z]/g);
    return lettersOnly && lettersOnly.length > 0 ? lettersOnly[0].toUpperCase() : 'R';
}

function setActiveRoute(polyline, routeData, allRoutesData) {
    // Reset all polylines to default style
    routesPageLayers.forEach(layer => {
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
    // Use known-on-land anchors around Lisbon (borrowed from live-map land positions)
    const landAnchors = [
        { lat: 38.7223, lng: -9.1393 }, // Alfama
        { lat: 38.7071, lng: -9.1357 }, // Bairro Alto
        { lat: 38.7436, lng: -9.1602 }, // Benfica
        { lat: 38.7169, lng: -9.1395 }, // Chiado
        { lat: 38.7436, lng: -9.1301 }, // Campo Grande
        { lat: 38.7267, lng: -9.1545 }, // Estrela
        { lat: 38.7614, lng: -9.1477 }, // Lumiar
        { lat: 38.7344, lng: -9.1394 }, // Marquês de Pombal
        { lat: 38.7505, lng: -9.1849 }, // Restelo
        { lat: 38.7436, lng: -9.1548 }, // Avenidas Novas
        { lat: 38.7578, lng: -9.1639 }, // Alvalade Norte
        { lat: 38.7393, lng: -9.1376 }, // Saldanha
        { lat: 38.7267, lng: -9.1447 }, // Santos
        { lat: 38.7169, lng: -9.1282 }, // Cais do Sodré
        { lat: 38.7267, lng: -9.1647 }, // Campo de Ourique
        { lat: 38.7505, lng: -9.1477 }, // Olivais
        { lat: 38.7344, lng: -9.1647 }, // Lapa
        { lat: 38.7578, lng: -9.1376 }, // Areeiro
        { lat: 38.7223, lng: -9.1647 }, // Madragoa
        { lat: 38.7436, lng: -9.1376 }, // Arroios
        { lat: 38.7071, lng: -9.1647 }, // Príncipe Real
        { lat: 38.7614, lng: -9.1602 }, // Carnide
        { lat: 38.7267, lng: -9.1376 }, // Rato
        { lat: 38.7505, lng: -9.1647 }  // Marvila
    ];
    const shapes = ['diamond', 'rectangle', 'triangle', 'circle', 'hexagon'];

    // Mix routes: distribute them round-robin across anchors regardless of risk
    allRoutesData.forEach((routeInfo, i) => {
        if (!routeInfo) return;

        const cluster = landAnchors[i % landAnchors.length];
        const path = [];
        const shape = shapes[i % shapes.length];

        // Add some randomness to avoid overlapping
        // Keep jitter small so we remain on land near anchor
        const centerLat = cluster.lat + (Math.random() - 0.5) * 0.006;
        const centerLng = cluster.lng + (Math.random() - 0.5) * 0.006;
        const latRadius = 0.002 + Math.random() * 0.004;
        const lngRadius = 0.002 + Math.random() * 0.004;

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

        // Color stays based on risk
        let color;
        if (routeInfo.risk === 'High') {
            color = '#DC3545';
        } else if (routeInfo.risk === 'Med') {
            color = '#FFC107';
        } else {
            color = '#28A745';
        }

        routes.push({
            ...routeInfo,
            path,
            color
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