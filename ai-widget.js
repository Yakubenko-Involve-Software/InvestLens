console.log('🚀 AI Widget loading...');

// State
let allRoutes = [];
let filteredRoutes = [];
let stopsData = {};
let currentSort = { key: 'id', asc: true };
let isOptimized = false; // when true, show 3 routes instead of 9
let lastAIBounds = null; // track bounds of last non-optimized render
let lastAIKeyPoints = []; // sample of points used by the 24-route layout


// DOM Elements
let map;
let routeList, timelineList;
let routeLayers = [];

// Make map available globally
window.aiMap = null;

async function initAI() {
    console.log('=== Initializing AI Widget ===');
    console.log('🔍 AI Widget DOM elements:', {
        routeList: !!routeList,
        timelineList: !!timelineList,
        map: !!map
    });
    
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

    // Add routes to the map (match the "Routes" tab appearance)
    setTimeout(() => {
        if (allRoutesData && allRoutesData.length > 0) {
            console.log('🛣️ Adding routes (Routes-tab style) to AI map...');
            drawRoutesLikeRoutesTabOnAI();
        } else {
            console.warn('⚠️ No routes data available for AI map');
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

async function addRoutesToAIMap() {
    // Clear existing layers
    routeLayers.forEach(layer => {
        map.removeLayer(layer.polyline);
        layer.markers.forEach(marker => map.removeLayer(marker));
    });
    routeLayers = [];

    // Helper to clamp to safe land bounds further from sea
    function clampToLand(lat, lng) {
        const minLat = 38.715, maxLat = 38.790;
        const minLng = -9.250, maxLng = -9.155; // west of river
        let clampedLat = Math.min(Math.max(lat, minLat), maxLat);
        let clampedLng = Math.min(Math.max(lng, minLng), maxLng - 0.002);
        return [clampedLat, clampedLng];
    }

    function clampToArea(lat, lng, bounds, pad = 0.002) {
        if (!bounds) return [lat, lng];
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const minLat = sw.lat + pad;
        const maxLat = ne.lat - pad;
        const minLng = sw.lng + pad;
        const maxLng = ne.lng - pad;
        const cLat = Math.min(Math.max(lat, minLat), maxLat);
        const cLng = Math.min(Math.max(lng, minLng), maxLng);
        return [cLat, cLng];
    }

    // Clamp to a rectangular region described by {minLat, maxLat, minLng, maxLng}
    function clampToRect(lat, lng, rect, padLat = 0.002, padLng = 0.002) {
        if (!rect) return [lat, lng];
        const minLat = rect.minLat + padLat;
        const maxLat = rect.maxLat - padLat;
        const minLng = rect.minLng + padLng;
        const maxLng = rect.maxLng - padLng;
        const cLat = Math.min(Math.max(lat, minLat), maxLat);
        const cLng = Math.min(Math.max(lng, minLng), maxLng);
        return [cLat, cLng];
    }

    // From a Leaflet bounds, build 4 quadrant rectangles (NW, NE, SW, SE)
    function quadrantsFromBounds(bounds, padRel = 0.06) {
        if (!bounds) return null;
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const latSpan = ne.lat - sw.lat;
        const lngSpan = ne.lng - sw.lng;
        const latPad = latSpan * padRel;
        const lngPad = lngSpan * padRel;
        const latMid = (ne.lat + sw.lat) / 2;
        const lngMid = (ne.lng + sw.lng) / 2;
        // Return 4 rectangles covering area minus padding
        return [
            // NW
            { minLat: latMid + latPad, maxLat: ne.lat - latPad, minLng: sw.lng + lngPad, maxLng: lngMid - lngPad },
            // NE
            { minLat: latMid + latPad, maxLat: ne.lat - latPad, minLng: lngMid + lngPad, maxLng: ne.lng - lngPad },
            // SW
            { minLat: sw.lat + latPad, maxLat: latMid - latPad, minLng: sw.lng + lngPad, maxLng: lngMid - lngPad },
            // SE
            { minLat: sw.lat + latPad, maxLat: latMid - latPad, minLng: lngMid + lngPad, maxLng: ne.lng - lngPad }
        ];
    }

    function rectCenter(rect) {
        return [ (rect.minLat + rect.maxLat) / 2, (rect.minLng + rect.maxLng) / 2 ];
    }

    function rectSpans(rect) {
        return [ rect.maxLat - rect.minLat, rect.maxLng - rect.minLng ];
    }

    // If we are in optimized mode and we previously drew 24 routes, reuse those
    // points so the 4 routes pass through the same places and cover the same area.
    if (isOptimized && lastAIBounds && Array.isArray(lastAIKeyPoints) && lastAIKeyPoints.length > 0) {
        const rects = quadrantsFromBounds(lastAIBounds, -0.12); // expand area ~12% for larger routes
        const colors = ['#2563eb', '#2563eb', '#2563eb', '#2563eb']; // All routes in blue
        const ids = ['A', 'B', 'C', 'D'];

        function pointInRect([lat, lng], r) {
            return lat >= r.minLat && lat <= r.maxLat && lng >= r.minLng && lng <= r.maxLng;
        }

        function fitBoundsIfShrunk(path, rect, scaleCap = 1.35) {
            // If snapped path shrank too much, nudge points outward linearly toward rect edges
            let latMin = Infinity, latMax = -Infinity, lngMin = Infinity, lngMax = -Infinity;
            path.forEach(([la,ln]) => { latMin = Math.min(latMin, la); latMax = Math.max(latMax, la); lngMin = Math.min(lngMin, ln); lngMax = Math.max(lngMax, ln); });
            const latSpan = latMax - latMin; const lngSpan = lngMax - lngMin;
              const targetLatSpan = (rect.maxLat - rect.minLat) * 0.995; // fill ~99.5% of quadrant for very large routes
              const targetLngSpan = (rect.maxLng - rect.minLng) * 0.995;
            const sLat = targetLatSpan / Math.max(1e-9, latSpan);
            const sLng = targetLngSpan / Math.max(1e-9, lngSpan);
            const scale = Math.min(scaleCap, Math.max(1.0, Math.min(sLat, sLng))); // expand up to cap
            if (scale <= 1.001) return path;
            const cLat = (rect.minLat + rect.maxLat) / 2;
            const cLng = (rect.minLng + rect.maxLng) / 2;
            return path.map(([la,ln]) => [ cLat + (la - cLat) * scale, cLng + (ln - cLng) * scale ]);
        }

        function shiftPathTowards(path, fromCenter, toCenter, meters) {
            if (meters <= 0) return path;
            const dLat = toCenter[0] - fromCenter[0];
            const dLng = toCenter[1] - fromCenter[1];
            const latMeters = dLat * 111320;
            const lngMeters = dLng * 111320 * Math.cos(toRad((fromCenter[0]+toCenter[0])/2));
            const len = Math.sqrt(latMeters*latMeters + lngMeters*lngMeters) || 1e-6;
            const unitLat = (dLat/len) * meters / 111320;
            const unitLng = (dLng/len) * meters / (111320 * Math.cos(toRad((fromCenter[0]+toCenter[0])/2)));
            return path.map(([la,ln]) => [la + unitLat, ln + unitLng]);
        }

        for (let idx = 0; idx < rects.length; idx++) {
            const r = rects[idx];
            // Use previously visited points inside rect to shape the perimeter
            const pts = lastAIKeyPoints.filter(p => p[0] >= r.minLat && p[0] <= r.maxLat && p[1] >= r.minLng && p[1] <= r.maxLng);
            // Tweak A/B for longer routes and closeness to center
            const isAB = idx === 0 || idx === 1;
            const options = isAB ? { insetMinM: 2, insetMaxM: 6, stepMinM: 60, stepMaxM: 120, varianceMin: 0.3, varianceMax: 0.6 } : { insetMinM: 3, insetMaxM: 8 };
            let ring = buildPerimeterPoints(r, pts, options);
            ring = await osrmSnapLoop(ring);
            // Keep snapped path inside the same quadrant area (with small padding)
            ring = clampPathToRectMeters(ring, r, 2);
            // Expand slightly more for A/B to lengthen perimeter
            ring = fitBoundsIfShrunk(ring, r, isAB ? 1.45 : 1.35);
            // Move A/B slightly toward the global center to be closer to others
            if (isAB && lastAIBounds) {
                const allCenter = [(lastAIBounds.getSouthWest().lat + lastAIBounds.getNorthEast().lat)/2, (lastAIBounds.getSouthWest().lng + lastAIBounds.getNorthEast().lng)/2];
                const rectCenterPt = [(r.minLat + r.maxLat)/2, (r.minLng + r.maxLng)/2];
                ring = shiftPathTowards(ring, rectCenterPt, allCenter, 45); // shift ~45m toward center
                ring = clampPathToRectMeters(ring, r, 10);
            }
            const smooth = smoothClosedPathChaikin(ring, 1);
            const finalPath = ensureClosedPath(smooth);

            const color = colors[idx % colors.length];
            const polyline = L.polyline(finalPath, { color, weight: 5, opacity: 0, lineJoin: 'round', lineCap: 'round' }).addTo(map);
            setTimeout(() => polyline.setStyle({ opacity: 0.95 }), 60);
            const startLatLng = L.latLng(finalPath[0][0], finalPath[0][1]);
            const idIconHtml = `
                <div style=\"display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#fff;border:2px solid #2563eb;\">\n                    <div style=\"color:#2563eb;font-weight:700;font-size:12px;\">${ids[idx]}</div>\n                </div>`;
            const idIcon = L.divIcon({ html: idIconHtml, className: '', iconSize: [24,24], iconAnchor: [12,12] });
            const idMarker = L.marker(startLatLng, { icon: idIcon }).addTo(map);

            const markers = [idMarker];
            let accum = 0; let lastPt = finalPath[0];
            for (let vi = 1; vi < finalPath.length; vi++) {
                const pt = finalPath[vi];
                accum += haversineMeters(lastPt, pt);
                if (accum >= 150) {
                    // Removed old square markers - now using new round markers
                    accum = 0;
                }
                lastPt = pt;
            }

            routeLayers.push({ polyline, markers, id: ids[idx], district: '', color });

            // Expose GeoJSON
            window.optimizedGeoJSON = window.optimizedGeoJSON || {};
            window.optimizedGeoJSON[ids[idx]] = {
                type: 'Feature',
                properties: { id: ids[idx], color },
                geometry: { type: 'LineString', coordinates: finalPath.map(([la,ln])=>[ln,la]) }
            };
        }

        // Preserve the same overall map area as before optimization
        if (routeLayers.length > 0 && lastAIBounds) {
            map.fitBounds(lastAIBounds, { padding: [20, 20] });
        }
        setTimeout(() => map.invalidateSize(), 100);
        return; // optimized rendering complete
    }

    // Inland anchors (used for 24-route layout)
    const landAnchors = [
        [38.725, -9.210], [38.735, -9.205], [38.745, -9.198], [38.740, -9.192],
        [38.725, -9.190], [38.735, -9.185], [38.745, -9.180], [38.750, -9.175],
        [38.740, -9.170], [38.735, -9.168], [38.745, -9.165], [38.750, -9.162],
        [38.760, -9.190], [38.760, -9.175], [38.755, -9.165], [38.755, -9.180],
        [38.720, -9.190], [38.725, -9.184], [38.730, -9.178], [38.735, -9.172],
        [38.755, -9.205], [38.750, -9.200], [38.745, -9.195], [38.740, -9.188]
    ];

    // Pick candidate routes with real stops
    const pool = allRoutes.filter(route => Array.isArray(stopsDataAll[route.id]) && stopsDataAll[route.id].length >= 2);
    const desiredCount = isOptimized ? 4 : 24;
    // When optimized, prefer the "major" routes by highest number of stops, then by distance (km)
    const optimizedPool = isOptimized
        ? [...pool].sort((a, b) => {
            const stopsA = typeof a.stops === 'number' ? a.stops : 0;
            const stopsB = typeof b.stops === 'number' ? b.stops : 0;
            if (stopsB !== stopsA) return stopsB - stopsA;
            const kmA = typeof a.km === 'number' ? a.km : 0;
            const kmB = typeof b.km === 'number' ? b.km : 0;
            return kmB - kmA;
        })
        : pool;
    const candidates = optimizedPool.slice(0, Math.min(optimizedPool.length, desiredCount));

    const colorForRisk = (risk) => risk === 'High' ? '#DC3545' : risk === 'Med' ? '#FFC107' : '#28A745';

    // Build quadrant rectangles to maintain original coverage area when optimized
    const quadrantRects = (isOptimized && lastAIBounds) ? quadrantsFromBounds(lastAIBounds, 0.06) : null;
    const anchorIndices = Array.from({length: 24}, (_, i) => i);
    // Collect a sample of points used when drawing the full (non-optimized) layout
    const sampledPoints = [];

    for (let i = 0; i < candidates.length; i++) {
        const routeInfo = candidates[i];
        const stops = stopsDataAll[routeInfo.id];
        let orig = stops.map(s => [s.lat, s.lon]);
        const centroid = orig.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]).map(v => v / orig.length);

        // Choose placement and scale
        let target, scale;
        let rectForClamp = null;
        if (isOptimized && quadrantRects && quadrantRects.length === 4) {
            const rect = quadrantRects[i % 4];
            rectForClamp = rect;
            const [rectLatSpan, rectLngSpan] = rectSpans(rect);
            const origLatMin = Math.min(...orig.map(p => p[0]));
            const origLatMax = Math.max(...orig.map(p => p[0]));
            const origLngMin = Math.min(...orig.map(p => p[1]));
            const origLngMax = Math.max(...orig.map(p => p[1]));
            const origLatSpan = Math.max(1e-6, origLatMax - origLatMin);
            const origLngSpan = Math.max(1e-6, origLngMax - origLngMin);
            const targetLatSpan = rectLatSpan * 0.85; // fill ~85% of quadrant
            const targetLngSpan = rectLngSpan * 0.85;
            const sLat = targetLatSpan / origLatSpan;
            const sLng = targetLngSpan / origLngSpan;
            scale = Math.max(0.25, Math.min(1.5, Math.min(sLat, sLng)));
            const c = rectCenter(rect);
            // Use deterministic jitter based on route index for consistent results
            const jitterLat = (Math.sin(i * 0.5) * 0.5) * rectLatSpan * 0.04;
            const jitterLng = (Math.cos(i * 0.7) * 0.5) * rectLngSpan * 0.04;
            target = [c[0] + jitterLat, c[1] + jitterLng];
        } else {
            const anchor = landAnchors[anchorIndices[i % anchorIndices.length]];
            // Use deterministic jitter based on route index for consistent results
            const jitterLat = (Math.sin(i * 0.3) * 0.5) * 0.004;
            const jitterLng = (Math.cos(i * 0.6) * 0.5) * 0.004;
            target = [anchor[0] + jitterLat, anchor[1] + jitterLng];
            scale = 0.18;
        }
        let path = orig.map(([lat, lng]) => {
            const scaledLat = (lat - centroid[0]) * scale;
            const scaledLng = (lng - centroid[1]) * scale;
            let p = clampToLand(target[0] + scaledLat, target[1] + scaledLng);
            if (isOptimized && rectForClamp) {
                p = clampToRect(p[0], p[1], rectForClamp, 0.003, 0.003);
            } else if (isOptimized && lastAIBounds) {
                p = clampToArea(p[0], p[1], lastAIBounds, 0.003);
            }
            return p;
        });
        // Inland shift if needed
        const maxLngPath = Math.max(...path.map(p => p[1]));
        const minLatPath = Math.min(...path.map(p => p[0]));
        const eastThreshold = -9.157;
        const southThreshold = 38.720;
        let shiftLng = 0, shiftLat = 0;
        if (maxLngPath > eastThreshold) shiftLng = eastThreshold - maxLngPath - 0.003;
        if (minLatPath < southThreshold) shiftLat = southThreshold - minLatPath + 0.003;
        if (shiftLng !== 0 || shiftLat !== 0) {
            path = path.map(([lat, lng]) => {
                let p = clampToLand(lat + shiftLat, lng + shiftLng);
                if (isOptimized && rectForClamp) p = clampToRect(p[0], p[1], rectForClamp, 0.003, 0.003);
                else if (isOptimized && lastAIBounds) p = clampToArea(p[0], p[1], lastAIBounds, 0.003);
                return p;
            });
        }
        // Close loop
        if (path.length > 1) {
            const [s0, s1] = path[0];
            const [e0, e1] = path[path.length - 1];
            if (Math.abs(s0 - e0) > 1e-9 || Math.abs(s1 - e1) > 1e-9) path.push([s0, s1]);
        }

        const color = colorForRisk(routeInfo.risk);
        const polyline = L.polyline(path, { color, weight: 4, opacity: 0.9 }).addTo(map);

        const startLatLng = L.latLng(path[0][0], path[0][1]);
        const idIconHtml = `
            <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#2563eb;border:2px solid #1d4ed8;box-shadow:0 0 0 2px #ffffff;">
                <div style="color:#ffffff;font-weight:700;font-size:12px;line-height:1;">${routeInfo.id}</div>
            </div>`;
        const idIcon = L.divIcon({ html: idIconHtml, className: '', iconSize: [28,28], iconAnchor: [14,14] });
        const idMarker = L.marker(startLatLng, { icon: idIcon }).addTo(map);

        const vertices = (path.length > 1 && path[0][0] === path[path.length - 1][0] && path[0][1] === path[path.length - 1][1]) ? path.slice(0, -1) : path;
        const markers = [idMarker];
        const step = isOptimized ? Math.ceil(vertices.length / 8) : 1; // fewer dots when optimized
        for (let vi = 0; vi < vertices.length; vi += step) {
            const pt = vertices[vi];
            // Removed old square markers - now using new round markers
        }

        // When not optimized, sample some points so the later 4 routes can pass through them
        if (!isOptimized) {
            const keyStep = Math.max(1, Math.floor(path.length / 20));
            for (let k = 0; k < path.length; k += keyStep) {
                sampledPoints.push(path[k]);
            }
        }

        polyline.on('click', () => setFocus(routeInfo.id));
        routeLayers.push({ polyline, markers, id: routeInfo.id, district: '', color });
    }

    // Fit bounds: for optimized, preserve original coverage; otherwise compute and save
    if (routeLayers.length > 0) {
        const group = L.featureGroup(routeLayers.map(l => l.polyline));
        const gb = group.getBounds();
        if (!isOptimized) {
            lastAIBounds = gb; // remember area of 24 routes
            lastAIKeyPoints = sampledPoints; // remember points that routes passed through
            map.fitBounds(gb, { padding: [20, 20] });
        } else if (lastAIBounds) {
            map.fitBounds(lastAIBounds, { padding: [20, 20] });
        } else {
            map.fitBounds(gb, { padding: [20, 20] });
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

// Ensure we display a single-letter route label consistently
function getRouteLetter(id) {
    const lettersOnly = String(id).match(/[A-Za-z]/g);
    return lettersOnly && lettersOnly.length > 0 ? lettersOnly[0].toUpperCase() : 'R';
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
    console.log(`🎯 Setting focus to route ${routeId}`);
    
    // Highlight route on map
    highlightRouteOnMap(routeId);

    // Only render timeline if it's not already being rendered for this route
    if (!window.currentTimelineRoute || window.currentTimelineRoute !== routeId) {
        console.log(`📋 Rendering timeline for route: ${routeId}`);
        const route = { name: routeId, id: routeId };
        renderTimelineItems(route);
        window.currentTimelineRoute = routeId;
    } else {
        console.log(`⏭️ Timeline already rendered for route: ${routeId}`);
    }
    
    console.log(`✅ Focus set to route ${routeId}`);
}

function highlightRouteOnMap(routeId) {
    console.log(`🎯 Highlighting route: ${routeId}`);
    console.log(`📊 Available route layers:`, routeLayers.map(l => l.id));
    
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
        console.log(`✅ Found route layer for ${routeId}`);
        selectedLayer.polyline.setStyle({ weight: 6, opacity: 1 });
        selectedLayer.markers.forEach(marker => {
            marker.setStyle({ opacity: 1 });
        });
        
        // Center map on the selected route
        const bounds = selectedLayer.polyline.getBounds();
        map.fitBounds(bounds, { padding: [20, 20] });
        console.log(`🗺️ Map centered on route ${routeId}`);
    } else {
        console.warn(`❌ Route layer not found for ${routeId}`);
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
        
        const yesterdayBtn = document.getElementById('toggle-yesterday');
        const todayBtn = document.getElementById('toggle-today');
        const optimizeBtn = document.getElementById('optimize-btn');

        if (!yesterdayBtn || !todayBtn || !optimizeBtn) {
            console.log('Some elements not found:', {
                yesterdayBtn: !!yesterdayBtn,
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
        console.log('Found elements:', { yesterdayBtn: yesterdayBtn.textContent, todayBtn: todayBtn.textContent, optimizeBtn: optimizeBtn.textContent });
        
        // Remove any existing event listeners
        const newYesterdayBtn = yesterdayBtn.cloneNode(true);
        const newTodayBtn = todayBtn.cloneNode(true);
        yesterdayBtn.parentNode.replaceChild(newYesterdayBtn, yesterdayBtn);
        todayBtn.parentNode.replaceChild(newTodayBtn, todayBtn);
        setupToggleFunctionality(newYesterdayBtn, newTodayBtn, optimizeBtn);
    }
    
    tryInit();
}

function setupToggleFunctionality(yesterdayBtn, todayBtn, optimizeBtn) {
    console.log('=== Setting up toggle functionality ===');
    
    // Track current toggle state
    let currentToggleState = 'yesterday'; // 'yesterday' or 'today'

    // Data for Yesterday (default)
    const yesterdayData = {
        'routes-optimised': '15 %',
        'stops-merged': '7',
        'calls-scheduled': '2',
        'time-saved': '42 min',
        'success-rate': '+7.2 %',
        'spoilage-risk': '-0.8 %',
        'efficiency-gain': '15 %',
        'cost-reduction': '€2,340'
    };

    // Data for Today (alternate)
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
        // We always keep Optimize inactive by default and only enable when user decides
            optimizeBtn.className = 'w-full py-3 px-4 bg-gray-300 text-gray-600 font-semibold rounded-lg cursor-not-allowed';
            optimizeBtn.style.opacity = '1';
            optimizeBtn.disabled = true;
            optimizeBtn.textContent = 'Optimize';
            optimizeBtn.style.animation = 'none';
            optimizeBtn.style.boxShadow = 'none';
            optimizeBtn.classList.remove('animate-pulse', 'shadow-lg');
    }

    // Event listeners
    console.log('🔗 Attaching event listeners...');
    
    yesterdayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🟨 Yesterday selected');
        updateToggleState(yesterdayBtn, todayBtn);
        updateOptimizationData(yesterdayData);
        updateOptimizeButton(true); // keep disabled
        currentToggleState = 'yesterday';
        
        // Reset statistics cards to original values
        updateStatisticsCards(false);
        
        console.log('✅ Optimize button remains disabled');
    });

    todayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🟦 Today selected');
        updateToggleState(todayBtn, yesterdayBtn);
        updateOptimizationData(todayData);
        // Enable Optimize when user selects Today
        optimizeBtn.className = 'w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors';
        optimizeBtn.disabled = false;
        optimizeBtn.textContent = 'Optimize';
        currentToggleState = 'today';
        
        // Reset statistics cards to original values
        updateStatisticsCards(false);
        
        console.log('✅ Optimize button enabled');
    });

    console.log('✅ Event listeners attached successfully');

    // Initialize with Yesterday selected by default; keep optimize disabled
    console.log('Initializing with Yesterday data and disabled Optimize button...');
    updateToggleState(yesterdayBtn, todayBtn);
    updateOptimizationData(yesterdayData);
    updateOptimizeButton(true); // disabled
    
    // Initialize statistics cards with original values
    // Add delay to ensure DOM is ready
    setTimeout(() => {
        console.log('⏰ Delayed initialization of statistics cards...');
        updateStatisticsCards(false);
    }, 1000);
    
    console.log('Initial state set to Yesterday');
    
    // Add click handler for optimize button
    optimizeBtn.addEventListener('click', () => {
        if (optimizeBtn.disabled) {
            console.log('Optimize button is disabled (Tomorrow selected)');
            return;
        }
        console.log('Optimize button clicked');
        
        // Create a simple loading popup overlay
        const overlay = document.createElement('div');
        overlay.id = 'optimize-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.12);display:flex;align-items:center;justify-content:center;z-index:2000;';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
                <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                <p class="text-sm font-medium text-gray-700">Optimizing routes...</p>
            </div>`;
        document.body.appendChild(overlay);
        
        // Show feedback on button
        const originalText = optimizeBtn.textContent;
        optimizeBtn.textContent = 'Optimizing...';
        optimizeBtn.disabled = true;
        optimizeBtn.className = 'w-full py-3 px-4 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed transition-colors';
        
        // Start optimization: cluster 24 routes into 4 (A,B,C,D) and delay final reveal 5–10s
        (async () => {
            try {
                console.log('🚀 Starting optimization process...');
                isOptimized = true;
                
                                        // Update statistics cards with optimized values
                        // Note: Some values become smaller (better), others become larger (better)
                        console.log('🔄 Calling updateStatisticsCards(true)...');
                        console.log('🔍 Current DOM state:', {
                            body: !!document.body,
                            statsContainer: !!document.querySelector('.grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-6.gap-4.mb-6'),
                            kpiCards: document.querySelectorAll('.kpi-card').length
                        });
                        updateStatisticsCards(true);
                        console.log('✅ updateStatisticsCards(true) completed');
                
                // Ensure we have data to work with
                if (!allRoutesData || allRoutesData.length === 0) {
                    console.warn('⚠️ No route data available, using fallback routes');
                    const fallbackRoutes = [
                        { name: 'A', color: '#DC3545', coords: createStretchedPentagon(38.750, -9.22, 0.008, 0.012, 0) },
                        { name: 'B', color: '#DC3545', coords: createStretchedPentagon(38.765, -9.12, 0.008, 0.012, 1) },
                        { name: 'C', color: '#DC3545', coords: createStretchedPentagon(38.735, -9.25, 0.008, 0.012, 2) },
                        { name: 'D', color: '#DC3545', coords: createStretchedPentagon(38.720, -9.15, 0.008, 0.012, 3) }
                    ];
                    renderOptimizedRoutesOnAI(fallbackRoutes);
                    return;
                }
                
                const computePromise = computeAndSnapOptimizedRoutes();
                let computedResult = null;
                let computeError = null;
                let finishedEarly = false;
                const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ status: 'timeout' }), 5000));
                const first = await Promise.race([
                    computePromise.then(res => ({ status: 'done', res })).catch(err => ({ status: 'error', err })),
                    timeoutPromise
                ]);

                // Close the overlay at or before 5s
                const ovEarly = document.getElementById('optimize-overlay');
                if (ovEarly && ovEarly.parentNode) ovEarly.parentNode.removeChild(ovEarly);

                if (first.status === 'done') {
                    finishedEarly = true;
                    computedResult = first.res;
                    renderOptimizedRoutesOnAI(computedResult);
                } else if (first.status === 'error') {
                    computeError = first.err;
                }

                // If timed out, continue computing in background and render when ready
                function rectsFromBounds(bounds) {
                    if (!bounds) return null;
                    const sw = bounds.getSouthWest ? bounds.getSouthWest() : { lat: bounds.minLat, lng: bounds.minLng };
                    const ne = bounds.getNorthEast ? bounds.getNorthEast() : { lat: bounds.maxLat, lng: bounds.maxLng };
                    const latMid = (ne.lat + sw.lat) / 2;
                    const lngMid = (ne.lng + sw.lng) / 2;
                    return [
                        { minLat: latMid, maxLat: ne.lat, minLng: sw.lng, maxLng: lngMid },
                        { minLat: latMid, maxLat: ne.lat, minLng: lngMid, maxLng: ne.lng },
                        { minLat: sw.lat, maxLat: latMid, minLng: sw.lng, maxLng: lngMid },
                        { minLat: sw.lat, maxLat: latMid, minLng: lngMid, maxLng: ne.lng }
                    ];
                }
                function loopFromRect(rect) {
                    if (!rect) return [];
                    const cy = (rect.minLat + rect.maxLat) / 2;
                    const cx = (rect.minLng + rect.maxLng) / 2;
                    const latSpan = (rect.maxLat - rect.minLat) * 0.35;
                    const lngSpan = (rect.maxLng - rect.minLng) * 0.35;
                    const top = cy + latSpan;
                    const bottom = cy - latSpan;
                    const left = cx - lngSpan;
                    const right = cx + lngSpan;
                    return [
                        [top, left], [top, right], [bottom, right], [bottom, left], [top, left]
                    ];
                }
                // Immediate local fallback (no network): balanced quadrant loops from existing points
                function buildImmediateFallbackRoutes() {
                    const names = ['A','B','C','D'];
                    const rects = lastAIBounds ? rectsFromBounds(lastAIBounds) : null;

                    // Helpers
                    function convexHull(pts){
                        if (!pts || pts.length <= 3) return pts ? pts.slice() : [];
                        const arr = pts.map(([la,ln])=>({x:ln,y:la,ll:[la,ln]})).sort((a,b)=> a.x===b.x? a.y-b.y : a.x-b.x);
                        const cross=(o,a,b)=> (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
                        const lower=[]; for(const p of arr){ while(lower.length>=2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop(); lower.push(p);} 
                        const upper=[]; for(let i=arr.length-1;i>=0;i--){ const p=arr[i]; while(upper.length>=2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop(); upper.push(p);} 
                        const h=lower.concat(upper.slice(1,-1));
                        return h.map(p=>p.ll);
                    }
                    function pointsInRectAll(rect){
                        if (!rect) return [];
                        const pts = [];
                        allRoutesData.slice(0,24).forEach(r=>{
                            const stops = (stopsDataAll[r.id]||[]).map(s=>[s.lat,s.lon]);
                            stops.forEach(([la,ln])=>{ if(la>=rect.minLat&&la<=rect.maxLat&&ln>=rect.minLng&&ln<=rect.maxLng) pts.push([la,ln]); });
                        });
                        return pts;
                    }
                    function densifyLoop(loopPts){
                        if (!loopPts || loopPts.length < 2) return loopPts||[];
                        const out=[]; const pts=loopPts.slice(); if(pts[0][0]!==pts[pts.length-1][0]||pts[0][1]!==pts[pts.length-1][1]) pts.push(pts[0]);
                        for(let i=0;i<pts.length-1;i++){
                            const a=pts[i], b=pts[i+1];
                            out.push(a);
                            const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
                            // Use deterministic offset based on point index for consistent results
                            const offLat=(b[1]-a[1])*0.12*(Math.sin(i * 0.7) * 0.5)*0.002;
                            const offLng=-(b[0]-a[0])*0.12*(Math.cos(i * 0.5) * 0.5)*0.002;
                            out.push([mid[0]+offLat, mid[1]+offLng]);
                        }
                        out.push(out[0]);
                        return out;
                    }
                    function clampPathToRectLocal(path, rect){
                        if (!rect || !path) return path||[];
                        return path.map(([la,ln])=>[
                            Math.min(Math.max(la, rect.minLat), rect.maxLat),
                            Math.min(Math.max(ln, rect.minLng), rect.maxLng)
                        ]);
                    }

                    const results=[];
                    if (rects) {
                        for(let i=0;i<4;i++){
                            const rect = rects[i];
                            let pts = pointsInRectAll(rect);
                            // If too few points, synthesize a small cluster inside the rect
                            if (pts.length < 6){
                                for(let k=0;k<6-pts.length;k++){
                                    // Use deterministic positioning for consistent results
                                    const la = rect.minLat + (rect.maxLat-rect.minLat)*(0.2+0.6*(k/(6-pts.length)));
                                    const ln = rect.minLng + (rect.maxLng-rect.minLng)*(0.2+0.6*((k+0.5)/(6-pts.length)));
                                    pts.push([la,ln]);
                                }
                            }
                            let hull = convexHull(pts);
                            if (!hull || hull.length < 3) {
                                // make a simple rounded rectangle within rect
                                hull = [
                                    [ (rect.minLat*0.6+rect.maxLat*0.4), (rect.minLng*0.6+rect.maxLng*0.4) ],
                                    [ (rect.minLat*0.6+rect.maxLat*0.4), (rect.minLng*0.4+rect.maxLng*0.6) ],
                                    [ (rect.minLat*0.4+rect.maxLat*0.6), (rect.minLng*0.4+rect.maxLng*0.6) ],
                                    [ (rect.minLat*0.4+rect.maxLat*0.6), (rect.minLng*0.6+rect.maxLng*0.4) ]
                                ];
                            }
                            let loop = densifyLoop(hull);
                            loop = clampPathToRectLocal(loop, rect);
                            results.push({ name: names[i], color:'#DC3545', coords: loop });
                        }
                        return results;
                    }

                    // No bounds: build four tiles around current view center
                    const centerLat = 38.736946, centerLng = -9.142685;
                    const spanLat = 0.02, spanLng = 0.03;
                    const tiles = [
                        { minLat: centerLat, maxLat: centerLat+spanLat/2, minLng: centerLng-spanLng/2, maxLng: centerLng },
                        { minLat: centerLat, maxLat: centerLat+spanLat/2, minLng: centerLng, maxLng: centerLng+spanLng/2 },
                        { minLat: centerLat-spanLat/2, maxLat: centerLat, minLng: centerLng-spanLng/2, maxLng: centerLng },
                        { minLat: centerLat-spanLat/2, maxLat: centerLat, minLng: centerLng, maxLng: centerLng+spanLng/2 }
                    ];
                    for(let i=0;i<4;i++){
                        const rect=tiles[i];
                        const centerRectLat = (rect.minLat + rect.maxLat) / 2;
                        const centerRectLng = (rect.minLng + rect.maxLng) / 2;
                        const rectLatSpan = rect.maxLat - rect.minLat;
                        const rectLngSpan = rect.maxLng - rect.minLng;
                        
                        // Create different pentagon shapes for each tile
                        const loop = createStretchedPentagon(centerRectLat, centerRectLng, rectLatSpan * 0.8, rectLngSpan * 0.8, i);
                        results.push({name:names[i], color:'#DC3545', coords: loop});
                    }
                    return results;
                }

                async function buildFallbackRoutes() {
                    const names = ['A','B','C','D'];
                    const rects = lastAIBounds ? rectsFromBounds(lastAIBounds) : null;

                    // Helpers
                    function toRad(deg){ return deg * Math.PI / 180; }
                    function clampPathToRect(path, rect, padMeters = 8) {
                        if (!rect || !path) return path;
                        const metersToLat = (m) => m / 111320;
                        const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
                        const midLat = (rect.minLat + rect.maxLat) / 2;
                        const padLat = metersToLat(padMeters);
                        const padLng = metersToLng(padMeters, midLat);
                        const minLat = rect.minLat + padLat, maxLat = rect.maxLat - padLat;
                        const minLng = rect.minLng + padLng, maxLng = rect.maxLng - padLng;
                        return path.map(([la,ln])=>[
                            Math.min(Math.max(la, minLat), maxLat),
                            Math.min(Math.max(ln, minLng), maxLng)
                        ]);
                    }
                    function orderAsLoop(pts){
                        if (!pts || pts.length < 2) return pts || [];
                        const c = pts.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]).map(v=>v/pts.length);
                        const withAng = pts.map(p=>({p, a: Math.atan2(p[0]-c[0], p[1]-c[1])}));
                        withAng.sort((u,v)=> u.a - v.a);
                        const ring = withAng.map(o=>o.p);
                        ring.push(ring[0]);
                        return ring;
                    }
                    async function osrmRouteLoopFromWaypoints(waypoints){
                        if (!waypoints || waypoints.length < 2) return waypoints || [];
                        const joined = [];
                        for (let i=0;i<waypoints.length-1;i++){
                            const a = waypoints[i];
                            const b = waypoints[i+1];
                            const coordStr = `${a[1].toFixed(6)},${a[0].toFixed(6)};${b[1].toFixed(6)},${b[0].toFixed(6)}`;
                            const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&continue_straight=true&alternatives=false`;
                            try {
                                const res = await fetch(url);
                                const json = await res.json();
                                const coords = json?.routes?.[0]?.geometry?.coordinates || [];
                                coords.forEach(([lng,lat], idx)=>{
                                    // avoid duplicating joints
                                    if (joined.length === 0 || idx > 0) joined.push([lat,lng]);
                                });
                            } catch(e){
                                // fallback to straight segment
                                joined.push(a, b);
                            }
                        }
                        // ensure closed
                        if (joined.length > 1) joined.push(joined[0]);
                        return joined;
                    }
                    function randomWaypointsInRect(rect, count){
                        const out=[]; if (!rect) return out;
                        for (let i=0;i<count;i++){
                            // Use deterministic values based on index for consistent results
                            const tLat = (0.15 + 0.7 * (i / count)); // Distribute evenly 15%-85% within rect
                            const tLng = (0.15 + 0.7 * ((i + 0.5) / count)); // Offset for variety
                            const la = rect.minLat + (rect.maxLat-rect.minLat)*tLat;
                            const ln = rect.minLng + (rect.maxLng-rect.minLng)*tLng;
                            out.push([la,ln]);
                        }
                        return out;
                    }

                    if (rects) {
                        const results = [];
                        for (let i=0;i<4;i++){
                            const rect = rects[i];
                            const seeds = randomWaypointsInRect(rect, 7); // Fixed count for deterministic results
                            const loop = orderAsLoop(seeds);
                            let snapped = await osrmRouteLoopFromWaypoints(loop);
                            if (!snapped || snapped.length < 4) snapped = clampPathToRect(loop, rect, 8);
                            results.push({ name: names[i], color: '#DC3545', coords: clampPathToRect(snapped, rect, 6) });
                        }
                        return results;
                    }

                    // If bounds not available, build around Lisbon center in four disjoint tiles
                    const center = [38.736946, -9.142685];
                    const spanLat = 0.04, spanLng = 0.06; // ~ small city window
                    const latMid = center[0], lngMid = center[1];
                    const tiles = [
                        { minLat: latMid, maxLat: latMid + spanLat/2, minLng: lngMid - spanLng/2, maxLng: lngMid },
                        { minLat: latMid, maxLat: latMid + spanLat/2, minLng: lngMid, maxLng: lngMid + spanLng/2 },
                        { minLat: latMid - spanLat/2, maxLat: latMid, minLng: lngMid - spanLng/2, maxLng: lngMid },
                        { minLat: latMid - spanLat/2, maxLat: latMid, minLng: lngMid, maxLng: lngMid + spanLng/2 }
                    ];
                    const results = [];
                    for (let i=0;i<4;i++){
                        const rect = tiles[i];
                        const centerRectLat = (rect.minLat + rect.maxLat) / 2;
                        const centerRectLng = (rect.minLng + rect.maxLng) / 2;
                        const rectLatSpan = rect.maxLat - rect.minLat;
                        const rectLngSpan = rect.maxLng - rect.minLng;
                        
                        // Create different pentagon shapes for each tile
                        const loop = createStretchedPentagon(centerRectLat, centerRectLng, rectLatSpan * 0.7, rectLngSpan * 0.7, i);
                        results.push({ name: names[i], color: '#DC3545', coords: loop });
                    }
                    return results;
                }

                const usedComputed = finishedEarly && Array.isArray(computedResult) && computedResult.length;
                if (!usedComputed) {
                    // At 5s, finish process: close popup and render immediate local result, no background swap
                    console.log('⏰ Optimization timed out, using fallback routes');
                    const interim = buildImmediateFallbackRoutes();
                    renderOptimizedRoutesOnAI(interim);
                } else {
                    console.log('✅ Optimization completed successfully, rendering computed routes');
                    renderOptimizedRoutesOnAI(computedResult);
                }

            // Update KPIs with sample improved numbers (better values after optimization)
            const updates = {
                'routes-optimised': '8 %',   // Reduced from 15% - better optimization
                'stops-merged': '3',         // Reduced from 7 - fewer stops needed
                'calls-scheduled': '0',      // Reduced from 2 - no calls needed
                'time-saved': '58 min',      // Increased from 42 min - more time saved
                'success-rate': '+9.8 %',    // Increased from +7.2% - better success
                'spoilage-risk': '-2.1 %',   // Reduced from -0.8% - less spoilage risk
                'efficiency-gain': '24 %',   // Increased from 15% - better efficiency
                'cost-reduction': '€3,420'   // Increased from €2,340 - more cost saved
            };
            Object.entries(updates).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            });
            
            // Remove loading popup (if still present)
            const ov = document.getElementById('optimize-overlay');
            if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
            
            optimizeBtn.textContent = 'Optimization Complete!';
            optimizeBtn.className = 'w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg transition-colors';
            
            // Reset after 2 seconds
            setTimeout(() => {
                optimizeBtn.textContent = originalText;
                // Restore state depending on current toggle
                if (currentToggleState === 'tomorrow') {
                    updateOptimizeButton(true); // Disabled gray for Tomorrow
                } else {
                    updateOptimizeButton(false); // Enabled green for Today
                }
            }, 1200);
            } catch (e) {
                console.error('❌ Optimization failed:', e);
                
                // Even if optimization fails, show fallback routes to ensure user sees something
                console.log('🔄 Using emergency fallback routes due to optimization failure');
                const emergencyRoutes = [
                    { name: 'A', color: '#DC3545', coords: createStretchedPentagon(38.750, -9.22, 0.008, 0.012, 0) },
                    { name: 'B', color: '#DC3545', coords: createStretchedPentagon(38.765, -9.12, 0.008, 0.012, 1) },
                    { name: 'C', color: '#DC3545', coords: createStretchedPentagon(38.735, -9.25, 0.008, 0.012, 2) },
                    { name: 'D', color: '#DC3545', coords: createStretchedPentagon(38.720, -9.15, 0.008, 0.012, 3) }
                ];
                
                try {
                    renderOptimizedRoutesOnAI(emergencyRoutes);
                } catch (renderError) {
                    console.error('❌ Even fallback rendering failed:', renderError);
                }
                
                // Reset button state
                optimizeBtn.textContent = 'Optimization Failed';
                optimizeBtn.className = 'w-full py-3 px-4 bg-red-600 text-white font-semibold rounded-lg transition-colors';
                optimizeBtn.disabled = false;
                
                setTimeout(() => {
                    if (currentToggleState === 'tomorrow') {
                        updateOptimizeButton(true); // Disabled gray for Tomorrow
                    } else {
                        updateOptimizeButton(false); // Enabled green for Today
                    }
                }, 2000);
            }
        })();
    });
    
    // Timeline panel that replaces the Optimization Results card (no overlay)
    const timelineBtn = document.getElementById('timeline-btn');
    const resultsView = document.getElementById('results-view');
    const timelineView = document.getElementById('timeline-view');
    const timelineCourier = document.getElementById('timeline-panel-courier');
    const timelineContent = document.getElementById('timeline-panel-content');
    const timelineClosePanel = document.getElementById('timeline-close-panel');
 
        // Generate route data for Timeline based on stopsDataAll (like Routes tab)
    function generateRouteData(routeName) {
        console.log(`🔍 Generating route data for: ${routeName}`);
        // Get stops data from stopsDataAll (same as Routes tab)
        const stops = stopsDataAll[routeName];
        console.log(`📍 Found stops:`, stops);
        
        if (!stops || stops.length === 0) {
            console.warn(`No stops data found for route ${routeName}`);
            return getDefaultRouteData(routeName);
        }
        
        // Convert stops data to timeline format
        const timelineStops = stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === stops.length - 1;
            
            let type, status;
            if (isFirst) {
                type = 'warehouse';
                status = 'start';
            } else if (isLast) {
                type = 'warehouse';
                status = 'end';
            } else {
                type = 'delivery';
                status = 'active';
            }
            
            const timelineStop = {
                id: stop.id,
                time: stop.eta,
                location: stop.addr,
                type: type,
                status: status,
                coordinates: [stop.lat, stop.lon],
                index: index,
                // Additional data from stopsDataAll
                originalData: stop
            };
            
            console.log(`📍 Stop ${index + 1}: ${stop.addr} at [${stop.lat}, ${stop.lon}]`);
            return timelineStop;
        });
        
        // Calculate route statistics
        const totalDistance = calculateRouteDistanceFromStops(stops);
        const totalStops = stops.length;
        
        const result = {
            name: `Route ${routeName} - ${getDistrictName(routeName)}`,
            stops: timelineStops,
            totalDistance: totalDistance,
            totalStops: totalStops,
            originalStops: stops
        };
        
        console.log(`✅ Generated route data:`, result);
        return result;
    }

    function renderTimelineItems(route) {
        if (!timelineContent) return;
        
        console.log(`📋 Rendering timeline for route: ${route.name}`);
        const routeData = generateRouteData(route.name);
        console.log(`📊 Route data:`, routeData);
        
        // Make the courier header clickable with dropdown for route selection
        timelineCourier.innerHTML = `
            <div class="relative">
                <button onclick="toggleRouteDropdown()" class="flex items-center space-x-2 text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer" title="Click to select route">
                    <span>Route ${routeData.name}</span>
                    <svg id="route-arrow" class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                <div id="route-dropdown" class="hidden absolute top-full left-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    <div onclick="selectRoute('A')" class="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${route.name === 'A' ? 'bg-blue-50 text-blue-700' : ''}">
                        <div class="font-medium">Route A - North District</div>
                        <div class="text-xs text-gray-500 mt-1">North area delivery route</div>
                    </div>
                    <div onclick="selectRoute('B')" class="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${route.name === 'B' ? 'bg-blue-50 text-blue-700' : ''}">
                        <div class="font-medium">Route B - East District</div>
                        <div class="text-xs text-gray-500 mt-1">East area delivery route</div>
                    </div>
                    <div onclick="selectRoute('C')" class="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${route.name === 'C' ? 'bg-blue-50 text-blue-700' : ''}">
                        <div class="font-medium">Route C - South District</div>
                        <div class="text-xs text-gray-500 mt-1">South area delivery route</div>
                    </div>
                    <div onclick="selectRoute('D')" class="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer ${route.name === 'D' ? 'bg-blue-50 text-blue-700' : ''}">
                        <div class="font-medium">Route D - West District</div>
                        <div class="text-xs text-gray-500 mt-1">West area delivery route</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add route summary information with project styling - three separate cards
        // Get courier name based on route
        const getCourierName = (routeName) => {
            const courierNames = {
                'A': 'John',
                'B': 'Maria',
                'C': 'David',
                'D': 'Anna'
            };
            return courierNames[routeName] || `Courier ${routeName}`;
        };

        const summaryHtml = `
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="text-center">
                        <div class="text-sm text-gray-600 mb-1">
                            <span class="font-semibold text-gray-800">Courier</span>
                        </div>
                        <div class="text-lg font-bold text-gray-900">${getCourierName(route.name)}</div>
                    </div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="text-center">
                        <div class="text-sm text-gray-600 mb-1">
                            <span class="font-semibold text-gray-800">Total Stops</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-900">${routeData.totalStops}</div>
                    </div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="text-center">
                        <div class="text-sm text-gray-600 mb-1">
                            <span class="font-semibold text-gray-800">Total Distance</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-900">${routeData.totalDistance}m</div>
                    </div>
                </div>
            </div>
        `;
        
        const stopsHtml = routeData.stops.map((stop, idx) => {
            const base = 'bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 relative';
            
            // Calculate additional metrics
            const spoilageRisk = Math.random() * 5 + 1; // 1-6% for demo
            const distance = Math.random() * 2000 + 500; // 500-2500m for demo
            const avgDeliveryTime = Math.random() * 30 + 15; // 15-45 min for demo
            const avgEfficiency = Math.random() * 20 + 80; // 80-100% for demo
            const risk = Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Med' : 'Low';
            
            // Risk color mapping
            const riskColors = {
                'High': 'bg-red-100 text-red-800 border-red-200',
                'Med': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                'Low': 'bg-green-100 text-green-800 border-green-200'
            };
            
            // Simple status text without colors
            let statusText;
            if (stop.status === 'start') {
                statusText = 'Start Point';
            } else if (stop.status === 'end') {
                statusText = 'End Point';
            } else {
                statusText = 'Delivery Stop';
            }
            
            // Simple type badge without colors
            const typeBadge = stop.type === 'warehouse' ? 
                '<span class="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">Warehouse</span>' : 
                '<span class="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">Delivery</span>';
            
            // Risk badge in top right corner
            const riskBadge = `<div class="absolute top-3 right-3">
                <span class="inline-flex items-center text-xs px-2 py-1 rounded-full border ${riskColors[risk]} font-medium">
                    ${risk}
                </span>
            </div>`;
            
            // Additional metrics info
            const metricsInfo = `
                <div class="grid grid-cols-2 gap-3 mt-3 text-xs">
                    <div class="bg-gray-50 px-3 py-2 rounded">
                        <div class="text-gray-500 mb-1">Spoilage Risk</div>
                        <div class="font-semibold text-gray-900">${spoilageRisk.toFixed(1)}%</div>
                    </div>
                    <div class="bg-gray-50 px-3 py-2 rounded">
                        <div class="text-gray-500 mb-1">Distance</div>
                        <div class="font-semibold text-gray-900">${Math.round(distance)}m</div>
                    </div>
                    <div class="bg-gray-50 px-3 py-2 rounded">
                        <div class="text-gray-500 mb-1">Avg Delivery Time</div>
                        <div class="font-semibold text-gray-900">${Math.round(avgDeliveryTime)}min</div>
                    </div>
                    <div class="bg-gray-50 px-3 py-2 rounded">
                        <div class="text-gray-500 mb-1">Avg Efficiency</div>
                        <div class="font-semibold text-gray-900">${Math.round(avgEfficiency)}%</div>
                    </div>
                </div>
            `;
            
            const onClickHandler = `showPositionOnMap('${route.name}', ${stop.index}, ${stop.coordinates[0]}, ${stop.coordinates[1]})`;
            console.log(`🔗 Click handler for position ${stop.index + 1}: ${onClickHandler}`);
            
            return `
                <div class="${base} cursor-pointer timeline-stop-card" onclick="${onClickHandler}">
                    ${riskBadge}
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="mb-2">
                                <div class="text-lg font-bold text-gray-900">${stop.time}</div>
                                <div class="text-sm text-gray-600">${stop.location}</div>
                            </div>
                            <div class="flex items-center space-x-2 mb-2">
                                <span class="text-sm font-medium text-gray-700">${statusText}</span>
                                ${typeBadge}
                            </div>
                            <div class="text-xs text-gray-600 mt-2">
                                <span class="bg-gray-100 px-2 py-1 rounded text-gray-700">Position: ${stop.index + 1}/${routeData.totalStops}</span>
                            </div>
                            ${metricsInfo}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        timelineContent.innerHTML = summaryHtml + stopsHtml;
        
        console.log(`✅ Timeline rendered for Route ${route.name} with ${routeData.totalStops} stops`);
    }
 
    function showTimelinePanel(route) {
        if (!resultsView || !timelineView) return;
        renderTimelineItems(route);
        resultsView.classList.add('hidden');
        timelineView.classList.remove('hidden');
        timelineView.classList.add('flex');
        

    }
    

    

    
    // Global function to toggle route dropdown
    window.toggleRouteDropdown = function() {
        const dropdown = document.getElementById('route-dropdown');
        const arrow = document.getElementById('route-arrow');
        
        if (dropdown && arrow) {
            const isHidden = dropdown.classList.contains('hidden');
            
            if (isHidden) {
                // Opening dropdown - rotate arrow up
                dropdown.classList.remove('hidden');
                arrow.style.transform = 'rotate(180deg)';
            } else {
                // Closing dropdown - rotate arrow down
                dropdown.classList.add('hidden');
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    };
    
    // Global function to select a specific route
    window.selectRoute = function(routeName) {
        console.log(`🔄 Switching to route: ${routeName}`);
        const route = { name: routeName, id: routeName };
        
        // Update timeline for the new route
        renderTimelineItems(route);
        
        // Highlight route on map (without re-rendering timeline)
        window.currentTimelineRoute = routeName; // Prevent timeline re-render
        highlightRouteOnMap(route.id);
        
        // Close dropdown and reset arrow after selection
        const dropdown = document.getElementById('route-dropdown');
        const arrow = document.getElementById('route-arrow');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
        if (arrow) {
            arrow.style.transform = 'rotate(0deg)';
        }
        
        console.log(`✅ Successfully switched to Route ${routeName}`);
    };
    
    // Global function to switch between routes in timeline (kept for compatibility)
    window.switchToRoute = function(routeName) {
        const route = { name: routeName, id: routeName };
        setFocus(route.id);
        renderTimelineItems(route);
    };
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('route-dropdown');
        const routeButton = event.target.closest('button');
        const arrow = document.getElementById('route-arrow');
        
        if (dropdown && !routeButton) {
            dropdown.classList.add('hidden');
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    });

    function hideTimelinePanel() {
        if (!resultsView || !timelineView) return;
        timelineView.classList.add('hidden');
        timelineView.classList.remove('flex');
        resultsView.classList.remove('hidden');
    }

    if (timelineClosePanel) timelineClosePanel.addEventListener('click', hideTimelinePanel);

    if (timelineBtn) {
        timelineBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Show timeline for the first available route (usually Route A)
            const firstRoute = { name: 'A', id: 'A' };
            window.currentTimelineRoute = 'A'; // Set current route
            setFocus(firstRoute.id);
            showTimelinePanel(firstRoute);
        });
    }
    
    // Function to show position on map when Timeline position is clicked
    window.showPositionOnMap = function(routeName, positionIndex, lat, lng) {
        console.log(`📍 Showing position ${positionIndex + 1} for route ${routeName}`);
        console.log(`🌍 Coordinates: lat=${lat}, lng=${lng}`);
        
        // Clear any existing position markers
        if (window.currentMarker) {
            map.removeLayer(window.currentMarker);
        }
        
        // Find the route layer and highlight the specific position marker
        const routeLayer = routeLayers.find(layer => layer.id === routeName);
        console.log(`🔍 Looking for route layer: ${routeName}`);
        console.log(`🔍 Available route layers:`, routeLayers.map(l => l.id));
        
        if (routeLayer && routeLayer.markers) {
            console.log(`🔍 Found route layer with ${routeLayer.markers.length} markers`);
            
            // Find the marker with the correct position number
            let selectedMarker = null;
            let markerIndex = -1;
            
            // Log all markers to debug
            routeLayer.markers.forEach((marker, idx) => {
                if (marker.getElement) {
                    const positionNumber = marker.getElement().querySelector('.position-number');
                    console.log(`🔍 Marker ${idx}:`, positionNumber ? positionNumber.textContent : 'No position number');
                }
            });
            
            // Skip the first marker (route ID) and search for position number
            for (let i = 1; i < routeLayer.markers.length; i++) {
                const marker = routeLayer.markers[i];
                if (marker.getElement) {
                    const positionNumber = marker.getElement().querySelector('.position-number');
                    console.log(`🔍 Checking marker ${i}: ${positionNumber ? positionNumber.textContent : 'No position number'} vs ${(positionIndex + 1).toString()}`);
                    if (positionNumber && positionNumber.textContent === (positionIndex + 1).toString()) {
                        selectedMarker = marker;
                        markerIndex = i;
                        console.log(`✅ Found matching marker at index ${i}`);
                        break;
                    }
                }
            }
            
            if (selectedMarker) {
                console.log(`🎯 Highlighting marker at index ${markerIndex}`);
                
                // Reset all markers to normal style
                routeLayer.markers.forEach(marker => {
                    if (marker.getElement) {
                        const element = marker.getElement();
                        if (element) {
                            element.style.transform = 'scale(1)';
                            element.style.boxShadow = '0 0 0 2px #ffffff';
                        }
                    }
                });
                
                // Highlight the selected position marker
                if (selectedMarker.getElement) {
                    const element = selectedMarker.getElement();
                    if (element) {
                        element.style.transform = 'scale(1.2)';
                        element.style.boxShadow = '0 0 0 4px #3b82f6';
                    }
                }
                
                // Center map on the selected position with smooth animation
                const markerLatLng = selectedMarker.getLatLng();
                console.log(`🗺️ Centering map on:`, markerLatLng);
                map.flyTo(markerLatLng, 16, {
                    duration: 1.0,
                    easeLinearity: 0.25
                });
                
                // Show popup for the selected position
                const popupContent = `
                    <div class="text-center">
                        <div class="font-bold text-lg">Position ${positionIndex + 1}</div>
                        <div class="text-sm text-gray-600">Route ${routeName}</div>
                        <div class="text-xs text-gray-500 mt-1">Highlighted on map</div>
                    </div>
                `;
                selectedMarker.bindPopup(popupContent).openPopup();
                
                console.log(`✅ Position ${positionIndex + 1} highlighted on map for Route ${routeName}`);
            } else {
                console.warn(`❌ Marker for position ${positionIndex + 1} not found in route ${routeName}`);
                console.warn(`❌ Available markers:`, routeLayer.markers.length);
                
                // Fallback: center map on the provided coordinates
                console.log(`🔄 Fallback: centering map on provided coordinates [${lat}, ${lng}]`);
                map.flyTo([lat, lng], 16, {
                    duration: 1.0,
                    easeLinearity: 0.25
                });
            }
        } else {
            console.warn(`❌ Route layer not found for ${routeName}`);
            
            // Fallback: center map on the provided coordinates
            console.log(`🔄 Fallback: centering map on provided coordinates [${lat}, ${lng}]`);
            map.flyTo([lat, lng], 16, {
                duration: 1.0,
                easeLinearity: 0.25
            });
        }
        
        // Highlight the corresponding position in Timeline
        highlightTimelinePosition(positionIndex);
    };
    
    // Function to highlight position in Timeline
    function highlightTimelinePosition(positionIndex) {
        console.log(`🎯 Highlighting position ${positionIndex} in Timeline`);
        
        // Remove previous highlights
        const timelineCards = document.querySelectorAll('.timeline-stop-card');
        timelineCards.forEach(card => {
            card.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        });
        
        // Highlight the corresponding card
        if (timelineCards[positionIndex]) {
            timelineCards[positionIndex].classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            
            // Scroll to the highlighted card
            timelineCards[positionIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    // Function to highlight map position when Timeline position is clicked
    function highlightMapPosition(routeName, positionIndex) {
        console.log(`🎯 Highlighting map position ${positionIndex} for route ${routeName}`);
        
        // Find the route layer
        const routeLayer = routeLayers.find(layer => layer.id === routeName);
        if (!routeLayer) {
            console.warn(`❌ Route layer not found for ${routeName}`);
            return;
        }
        
        // Reset all position markers to normal style
        routeLayer.markers.forEach(marker => {
            if (marker.getElement) {
                const element = marker.getElement();
                if (element) {
                    element.style.transform = 'scale(1)';
                    element.style.boxShadow = '0 0 0 2px #ffffff';
                }
            }
        });
        
        // Highlight the specific position marker
        // Find the marker with the correct position number
        let selectedMarker = null;
        
        // Skip the first marker (route ID) and search for position number
        for (let i = 1; i < routeLayer.markers.length; i++) {
            const marker = routeLayer.markers[i];
            if (marker.getElement) {
                const positionNumber = marker.getElement().querySelector('.position-number');
                if (positionNumber && positionNumber.textContent === (positionIndex + 1).toString()) {
                    selectedMarker = marker;
                    break;
                }
            }
        }
        
        if (selectedMarker) {
            if (selectedMarker.getElement) {
                const element = selectedMarker.getElement();
                if (element) {
                    element.style.transform = 'scale(1.2)';
                    element.style.boxShadow = '0 0 0 4px #3b82f6';
                    
                    // Reset after 3 seconds
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                        element.style.boxShadow = '0 0 0 2px #ffffff';
                    }, 3000);
                }
            }
        } else {
            console.warn(`❌ Marker for position ${positionIndex + 1} not found in route ${routeName}`);
        }
        
        // Also highlight the route polyline
        if (routeLayer.polyline) {
            routeLayer.polyline.setStyle({ 
                weight: 8, 
                opacity: 0.8,
                color: '#fbbf24'
            });
            
            // Reset after 3 seconds
            setTimeout(() => {
                routeLayer.polyline.setStyle({ 
                    weight: 6, 
                    opacity: 1.0,
                    color: '#2563eb'
                });
            }, 3000);
        }
    }
    
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

.position-marker {
    background: transparent !important;
    border: none !important;
}

.position-marker .position-dot {
    width: 24px !important;
    height: 24px !important;
    border-radius: 50% !important;
    background: #2563eb !important;
    border: 2px solid #1d4ed8 !important;
    box-shadow: 0 0 0 2px #ffffff !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
}

.position-marker .position-number {
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    line-height: 1 !important;
    user-select: none !important;
}

.position-marker .position-dot:hover {
    transform: scale(1.1) !important;
    box-shadow: 0 0 0 4px #ffffff, 0 4px 12px rgba(37, 99, 235, 0.4) !important;
}

.position-marker .position-dot.highlighted {
    transform: scale(1.2) !important;
    box-shadow: 0 0 0 4px #3b82f6 !important;
}

/* Override any Leaflet default styles */
.leaflet-marker-icon {
    background: transparent !important;
    border: none !important;
}

/* Force circular shape for all markers */
.leaflet-marker-icon div {
    border-radius: 50% !important;
}

/* Ensure position markers are circular */
.position-marker .position-dot {
    border-radius: 50% !important;
    overflow: hidden !important;
}

/* Override any inline styles that might cause squares */
.leaflet-marker-icon div[style*="border-radius"] {
    border-radius: 50% !important;
}
`;
document.head.appendChild(style);

// Global function for testing toggle functionality from browser console (manual only)
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

// Disable auto test to prevent unintended toggling on load

// Render AI map routes using the same logic as the "Routes" tab
function drawRoutesLikeRoutesTabOnAI() {
    // Clear existing layers
    routeLayers.forEach(layer => {
        try { map.removeLayer(layer.polyline); } catch(e) {}
        (layer.markers || []).forEach(m => { try { map.removeLayer(m);} catch(e) {} });
    });
    routeLayers = [];

    function clampToLand(lat, lng) {
        const minLat = 38.715, maxLat = 38.790;
        const minLng = -9.250, maxLng = -9.155;
        let clampedLat = Math.min(Math.max(lat, minLat), maxLat);
        let clampedLng = Math.min(Math.max(lng, minLng), maxLng - 0.002);
        return [clampedLat, clampedLng];
    }

    const landAnchors = [
        [38.725, -9.210], [38.735, -9.205], [38.745, -9.198], [38.740, -9.192],
        [38.725, -9.190], [38.735, -9.185], [38.745, -9.180], [38.750, -9.175],
        [38.740, -9.170], [38.735, -9.168], [38.745, -9.165], [38.750, -9.162],
        [38.760, -9.190], [38.760, -9.175], [38.755, -9.165], [38.755, -9.180],
        [38.720, -9.190], [38.725, -9.184], [38.730, -9.178], [38.735, -9.172],
        [38.755, -9.205], [38.750, -9.200], [38.745, -9.195], [38.740, -9.188]
    ];

    const hasStops = typeof stopsDataAll !== 'undefined';
    const pool = hasStops
        ? allRoutesData.filter(r => Array.isArray(stopsDataAll[r.id]) && stopsDataAll[r.id].length >= 2)
        : [];
    const candidates = pool.slice(0, Math.min(pool.length, 24));

    const layers = [];
    candidates.forEach((r, i) => {
        const stops = stopsDataAll[r.id];
        const orig = stops.map(s => [s.lat, s.lon]);
        const centroid = orig.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]).map(v => v / orig.length);
        let anchor = landAnchors[i % landAnchors.length];
        const letter = getRouteLetter(r.id);
        if (letter === 'A') anchor = [38.740, -9.170];
        if (letter === 'B') anchor = [38.735, -9.168];
        if (letter === 'C') anchor = [38.736, -9.175];
        const scale = (letter === 'A' || letter === 'B') ? 0.22 : 0.18;
        let path = orig.map(([lat, lng]) => {
            const scaledLat = (lat - centroid[0]) * scale;
            const scaledLng = (lng - centroid[1]) * scale;
            return clampToLand(anchor[0] + scaledLat, anchor[1] + scaledLng);
        });
        const maxLngPath = Math.max(...path.map(p => p[1]));
        const minLatPath = Math.min(...path.map(p => p[0]));
        const eastThreshold = -9.157, southThreshold = 38.720;
        let shiftLng = 0, shiftLat = 0;
        if (maxLngPath > eastThreshold) shiftLng = eastThreshold - maxLngPath - 0.003;
        if (minLatPath < southThreshold) shiftLat = southThreshold - minLatPath + 0.003;
        if (shiftLng !== 0 || shiftLat !== 0) {
            path = path.map(([la, ln]) => clampToLand(la + shiftLat, ln + shiftLng));
        }
        if (path.length > 1) {
            const [s0, s1] = path[0];
            const [e0, e1] = path[path.length - 1];
            if (Math.abs(s0 - e0) > 1e-9 || Math.abs(s1 - e1) > 1e-9) path.push([s0, s1]);
        }
        let color = '#28A745';
        if (r.risk === 'High') color = '#DC3545';
        else if (r.risk === 'Med') color = '#FFC107';

        const polyline = L.polyline(path, { color, weight: 4, opacity: 0.9 }).addTo(map);
        const startLatLng = L.latLng(path[0][0], path[0][1]);
        const iconHtml = `
            <div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#2563eb;border:2px solid #1d4ed8;box-shadow:0 0 0 2px #ffffff;">
                <div style="color:#ffffff;font-weight:700;font-size:12px;line-height:1;">${r.id}</div>
            </div>`;
        const idIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [28,28], iconAnchor: [14,14] });
        const idMarker = L.marker(startLatLng, { icon: idIcon }).addTo(map);

        const dots = (path[0][0] === path[path.length-1][0] && path[0][1] === path[path.length-1][1]) ? path.slice(0,-1) : path;
        const markers = [idMarker];
        dots.forEach(pt => {
            // Removed old square markers - now using new round markers
        });
        routeLayers.push({ polyline, markers, id: r.id, color });
    });

    if (routeLayers.length) {
        const group = L.featureGroup(routeLayers.map(l => l.polyline));
        const gb = group.getBounds();
        lastAIBounds = gb; // remember area for optimization clamping
        map.fitBounds(gb, { padding: [20, 20] });
    }
}

// Compute 4 optimized routes (A,B,C,D) from existing 24 by spatial clustering and road snapping
async function computeAndSnapOptimizedRoutes() {
    // 1) Gather all coordinates from the 24 routes
    const points = [];
    const routeMeta = []; // keep routeId -> points index ranges for potential future use
    allRoutesData.slice(0, 24).forEach((r) => {
        const stops = stopsDataAll[r.id] || [];
        const startIndex = points.length;
        stops.forEach(s => points.push([s.lat, s.lon]));
        routeMeta.push({ id: r.id, startIndex, endIndex: points.length });
    });

    if (points.length === 0) throw new Error('No points available to optimize');

    console.log(`Collected ${points.length} original points from 24 routes for optimization`);

    // 2) Balanced K-means (k=4) with capacity to ensure even distribution and compact clusters
    const K = 4;
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    const latMin = Math.min(...lats), latMax = Math.max(...lats);
    const lngMin = Math.min(...lngs), lngMax = Math.max(...lngs);
    let centers = [
        [latMin + (latMax - latMin) * 0.25, lngMin + (lngMax - lngMin) * 0.25],
        [latMin + (latMax - latMin) * 0.25, lngMin + (lngMax - lngMin) * 0.75],
        [latMin + (latMax - latMin) * 0.75, lngMin + (lngMax - lngMin) * 0.25],
        [latMin + (latMax - latMin) * 0.75, lngMin + (lngMax - lngMin) * 0.75]
    ];
    const capacity = Math.ceil(points.length / K);
    function dist2(a, b) { const dy = a[0]-b[0], dx = a[1]-b[1]; return dy*dy + dx*dx; }
    for (let iter = 0; iter < 8; iter++) {
        const clusters = Array.from({length: K}, () => []);
        // Build all candidate assignments and greedily fill with capacity constraint
        const candidates = [];
        for (let i = 0; i < points.length; i++) {
            for (let k = 0; k < K; k++) {
                candidates.push({ pointIndex: i, k, d: dist2(points[i], centers[k]) });
            }
        }
        candidates.sort((a,b)=> a.d - b.d);
        const taken = new Array(points.length).fill(false);
        for (const c of candidates) {
            if (taken[c.pointIndex]) continue;
            if (clusters[c.k].length < capacity) {
                clusters[c.k].push(points[c.pointIndex]);
                taken[c.pointIndex] = true;
            }
            if (clusters.every(arr => arr.length >= capacity) && taken.every(Boolean)) break;
        }
        // Any leftovers (shouldn't happen with ceil, but guard): put to nearest cluster even if over capacity
        for (let i = 0; i < points.length; i++) {
            if (!taken[i]) {
                let bestK = 0, bd = Infinity;
                for (let k = 0; k < K; k++) { const d = dist2(points[i], centers[k]); if (d < bd) { bd = d; bestK = k; } }
                clusters[bestK].push(points[i]);
                taken[i] = true;
            }
        }
        // Recompute centers
        for (let k = 0; k < K; k++) {
            if (clusters[k].length) {
                const sum = clusters[k].reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]);
                centers[k] = [sum[0]/clusters[k].length, sum[1]/clusters[k].length];
            }
        }
    }
    // Final assignment using capacity constraint to obtain clusters
    const finalClusters = Array.from({length: K}, () => []);
    const finalCandidates = [];
    for (let i = 0; i < points.length; i++) {
        for (let k = 0; k < K; k++) finalCandidates.push({ pointIndex: i, k, d: dist2(points[i], centers[k]) });
    }
    finalCandidates.sort((a,b)=> a.d - b.d);
    const used = new Array(points.length).fill(false);
    for (const c of finalCandidates) {
        if (used[c.pointIndex]) continue;
        if (finalClusters[c.k].length < capacity) {
            finalClusters[c.k].push(points[c.pointIndex]);
            used[c.pointIndex] = true;
        }
    }
    for (let i = 0; i < points.length; i++) if (!used[i]) {
        let bestK = 0, bd = Infinity;
        for (let k = 0; k < K; k++) { const d = dist2(points[i], centers[k]); if (d < bd) { bd = d; bestK = k; } }
        finalClusters[bestK].push(points[i]);
        used[i] = true;
    }

    // Log cluster distribution
    finalClusters.forEach((cluster, idx) => {
        console.log(`Cluster ${String.fromCharCode(65 + idx)}: ${cluster.length} original points`);
    });

    // Helpers to build a compact loop around each cluster using its convex hull
    function convexHullLatLng(pts){
        if (!pts || pts.length <= 3) return pts.slice();
        const arr = pts.map(([la,ln])=>({x:ln,y:la,ll:[la,ln]})).sort((a,b)=> a.x===b.x? a.y-b.y : a.x-b.x);
        const cross = (o,a,b)=> (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
        const lower=[]; for (const p of arr){ while(lower.length>=2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop(); lower.push(p);} 
        const upper=[]; for (let i=arr.length-1;i>=0;i--){ const p=arr[i]; while(upper.length>=2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop(); upper.push(p);} 
        const h=lower.concat(upper.slice(1,-1));
        return h.map(p=>p.ll);
    }
    function densifyHullLoop(hullPts, stepMinM=80, stepMaxM=120){
        if (!hullPts || hullPts.length < 2) return hullPts;
        const toRad = (deg) => deg * Math.PI / 180;
        const haversineMeters = (a,b)=>{ const R=6371000; const dLat=toRad(b[0]-a[0]); const dLng=toRad(b[1]-a[1]); const lat1=toRad(a[0]); const lat2=toRad(b[0]); const h=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(h)); };
        const out=[]; const pts=hullPts.slice(); if (pts[0][0]!==pts[pts.length-1][0]||pts[0][1]!==pts[pts.length-1][1]) pts.push(pts[0]);
        for (let i=0;i<pts.length-1;i++){
            const a=pts[i], b=pts[i+1];
            const segLen=haversineMeters(a,b);
            let step=stepMinM + (stepMaxM-stepMinM) * 0.5; // Use fixed middle value for deterministic results
            const steps=Math.max(1, Math.floor(segLen/step));
            for (let s=0;s<steps;s++){ const t=s/steps; out.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t]); }
        }
        out.push(out[0]);
        return out;
    }

    // Build a path that visits ALL cluster points (original route stops) using TSP-like ordering
    function buildOrganicPathFromPoints(clusterPts, routeIndex){
        if (!clusterPts || clusterPts.length === 0) return [];
        if (clusterPts.length === 1) {
            const p = clusterPts[0];
            // Create a small organic loop around the single point, but include the original point
            const r = 0.0008; // ~90m radius
            return [
                [p[0], p[1]], // Original point first
                [p[0] + r * 0.7, p[1] + r * 0.3],
                [p[0] + r * 0.3, p[1] + r * 0.8],
                [p[0] - r * 0.4, p[1] + r * 0.6],
                [p[0] - r * 0.8, p[1] - r * 0.2],
                [p[0] - r * 0.2, p[1] - r * 0.7],
                [p[0] + r * 0.5, p[1] - r * 0.4],
                [p[0], p[1]] // Back to original point
            ];
        }
        
        // Create a path that visits ALL original points using nearest-neighbor TSP heuristic
        const visited = new Set();
        const path = [];
        
        // Start from the westmost point (leftmost) for consistent routing
        let currentIdx = 0;
        let westmost = clusterPts[0][1]; // longitude
        for (let i = 1; i < clusterPts.length; i++) {
            if (clusterPts[i][1] < westmost) {
                westmost = clusterPts[i][1];
                currentIdx = i;
            }
        }
        
        // Add all points using nearest-neighbor order
        path.push([clusterPts[currentIdx][0], clusterPts[currentIdx][1]]);
        visited.add(currentIdx);
        
        // Helper function to calculate distance between two points
        const distance = (p1, p2) => {
            const dx = p1[0] - p2[0];
            const dy = p1[1] - p2[1];
            return Math.sqrt(dx * dx + dy * dy);
        };
        
        // Visit all remaining points in nearest-neighbor order
        while (visited.size < clusterPts.length) {
            const current = clusterPts[currentIdx];
            let nearestIdx = -1;
            let nearestDist = Infinity;
            
            for (let i = 0; i < clusterPts.length; i++) {
                if (!visited.has(i)) {
                    const dist = distance(current, clusterPts[i]);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestIdx = i;
                    }
                }
            }
            
            if (nearestIdx !== -1) {
                path.push([clusterPts[nearestIdx][0], clusterPts[nearestIdx][1]]);
                visited.add(nearestIdx);
                currentIdx = nearestIdx;
            }
        }
        
        // Normalize route density - ensure all routes have similar number of points for consistent appearance
        const targetDensity = 12; // Target number of segments for consistent look
        const smoothPath = [];
        
        // Calculate total path length
        let totalDistance = 0;
        for (let i = 0; i < path.length; i++) {
            const nextIdx = (i + 1) % path.length;
            totalDistance += distance(path[i], path[nextIdx]);
        }
        
        const segmentLength = totalDistance / targetDensity;
        let currentDistance = 0;
        let segmentDistance = 0;
        
        for (let i = 0; i < path.length; i++) {
            smoothPath.push(path[i]);
            
            const nextIdx = (i + 1) % path.length;
            const segDist = distance(path[i], path[nextIdx]);
            segmentDistance += segDist;
            
            // Add intermediate points to maintain consistent density
            while (segmentDistance >= segmentLength && smoothPath.length < targetDensity + 2) {
                const progress = (segmentLength - (segmentDistance - segDist)) / segDist;
                const midLat = path[i][0] + (path[nextIdx][0] - path[i][0]) * progress;
                const midLng = path[i][1] + (path[nextIdx][1] - path[i][1]) * progress;
                
                // Add very minimal organic variation for natural look
                const seed = (routeIndex * 1000 + smoothPath.length) * 7919;
                const randOffset = ((seed % 1000) / 1000 - 0.5) * 0.0001; // Reduced variation
                smoothPath.push([midLat + randOffset, midLng + randOffset]);
                
                segmentDistance -= segmentLength;
            }
        }
        
        // Close the loop by returning to start
        smoothPath.push(smoothPath[0]);
        
        console.log(`Route ${String.fromCharCode(65 + routeIndex)}: Created path with ${clusterPts.length} original stops, ${smoothPath.length} total points`);
        return smoothPath;
    }

    const orderedClusters = finalClusters.map((pts, index) => buildOrganicPathFromPoints(pts, index));

    // 4) Snap each cluster path to roads using OSRM and smooth
    // Helpers for bounds clamping to keep final 4 routes in same area as previous 24
    const toRad = (deg) => deg * Math.PI / 180;
    const metersToLat = (m) => m / 111320;
    const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
    function clampPathToBounds(path, bounds, padMeters = 1) {
        if (!bounds || !path || path.length === 0) return path;
        const sw = bounds.getSouthWest ? bounds.getSouthWest() : { lat: bounds.minLat, lng: bounds.minLng };
        const ne = bounds.getNorthEast ? bounds.getNorthEast() : { lat: bounds.maxLat, lng: bounds.maxLng };
        const padLat = metersToLat(padMeters);
        const midLat = (sw.lat + ne.lat) / 2;
        const padLng = metersToLng(padMeters, midLat);
        const minLat = sw.lat + padLat;
        const maxLat = ne.lat - padLat;
        const minLng = sw.lng + padLng;
        const maxLng = ne.lng - padLng;
        return path.map(([la, ln]) => [
            Math.min(Math.max(la, minLat), maxLat),
            Math.min(Math.max(ln, minLng), maxLng)
        ]);
    }

    // Shift a path north/left by given meters, then clamp again
    function shiftPathByMeters(path, northMeters = 0, westMeters = 0) {
        if (!path || path.length === 0) return path;
        const midLat = path.reduce((a,p)=>a+p[0],0)/path.length;
        const dLat = metersToLat(northMeters);
        const dLngMag = metersToLng(Math.abs(westMeters), midLat);
        const dLng = westMeters >= 0 ? -dLngMag : dLngMag; // west = smaller longitude (more negative)
        return path.map(([la, ln]) => [la + dLat, ln + dLng]);
    }
    async function osrmSnap(path) {
        if (path.length < 2) return path;
        const maxPerReq = 20; const out=[];
        for (let i=0;i<path.length;i+=maxPerReq-1){
            const slice = path.slice(i, Math.min(path.length, i+maxPerReq));
            if (i>0) slice.unshift(path[i-1]);
            const coordStr = slice.map(p=> `${p[1].toFixed(6)},${p[0].toFixed(6)}`).join(';');
            const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&continue_straight=true&alternatives=false`;
            try{
                const res = await fetch(url);
                const json = await res.json();
                const coords = json?.routes?.[0]?.geometry?.coordinates || [];
                coords.forEach(([lng,lat])=> out.push([lat,lng]));
            }catch(e){ slice.forEach(p=> out.push(p)); }
        }
        // simple dedupe
        const simplified=[]; for(const p of out){ const last=simplified[simplified.length-1]; if(!last||Math.abs(last[0]-p[0])>1e-6||Math.abs(last[1]-p[1])>1e-6) simplified.push(p);} 
        return simplified;
    }

    function chaikinSmoothClosed(pts, iters=1){
        if (!pts || pts.length<3) return pts;
        let p=pts.slice();
        for(let t=0;t<iters;t++){
            const out=[]; for(let i=0;i<p.length-1;i++){ const a=p[i], b=p[i+1]; out.push([0.75*a[0]+0.25*b[0],0.75*a[1]+0.25*b[1]]); out.push([0.25*a[0]+0.75*b[0],0.25*a[1]+0.75*b[1]]);} out.push(out[0]); p=out;
        }
        return p;
    }

    const colors = ['#28A745', '#0D6EFD', '#FFC107', '#DC3545'];
    const names = ['A','B','C','D'];
    // Build quadrants over previous 24-routes bounds to prevent overlap and preserve coverage
    function rectsFromBounds(bounds) {
        if (!bounds) return null;
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const latMid = (ne.lat + sw.lat) / 2;
        const lngMid = (ne.lng + sw.lng) / 2;
        return [
            // NW, NE, SW, SE
            { minLat: latMid, maxLat: ne.lat, minLng: sw.lng, maxLng: lngMid },
            { minLat: latMid, maxLat: ne.lat, minLng: lngMid, maxLng: ne.lng },
            { minLat: sw.lat, maxLat: latMid, minLng: sw.lng, maxLng: lngMid },
            { minLat: sw.lat, maxLat: latMid, minLng: lngMid, maxLng: ne.lng }
        ];
    }
    function clampPathToRectMeters(path, rect, padMeters = 3) {
        if (!rect || !path) return path;
        const toRad = (deg) => deg * Math.PI / 180;
        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
        const midLat = (rect.minLat + rect.maxLat) / 2;
        const padLat = metersToLat(padMeters);
        const padLng = metersToLng(padMeters, midLat);
        return path.map(([la, ln]) => [
            Math.min(Math.max(la, rect.minLat + padLat), rect.maxLat - padLat),
            Math.min(Math.max(ln, rect.minLng + padLng), rect.maxLng - padLng)
        ]);
    }
    const rects = lastAIBounds ? rectsFromBounds(lastAIBounds) : null;
    // Generate a consistent closed loop inside a rectangle with small wiggles
    function buildTemplateLoop(rect, seed = 1) {
        if (!rect) return [];
        const toRad = (deg) => deg * Math.PI / 180;
        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
        const centerLat = (rect.minLat + rect.maxLat) / 2;
        const insetM = 30; // ~30m inset from edges
        const insetLat = metersToLat(insetM);
        const insetLng = metersToLng(insetM, centerLat);
        const top = rect.maxLat - insetLat;
        const bottom = rect.minLat + insetLat;
        const left = rect.minLng + insetLng;
        const right = rect.maxLng - insetLng;
        // Deterministic small wiggles
        let s = seed * 9973;
        const rand = () => {
            s = Math.sin(s) * 10000; return s - Math.floor(s);
        };
        const ampLat = (rect.maxLat - rect.minLat) * 0.0025;
        const ampLng = (rect.maxLng - rect.minLng) * 0.0025;
        const pts = [];
        const steps = 16; // per edge
        // Top: left -> right
        for (let i=0;i<=steps;i++){
            const t=i/steps; const x = left + (right-left)*t; const y = top - ampLat*Math.sin((t+rand())*Math.PI*2);
            pts.push([y,x]);
        }
        // Right: top -> bottom
        for (let i=1;i<=steps;i++){
            const t=i/steps; const y = top - (top-bottom)*t; const x = right - ampLng*Math.sin((t+rand())*Math.PI*2);
            pts.push([y,x]);
        }
        // Bottom: right -> left
        for (let i=1;i<=steps;i++){
            const t=i/steps; const x = right - (right-left)*t; const y = bottom + ampLat*Math.sin((t+rand())*Math.PI*2);
            pts.push([y,x]);
        }
        // Left: bottom -> top (exclude final point; closed later)
        for (let i=1;i<steps;i++){
            const t=i/steps; const y = bottom + (top-bottom)*t; const x = left + ampLng*Math.sin((t+rand())*Math.PI*2);
            pts.push([y,x]);
        }
        pts.push(pts[0]);
        return pts;
    }

    // Expand or shrink a rectangle by a relative padding
    function expandRect(rect, padRel = 0.06) {
        if (!rect) return rect;
        const latSpan = rect.maxLat - rect.minLat;
        const lngSpan = rect.maxLng - rect.minLng;
        return {
            minLat: rect.minLat + latSpan * padRel,
            maxLat: rect.maxLat - latSpan * padRel,
            minLng: rect.minLng + lngSpan * padRel,
            maxLng: rect.maxLng - lngSpan * padRel
        };
    }

    // Filter points inside a rectangle
    function pointsInRect(pts, r) {
        return pts.filter(([la, ln]) => la >= r.minLat && la <= r.maxLat && ln >= r.minLng && ln <= r.maxLng);
    }

    // Farthest Point Sampling to get well-spread anchors
    function farthestPointSample(pts, count) {
        if (!pts || pts.length === 0) return [];
        const out = [];
        // start from centroid-nearest point
        const c = pts.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]).map(v=>v/pts.length);
        let bestIdx = 0; let bestD = Infinity;
        const d2 = (a,b)=>{ const dy=a[0]-b[0], dx=a[1]-b[1]; return dy*dy+dx*dx; };
        for (let i=0;i<pts.length;i++){ const dist=d2(pts[i],c); if(dist<bestD){bestD=dist; bestIdx=i;} }
        out.push(pts[bestIdx]);
        const used = new Array(pts.length).fill(false); used[bestIdx]=true;
        while (out.length < Math.min(count, pts.length)) {
            let sel = -1; let best = -1;
            for (let i=0;i<pts.length;i++){
                if (used[i]) continue;
                let minD = Infinity;
                for (const q of out) { const dd = d2(pts[i], q); if (dd < minD) minD = dd; }
                if (minD > best) { best = minD; sel = i; }
            }
            used[sel] = true; out.push(pts[sel]);
        }
        return out;
    }

    // Order points into a loop by angle around their centroid
    function orderAsLoop(pts) {
        if (!pts || pts.length < 2) return pts.slice();
        const c = pts.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]).map(v=>v/pts.length);
        const withAng = pts.map(p => ({ p, a: Math.atan2(p[0]-c[0], p[1]-c[1]) }));
        withAng.sort((u,v)=> u.a - v.a);
        const ring = withAng.map(o=>o.p);
        ring.push(ring[0]);
        return ring;
    }

    // Densify a closed loop and add gentle perpendicular wiggles for organic feel
    function densifyLoopWithWiggle(loopPts, stepMinM = 90, stepMaxM = 150, wiggleMinM = 12, wiggleMaxM = 28) {
        if (!loopPts || loopPts.length < 2) return loopPts;
        const toRad = (deg) => deg * Math.PI / 180;
        const haversineMeters = (a, b) => {
            const R = 6371000;
            const dLat = toRad(b[0]-a[0]);
            const dLng = toRad(b[1]-a[1]);
            const lat1 = toRad(a[0]);
            const lat2 = toRad(b[0]);
            const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
            return 2 * R * Math.asin(Math.sqrt(h));
        };
        const out = [];
        let phase = 0; // Fixed phase for deterministic results
        for (let i = 0; i < loopPts.length - 1; i++) {
            const a = loopPts[i];
            const b = loopPts[i+1];
            const midLat = (a[0] + b[0]) / 2;
            const cosLat = Math.cos(toRad(midLat));
            const latScale = 111320;
            const lngScale = 111320 * cosLat;
            const segLenM = haversineMeters(a,b);
            let step = stepMinM + (stepMaxM - stepMinM) * 0.5; // Fixed step for deterministic results
            const steps = Math.max(1, Math.round(segLenM / step));
            const dyM = (b[0]-a[0]) * latScale;
            const dxM = (b[1]-a[1]) * lngScale;
            const segLenMApprox = Math.max(1e-6, Math.sqrt(dyM*dyM + dxM*dxM));
            // unit perpendicular in meters (left-hand)
            const upYM = -dxM / segLenMApprox;
            const upXM = dyM / segLenMApprox;
            // convert to degrees
            const upLatDeg = upYM / latScale;
            const upLngDeg = upXM / lngScale;
            const amp = wiggleMinM + (wiggleMaxM - wiggleMinM) * 0.5; // Fixed amplitude for deterministic results
            for (let s = 0; s < steps; s++) {
                const t = s / steps;
                const baseLat = a[0] + (b[0]-a[0]) * t;
                const baseLng = a[1] + (b[1]-a[1]) * t;
                const wiggle = Math.sin(phase + t * Math.PI * 2) * amp;
                out.push([ baseLat + upLatDeg * wiggle, baseLng + upLngDeg * wiggle ]);
            }
            phase += 0.4; // Fixed phase increment for deterministic results
        }
        out.push(out[0]);
        return out;
    }

    // Softly keep a path inside a rect: shift whole path inward if it exceeds pad
    function softKeepInsideRect(path, rect, padMeters = 8) {
        if (!rect || !path || path.length === 0) return path;
        const toRad = (deg) => deg * Math.PI / 180;
        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
        const midLat = (rect.minLat + rect.maxLat) / 2;
        const padLat = metersToLat(padMeters);
        const padLng = metersToLng(padMeters, midLat);
        const minLat = rect.minLat + padLat, maxLat = rect.maxLat - padLat;
        const minLng = rect.minLng + padLng, maxLng = rect.maxLng - padLng;
        let dLat = 0, dLng = 0;
        for (const [la,ln] of path){
            if (la < minLat) dLat = Math.max(dLat, minLat - la);
            if (la > maxLat) dLat = Math.min(dLat, maxLat - la);
            if (ln < minLng) dLng = Math.max(dLng, minLng - ln);
            if (ln > maxLng) dLng = Math.min(dLng, maxLng - ln);
        }
        if (dLat !== 0 || dLng !== 0) return path.map(([la,ln]) => [la + dLat, ln + dLng]);
        return path;
    }
    const resSnapped = [];
    // Prepare an expanded rect per quadrant to pick anchors from actual points
    // Build candidate paths directly from organic cluster loops
    const rawPaths = [];
    for (let k=0;k<K;k++){
        let candidatePath = orderedClusters[k];
        // Vary shapes for A–D using small rotate/scale transforms per route
        function rotateScalePath(path, center, angleDeg, scaleX=1, scaleY=1){
            if (!path || path.length===0) return path;
            const ang = angleDeg * Math.PI / 180;
            const sin = Math.sin(ang), cos = Math.cos(ang);
            const cy = center[0], cx = center[1];
            return path.map(([la,ln])=>{
                const y = la - cy, x = ln - cx;
                const sx = x * scaleX, sy = y * scaleY;
                const rx = sx * cos - sy * sin;
                const ry = sx * sin + sy * cos;
                return [cy + ry, cx + rx];
            });
        }
        const centerForTransform = (rects && rects[k]) ? [(rects[k].minLat+rects[k].maxLat)/2, (rects[k].minLng+rects[k].maxLng)/2] : [
            candidatePath.reduce((a,p)=>a+p[0],0)/candidatePath.length,
            candidatePath.reduce((a,p)=>a+p[1],0)/candidatePath.length
        ];
        const shapeProfiles = [
            { angle: -20, sx: 1.12, sy: 0.95 },
            { angle: 15,  sx: 0.93, sy: 1.15 },
            { angle: -32, sx: 1.18, sy: 0.90 },
            { angle: 28,  sx: 0.92, sy: 1.12 }
        ];
        const prof = shapeProfiles[k % shapeProfiles.length];
        candidatePath = rotateScalePath(candidatePath, centerForTransform, prof.angle, prof.sx, prof.sy);
        if (rects && rects[k]) candidatePath = clampPathToRectMeters(candidatePath, rects[k], 14);

        // Add more organic variation before road snapping
        const enhanced = [];
        for (let i = 0; i < candidatePath.length - 1; i++) {
            const a = candidatePath[i];
            const b = candidatePath[i + 1];
            enhanced.push(a);
            
            // Add curved intermediate points between each segment
            const midLat = (a[0] + b[0]) / 2;
            const midLng = (a[1] + b[1]) / 2;
            const perpLat = (b[1] - a[1]) * 0.3; // perpendicular offset
            const perpLng = -(b[0] - a[0]) * 0.3;
            // Use deterministic curve magnitude based on index for consistent results
            const curveMagnitude = (Math.sin(i * 0.8) * 0.5) * 0.0004; // deterministic curve
            
            enhanced.push([
                midLat + perpLat * curveMagnitude,
                midLng + perpLng * curveMagnitude
            ]);
        }
        enhanced.push(candidatePath[candidatePath.length - 1]);
        
        let roadPath = await osrmSnap(enhanced);
        
        // Guarantee at least two coordinates for rendering/snapping fallback
        if (!roadPath || roadPath.length < 2) {
            roadPath = enhanced;
        }
        
        // Keep within previous 24-routes' overall area if available
        if (lastAIBounds) roadPath = clampPathToBounds(roadPath, lastAIBounds, 12);
        
        // Small nudge for realism but don't move routes too far apart (deterministic)
        const nudgeNorth = 55; // Fixed 55m north for deterministic results
        const nudgeWest = 70;  // Fixed 70m west for deterministic results
        roadPath = shiftPathByMeters(roadPath, nudgeNorth, nudgeWest);
        
        if (lastAIBounds) roadPath = clampPathToBounds(roadPath, lastAIBounds, 12);
        
        // Light smoothing to maintain organic curves
        const smooth = chaikinSmoothClosed(roadPath, 1);
        rawPaths.push(smooth);
    }

    // Enforce separation with multi-iteration soft repulsion to keep routes distinct
    function enforceMinSeparationOnAll(paths, minMeters = 200, iterations = 6) {
        const toRad = (deg) => deg * Math.PI / 180;
        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
        const distMeters = (a,b)=>{
            const R=6371000; const dLat=toRad(b[0]-a[0]); const dLng=toRad(b[1]-a[1]);
            const lat1=toRad(a[0]); const lat2=toRad(b[0]);
            const h=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(h));
        };
        const adjusted = paths.map(p=>p.map(pt=>[pt[0],pt[1]]));
        // Precompute centroids for directional bias
        const centroids = adjusted.map(path => {
            const s = path.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]);
            return [s[0]/path.length, s[1]/path.length];
        });
        for (let it = 0; it < iterations; it++) {
            for (let k=0;k<adjusted.length;k++){
                for (let i=0;i<adjusted[k].length;i++){ // examine all points for strong separation
                    const p = adjusted[k][i];
                    let nearest=null; let nd=Infinity; let nearestOwner=-1; let nearestIndex=-1;
                    for (let j=0;j<adjusted.length;j++) if (j!==k){
                        const other = adjusted[j];
                        for (let t=0;t<other.length;t+=2){
                            const d = distMeters(p, other[t]);
                            if (d < nd){ nd=d; nearest=other[t]; nearestOwner=j; nearestIndex=t; }
                        }
                    }
                    if (nearest && nd < minMeters){
                        const midLat = (p[0]+nearest[0])/2;
                        const latScale = 111320; const lngScale = 111320 * Math.cos(toRad(midLat));
                        // vector from nearest to this point
                        let vLatM = (p[0]-nearest[0]) * latScale;
                        let vLngM = (p[1]-nearest[1]) * lngScale;
                        // If nearly colinear, bias away from the other route centroid
                        const mag = Math.hypot(vLatM, vLngM);
                        if (mag < 1e-3) {
                            vLatM = (centroids[k][0]-centroids[nearestOwner][0]) * latScale;
                            vLngM = (centroids[k][1]-centroids[nearestOwner][1]) * lngScale;
                        }
                        const len = Math.max(1e-6, Math.hypot(vLatM, vLngM));
                        const need = (minMeters - nd) * 0.85; // stronger push
                        const shiftLat = metersToLat((vLatM/len)*need);
                        const shiftLng = metersToLng((vLngM/len)*need, midLat);
                        adjusted[k][i] = [p[0] + shiftLat, p[1] + shiftLng];
                    }
                }
            }
        }
        // Final light smooth for natural look
        return adjusted.map(path=> chaikinSmoothClosed(path, 1));
    }

    // Ensure entire routes (centroids) are well separated to avoid stacking
    function enforceCentroidSeparation(paths, minCentroidMeters = 500, iterations = 4) {
        const toRad = (deg) => deg * Math.PI / 180;
        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
        const distMeters = (a,b)=>{
            const R=6371000; const dLat=toRad(b[0]-a[0]); const dLng=toRad(b[1]-a[1]);
            const lat1=toRad(a[0]); const lat2=toRad(b[0]);
            const h=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(h));
        };
        let adjusted = paths.map(p=>p.map(pt=>[pt[0],pt[1]]));
        for (let it=0; it<iterations; it++) {
            // recompute centroids
            const cents = adjusted.map(path => {
                const s = path.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]);
                return [s[0]/path.length, s[1]/path.length];
            });
            // pairwise pushes
            for (let i=0;i<cents.length;i++){
                for (let j=i+1;j<cents.length;j++){
                    const a=cents[i], b=cents[j];
                    const d=distMeters(a,b);
                    if (d < minCentroidMeters) {
                        const midLat = (a[0]+b[0])/2;
                        const latScale = 111320; const lngScale = 111320 * Math.cos(toRad(midLat));
                        let vLatM = (a[0]-b[0]) * latScale;
                        let vLngM = (a[1]-b[1]) * lngScale;
                        const len = Math.max(1e-6, Math.hypot(vLatM, vLngM));
                        const need = (minCentroidMeters - d) / 2; // split push between both
                        const sLat = metersToLat((vLatM/len)*need);
                        const sLng = metersToLng((vLngM/len)*need, midLat);
                        // push i by +shift, j by -shift
                        adjusted[i] = adjusted[i].map(([la,ln]) => [la + sLat, ln + sLng]);
                        adjusted[j] = adjusted[j].map(([la,ln]) => [la - sLat, ln - sLng]);
                    }
                }
            }
        }
        return adjusted;
    }

    const separatedPaths = enforceMinSeparationOnAll(rawPaths, 200, 6);
    const centroidSeparated = enforceCentroidSeparation(separatedPaths, 600, 4);

    // Helper: move path centroid toward a rectangle center
    function movePathCentroidToRect(path, rect) {
        if (!path || !rect) return path;
        const c = path.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]).map(v=>v/path.length);
        const rc = [(rect.minLat + rect.maxLat)/2, (rect.minLng + rect.maxLng)/2];
        const toRad = (deg) => deg * Math.PI / 180;
        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
        const latScale = 111320; const lngScale = 111320 * Math.cos(toRad((c[0]+rc[0])/2));
        const dLatM = (rc[0] - c[0]) * latScale;
        const dLngM = (rc[1] - c[1]) * lngScale;
        // move 85% toward rect center to avoid hugging borders
        const shiftLat = metersToLat(dLatM * 0.85);
        const shiftLng = metersToLng(dLngM * 0.85, (c[0]+rc[0])/2);
        return path.map(([la,ln]) => [la + shiftLat, ln + shiftLng]);
    }

    // Distribute each route into its quadrant to guarantee map-wide separation
    let rectAdjusted = centroidSeparated;
    if (rects && rects.length === 4) {
        rectAdjusted = centroidSeparated.map((p, idx) => {
            let moved = movePathCentroidToRect(p, rects[idx]);
            moved = softKeepInsideRect(moved, rects[idx], 20); // keep routes more centered in quadrants
            return moved;
        });
    } else {
        // If no quadrants defined, create a simple 2x2 grid layout
        console.log('📐 Creating simple 2x2 grid layout for routes');
        const centerLat = 38.736946, centerLng = -9.142685;
        const spanLat = 0.02, spanLng = 0.03;
        
        rectAdjusted = centroidSeparated.map((p, idx) => {
            const gridRow = Math.floor(idx / 2);
            const gridCol = idx % 2;
            const targetLat = centerLat + (gridRow - 0.5) * spanLat * 0.8;
            const targetLng = centerLng + (gridCol - 0.5) * spanLng * 0.8;
            
            // Move route to target grid position
            const currentCenter = p.reduce((a, pt) => [a[0] + pt[0], a[1] + pt[1]], [0, 0]).map(v => v / p.length);
            const dLat = targetLat - currentCenter[0];
            const dLng = targetLng - currentCenter[1];
            
            return p.map(([lat, lng]) => [lat + dLat, lng + dLng]);
        });
    }

    // Expand each route within its quadrant with consistent scaling for similar appearance
    function expandPathWithinRect(path, rect, fillLatFrac = 1.0, fillLngFrac = 1.0) {
        if (!path || !rect || path.length < 2) return path;
        let latMin = Infinity, latMax = -Infinity, lngMin = Infinity, lngMax = -Infinity;
        path.forEach(([la,ln])=>{ latMin=Math.min(latMin,la); latMax=Math.max(latMax,la); lngMin=Math.min(lngMin,ln); lngMax=Math.max(lngMax,ln); });
        const latSpan = Math.max(1e-9, latMax - latMin);
        const lngSpan = Math.max(1e-9, lngMax - lngMin);
        const targetLatSpan = (rect.maxLat - rect.minLat) * fillLatFrac;
        const targetLngSpan = (rect.maxLng - rect.minLng) * fillLngFrac;
        
        // Use consistent scaling for all routes - prefer uniform expansion
        const avgTargetSpan = (targetLatSpan + targetLngSpan) / 2;
        const avgCurrentSpan = (latSpan + lngSpan) / 2;
        const uniformScale = Math.max(4.5, avgTargetSpan / avgCurrentSpan); // Much bigger uniform scaling
        
        const cLat = path.reduce((a,p)=>a+p[0],0)/path.length;
        const cLng = path.reduce((a,p)=>a+p[1],0)/path.length;
        const scaled = path.map(([la,ln])=>[ cLat + (la-cLat)*uniformScale, cLng + (ln-cLng)*uniformScale ]);
        return clampPathToRectMeters(scaled, rect, 2);
    }

    let sizedPaths = rectAdjusted;
    if (rects) {
        sizedPaths = rectAdjusted.map((p, idx) => expandPathWithinRect(p, rects[idx], 1.0, 1.0));
    }

    // Keep within bounds after separation
    const finalPaths = sizedPaths.map(p => lastAIBounds ? clampPathToBounds(p, lastAIBounds, 1) : p);

    // Ensure each route has at least two distinct points so it renders
    function ensureRenderablePath(path, rect) {
        const toRad = (deg) => deg * Math.PI / 180;
        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
        if (!path || path.length === 0) {
            if (!rect) return [];
            const cy = (rect.minLat + rect.maxLat) / 2;
            const cx = (rect.minLng + rect.maxLng) / 2;
            const off = metersToLng(20, cy); // ~20m
            return [[cy, cx], [cy, cx + off]];
        }
        // dedupe consecutive identical points
        const out = [];
        for (const pt of path) {
            const last = out[out.length - 1];
            if (!last || Math.abs(last[0]-pt[0])>1e-7 || Math.abs(last[1]-pt[1])>1e-7) out.push(pt);
        }
        if (out.length >= 2) return out;
        const base = out[0] || path[0];
        const cy = base[0];
        const cx = base[1];
        const off = metersToLng(20, cy);
        return [[cy, cx], [cy, cx + off]];
    }

    const ensuredPaths = finalPaths.map((p, idx) => ensureRenderablePath(p, rects ? rects[idx] : null));
    
    // Force exactly 4 routes - create robust fallback if any missing
    for (let k=0;k<K;k++){
        let coords = ensuredPaths[k];
        if (!coords || coords.length < 2) {
            console.warn(`Route ${names[k]} has insufficient coordinates, creating robust fallback`);
            const rect = rects ? rects[k] : null;
            if (rect) {
                const cy = (rect.minLat + rect.maxLat) / 2;
                const cx = (rect.minLng + rect.maxLng) / 2;
                const latSpan = rect.maxLat - rect.minLat;
                const lngSpan = rect.maxLng - rect.minLng;
                // Create a consistent fallback route with similar density and appearance
                const numPoints = 12; // Consistent with target density
                coords = [];
                const radiusLat = latSpan * 0.3;
                const radiusLng = lngSpan * 0.3;
                
                for (let i = 0; i < numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    const lat = cy + Math.cos(angle) * radiusLat;
                    const lng = cx + Math.sin(angle) * radiusLng;
                    coords.push([lat, lng]);
                }
                coords.push(coords[0]); // Close the loop
            } else {
                                    // More robust fallback coordinates with different pentagon shapes
                    const fallbacks = [
                        createStretchedPentagon(38.750, -9.22, 0.008, 0.012, 0),
                        createStretchedPentagon(38.765, -9.12, 0.008, 0.012, 1),
                        createStretchedPentagon(38.735, -9.25, 0.008, 0.012, 2),
                        createStretchedPentagon(38.720, -9.15, 0.008, 0.012, 3)
                    ];
                    coords = fallbacks[k] || fallbacks[0];
            }
        }
        
        // Ensure we have valid coordinates
        if (!coords || coords.length < 2) {
            console.error(`Failed to create valid route ${names[k]}, using emergency fallback`);
            coords = [[38.7350 + k * 0.01, -9.1500 - k * 0.01], [38.7351 + k * 0.01, -9.1501 - k * 0.01]];
        }
        
        console.log(`Route ${names[k]}: ${coords.length} coordinates ready`);
        resSnapped.push({ name: names[k], color: colors[k], coords });
    }
    
    console.log(`Final result: ${resSnapped.length} routes created (${resSnapped.map(r => r.name).join(', ')})`);
    return resSnapped;
}

function renderOptimizedRoutesOnAI(mergedRoutes) {
    console.log('🎯 renderOptimizedRoutesOnAI called with:', mergedRoutes);
    
    // Ensure we have valid input
    if (!mergedRoutes || !Array.isArray(mergedRoutes)) {
        console.error('❌ Invalid input to renderOptimizedRoutesOnAI:', mergedRoutes);
        return;
    }
    
    // Ensure map is available
    if (!map) {
        console.error('❌ Map not available for rendering optimized routes');
        return;
    }
    
    console.log('🗺️ Clearing existing routes and rendering optimized routes...');
    
    // Chaikin smoothing for soft edges
    function chaikinSmoothClosedLocal(points, iterations = 1) {
        if (!Array.isArray(points) || points.length < 3) return points;
        let p = points.slice();
        for (let it = 0; it < iterations; it++) {
            const out = [];
            for (let i = 0; i < p.length - 1; i++) {
                const a = p[i], b = p[i + 1];
                out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
                out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
            }
            out.push(out[0]);
            p = out;
        }
        return p;
    }

    // Centripetal Catmull–Rom spline on a closed loop (Google-like smoothness)
    function catmullRomClosed(points, samplesPerSeg = 10) {
        if (!Array.isArray(points) || points.length < 3) return points;
        const isClosed = Math.abs(points[0][0] - points[points.length - 1][0]) < 1e-12 && Math.abs(points[0][1] - points[points.length - 1][1]) < 1e-12;
        const base = isClosed ? points.slice(0, -1) : points.slice();
        const n = base.length;
        const out = [];
        const cr = (t, p0, p1, p2, p3) => {
            const t2 = t * t, t3 = t2 * t;
            return [
                0.5 * (2*p1[0] + (-p0[0] + p2[0]) * t + (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0]) * t2 + (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0]) * t3),
                0.5 * (2*p1[1] + (-p0[1] + p2[1]) * t + (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1]) * t2 + (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1]) * t3)
            ];
        };
        for (let i = 0; i < n; i++) {
            const p0 = base[(i - 1 + n) % n];
            const p1 = base[i];
            const p2 = base[(i + 1) % n];
            const p3 = base[(i + 2) % n];
            for (let s = 0; s < samplesPerSeg; s++) {
                const t = s / samplesPerSeg;
                out.push(cr(t, p0, p1, p2, p3));
            }
        }
        out.push(out[0]);
        return out;
    }

    // Build natural-looking path with smooth curves and organic shape for 10x larger routes
    function buildNaturalPath(points) {
        if (!Array.isArray(points) || points.length < 3) return points;
        const toRad = (deg) => deg * Math.PI / 180;
        
        // Create a more organic, natural-looking path with smooth curves
        const spline = catmullRomClosed(points, 15);
        const smoothed = chaikinSmoothClosedLocal(spline, 2);
        
        // Add natural variations and organic curves (deterministic for stable routes)
        const out = [];
        for (let i = 0; i < smoothed.length; i++) {
            const p = smoothed[i];
            const lat = p[0];
            const latScale = 111320;
            const lngScale = 111320 * Math.cos(toRad(lat));
            
            // Add deterministic curve variations for stable routes
            const curveVariation = 2.5; // Increased for 10x larger routes
            // Use deterministic values based on position and index for consistent results
            const jLat = (Math.sin(i * 0.5) * 0.5) * (curveVariation / latScale);
            const jLng = (Math.cos(i * 0.7) * 0.5) * (curveVariation / lngScale);
            
            out.push([lat + jLat, p[1] + jLng]);
        }
        
        // Ensure closed loop
        out[out.length - 1] = out[0];
        return out;
    }

    // Clear existing layers
    routeLayers.forEach(layer => {
        try { map.removeLayer(layer.polyline); } catch(e) {}
        (layer.markers || []).forEach(m => { try { map.removeLayer(m);} catch(e) {} });
    });
    routeLayers = [];

    console.log(`Rendering ${mergedRoutes.length} optimized routes:`, mergedRoutes.map(r => `${r.name}(${r.coords.length} pts)`));
    console.log('🎯 All routes will have different pentagon shapes and be positioned further apart');
    
    // Ensure we always render exactly 4 routes
    if (mergedRoutes.length !== 4) {
        console.error(`Expected 4 routes but got ${mergedRoutes.length}. Creating missing routes.`);
        const names = ['A', 'B', 'C', 'D'];
        const missingRoutes = [];
        
        for (let i = 0; i < 4; i++) {
            if (!mergedRoutes[i]) {
                // Create consistent emergency fallback with different pentagon shapes
                const baseLat = 38.7200 + i * 0.030; // Further increased spacing between routes
                const baseLng = -9.1500 - i * 0.030; // Further increased spacing between routes
                const latSpan = 0.008, lngSpan = 0.012; // Consistent size
                
                // Create different pentagon shapes (similar to main routes)
                const fallbackCoords = createStretchedPentagon(baseLat, baseLng, latSpan, lngSpan, i);
                missingRoutes.push({
                    name: names[i],
                    color: '#DC3545',
                    coords: fallbackCoords
                });
                console.warn(`Created emergency fallback for route ${names[i]}`);
            }
        }
        
        // Add missing routes to the array
        mergedRoutes = [...mergedRoutes, ...missingRoutes].slice(0, 4);
    }

    // Calculate global center of all routes to shift them closer to each other
    const allCoords = mergedRoutes.flatMap(r => r.coords);
    let minLatAll = Infinity, maxLatAll = -Infinity, minLngAll = Infinity, maxLngAll = -Infinity;
    if (allCoords.length > 0) {
        allCoords.forEach(([lat, lng]) => {
            minLatAll = Math.min(minLatAll, lat);
            maxLatAll = Math.max(maxLatAll, lat);
            minLngAll = Math.min(minLngAll, lng);
            maxLngAll = Math.max(maxLngAll, lng);
        });
    }
    const globalCenter = [(minLatAll + maxLatAll) / 2, (minLngAll + maxLngAll) / 2];
    const getCenterOfPolygon = (coords) => {
        if (!coords || coords.length < 2) return [0, 0];
        const center = coords.slice(0, -1).reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
        return [center[0] / (coords.length - 1), center[1] / (coords.length - 1)];
    };

    // Calculate average spans for consistent route sizing
    const avgLatSpan = 0.01; // Fixed span for consistent route sizes
    const avgLngSpan = 0.015;
    
    mergedRoutes.forEach((r, idx) => {
        // Build custom polygon path similar to the screenshot
        let naturalCoords = buildCustomPolygonPath(r.coords, idx, avgLatSpan, avgLngSpan);
        
        // Shift all routes equally from the global center for uniform spacing
        const routeCenter = getCenterOfPolygon(naturalCoords);
        const shiftFactor = -0.2; // All routes pushed 20% away from global center for equal spacing
        const dLat = (globalCenter[0] - routeCenter[0]) * shiftFactor;
        const dLng = (globalCenter[1] - routeCenter[1]) * shiftFactor;
        
        // Additional shifts for routes C and D (indices 2 and 3)
        let additionalLatShift = 0;
        if (idx === 2) {
            // Route C: shift higher (north) on Y axis
            additionalLatShift = 0.01;
        } else if (idx === 3) {
            // Route D: shift higher (north) but slightly lower than C
            additionalLatShift = 0.01 - 0.003; // Higher than original but lower than C
        }
        
        if (allCoords.length > 0) {
            naturalCoords = naturalCoords.map(([lat, lng]) => [lat + dLat + additionalLatShift, lng + dLng]);
        }

        // All optimized routes are blue
        const color = '#2563eb';
        const polyline = L.polyline(naturalCoords, { color, weight: 6, opacity: 1.0, lineJoin: 'round', lineCap: 'round' }).addTo(map);
        const start = naturalCoords[0];
        const iconHtml = `
            <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#fff;border:2px solid #2563eb;">
                <div style="color:#2563eb;font-weight:700;font-size:12px;">${r.name}</div>
            </div>`;
        const idIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [24,24], iconAnchor: [12,12] });
        const idMarker = L.marker([start[0], start[1]], { icon: idIcon }).addTo(map);
        const markers = [idMarker];
        
        // Add click event to marker to switch timeline to this route
        idMarker.on('click', () => {
            const route = { name: r.name, id: r.name };
            setFocus(r.name);
            showTimelinePanel(route);
        });
        
        // Add click event to polyline to switch timeline to this route
        polyline.on('click', () => {
            const route = { name: r.name, id: r.name };
            setFocus(r.name);
            showTimelinePanel(route);
        });
        
        // Create evenly spaced points along the route in clockwise order
        const numPoints = 8; // Total number of markers (1 route ID + 7 positions)
        const pointsForDots = [];
        
        // Add starting point
        pointsForDots.push(naturalCoords[0]);
        
        // Add evenly spaced points along the route
        for (let i = 1; i < numPoints; i++) {
            const t = i / (numPoints - 1);
            const index = Math.floor(t * (naturalCoords.length - 1));
            const nextIndex = Math.min(index + 1, naturalCoords.length - 1);
            const progress = t * (naturalCoords.length - 1) - index;
            
            const p1 = naturalCoords[index];
            const p2 = naturalCoords[nextIndex];
            const lat = p1[0] + (p2[0] - p1[0]) * progress;
            const lng = p1[1] + (p2[1] - p1[1]) * progress;
            
            pointsForDots.push([lat, lng]);
        }

        pointsForDots.forEach((pt, index) => {
            if (Math.abs(pt[0] - start[0]) < 1e-6 && Math.abs(pt[1] - start[1]) < 1e-6) return;
            
            // Create position marker with number
            let markerText;
            if (index === 0) {
                markerText = r.name; // First marker shows route ID (A, B, C, D)
            } else {
                // Number positions sequentially along the route
                markerText = (index).toString(); // Position numbers (1, 2, 3, 4, 5, 6, 7)
            }
            
            console.log(`🎯 Creating marker for Route ${r.name}, Position ${index}: ${markerText} at [${pt[0]}, ${pt[1]}]`);
            
            const positionMarker = L.marker(pt, {
                icon: L.divIcon({
                    className: 'position-marker',
                    html: `
                        <div class="position-dot" data-route="${r.name}" data-index="${index}" style="width: 24px; height: 24px; border-radius: 50%; background: #2563eb; border: 2px solid #1d4ed8; box-shadow: 0 0 0 2px #ffffff; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                            <div class="position-number" style="color: #ffffff; font-weight: 700; font-size: 12px; line-height: 1; user-select: none;">${markerText}</div>
                        </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(map);
            
            // Add click event to show position in timeline
            positionMarker.on('click', () => {
                console.log(`📍 Marker clicked: Route ${r.name}, Position ${index + 1}`);
                
                // Open timeline for this route
                const route = { name: r.name, id: r.name };
                setFocus(r.name);
                showTimelinePanel(route);
                
                // Highlight the specific position in timeline
                setTimeout(() => {
                    highlightTimelinePosition(index);
                }, 100);
                
                // Show popup with position info
                const popupContent = `
                    <div class="text-center">
                        <div class="font-bold text-lg">Position ${markerText}</div>
                        <div class="text-sm text-gray-600">Route ${r.name}</div>
                        <div class="text-xs text-gray-500 mt-1">Click to view in timeline</div>
                    </div>
                `;
                positionMarker.bindPopup(popupContent).openPopup();
            });
            
            // Add hover effect
            positionMarker.on('mouseover', () => {
                positionMarker.getElement()?.querySelector('.position-number')?.classList.add('hover');
            });
            
            positionMarker.on('mouseout', () => {
                positionMarker.getElement()?.querySelector('.position-number')?.classList.remove('hover');
            });
            
            markers.push(positionMarker);
        });

        routeLayers.push({ polyline, markers, id: r.name, color });
        console.log(`🎯 Route ${r.name} added to routeLayers with ${markers.length} markers`);
    });
    
    console.log(`🎯 Total routeLayers created:`, routeLayers.length);
    console.log(`🎯 routeLayers details:`, routeLayers.map(l => ({ id: l.id, markersCount: l.markers.length })));
    
    const group = L.featureGroup(routeLayers.map(l=>l.polyline));
    if (lastAIBounds) {
        map.fitBounds(lastAIBounds, { padding: [20,20] });
    } else {
        map.fitBounds(group.getBounds(), { padding: [20,20] });
    }

    // Internal route lines removed per request to keep only outer route shapes

    // Expose output as GeoJSON-like objects
    window.optimizedGeoJSON = {};
    mergedRoutes.forEach((r, idx) => {
        const color = '#2563eb'; // All optimized routes are blue
        window.optimizedGeoJSON[r.name] = { type:'Feature', properties:{ id:r.name, color }, geometry:{ type:'LineString', coordinates: r.coords.map(([lat,lng])=>[lng,lat]) } };
    });
    
    console.log(`✅ Successfully rendered ${routeLayers.length} optimized routes on the map`);
    console.log('🎯 Routes created:', routeLayers.map(l => l.id));
    console.log('🎯 Internal route lines removed as requested; only perimeter routes are rendered');
    console.log('🎯 Position markers numbered and clickable for timeline navigation');
    console.log('🎯 Route spacing optimized: All routes have uniform distance, route C is highest, route D is slightly lower than C');
    console.log('🎯 Timeline updated with project styling - route selector in header, improved card design');
    console.log('🎯 Routes are now deterministic and will not change on refresh');
}

// Helper function to create different pentagon coordinates for fallback routes
// This ensures all routes have unique pentagon shapes to avoid touching
function createStretchedPentagon(centerLat, centerLng, latSpan, lngSpan, routeIndex) {
    const minLat = centerLat - latSpan/2;
    const maxLat = centerLat + latSpan/2;
    const minLng = centerLng - lngSpan/2;
    const maxLng = centerLng + lngSpan/2;
    
    switch (routeIndex % 4) {
        case 0: // Acute-angled pentagon pointing up (гострокутний)
            return createStretchedPentagonUp(minLat, maxLat, minLng, maxLng, centerLat, centerLng);
        case 1: // Obtuse-angled pentagon pointing right (тупокутний)
            return createStretchedPentagonRight(minLat, maxLat, minLng, maxLng, centerLat, centerLng);
        case 2: // Irregular pentagon pointing down (неправильний)
            return createStretchedPentagonDown(minLat, maxLat, minLng, maxLng, centerLat, centerLng);
        case 3: // Star-like pentagon pointing left (зіркоподібний)
            return createStretchedPentagonLeft(minLat, maxLat, minLng, maxLng, centerLat, centerLng);
        default:
            return createStretchedPentagonUp(minLat, maxLat, minLng, maxLng, centerLat, centerLng);
    }
}

// Create acute-angled pentagon pointing up (route A) - гострокутний 5-кутник
function createStretchedPentagonUp(minLat, maxLat, minLng, maxLng, centerLat, centerLng) {
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    
    // Acute-angled pentagon pointing up: sharp top vertex, acute angles
    const points = [
        [centerLat + latSpan * 0.6, centerLng],                    // Sharp top vertex
        [centerLat + latSpan * 0.1, centerLng - lngSpan * 0.5],   // Top-left (acute angle)
        [centerLat - latSpan * 0.4, centerLng - lngSpan * 0.2],   // Bottom-left (acute angle)
        [centerLat - latSpan * 0.4, centerLng + lngSpan * 0.2],   // Bottom-right (acute angle)
        [centerLat + latSpan * 0.1, centerLng + lngSpan * 0.5],   // Top-right (acute angle)
        [centerLat + latSpan * 0.6, centerLng]                    // Close the loop
    ];
    
    return points;
}

// Create obtuse-angled pentagon pointing right (route B) - тупокутний 5-кутник
function createStretchedPentagonRight(minLat, maxLat, minLng, maxLng, centerLat, centerLng) {
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    
    // Obtuse-angled pentagon pointing right: wide right vertex, obtuse angles
    const points = [
        [centerLat, centerLng + lngSpan * 0.6],                    // Wide right vertex
        [centerLat + latSpan * 0.4, centerLng + lngSpan * 0.1],   // Top-right (obtuse angle)
        [centerLat + latSpan * 0.2, centerLng - lngSpan * 0.3],   // Top-left (obtuse angle)
        [centerLat - latSpan * 0.2, centerLng - lngSpan * 0.3],   // Bottom-left (obtuse angle)
        [centerLat - latSpan * 0.4, centerLng + lngSpan * 0.1],   // Bottom-right (obtuse angle)
        [centerLat, centerLng + lngSpan * 0.6]                    // Close the loop
    ];
    
    return points;
}

// Create irregular pentagon pointing down (route C) - неправильний 5-кутник
function createStretchedPentagonDown(minLat, maxLat, minLng, maxLng, centerLat, centerLng) {
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    
    // Irregular pentagon pointing down: asymmetric shape
    const points = [
        [centerLat - latSpan * 0.6, centerLng],                    // Bottom vertex
        [centerLat - latSpan * 0.3, centerLng + lngSpan * 0.4],   // Bottom-right
        [centerLat + latSpan * 0.2, centerLng + lngSpan * 0.3],   // Top-right
        [centerLat + latSpan * 0.4, centerLng - lngSpan * 0.1],   // Top-left
        [centerLat - latSpan * 0.1, centerLng - lngSpan * 0.4],   // Bottom-left
        [centerLat - latSpan * 0.6, centerLng]                    // Close the loop
    ];
    
    return points;
}

// Create star-like pentagon pointing left (route D) - зіркоподібний 5-кутник
function createStretchedPentagonLeft(minLat, maxLat, minLng, maxLng, centerLat, centerLng) {
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    
    // Star-like pentagon pointing left: concave shape
    const points = [
        [centerLat, centerLng - lngSpan * 0.6],                    // Left vertex
        [centerLat - latSpan * 0.2, centerLng - lngSpan * 0.2],   // Bottom-left
        [centerLat - latSpan * 0.4, centerLng + lngSpan * 0.1],   // Bottom-right
        [centerLat + latSpan * 0.3, centerLng + lngSpan * 0.3],   // Top-right
        [centerLat + latSpan * 0.3, centerLng - lngSpan * 0.3],   // Top-left
        [centerLat, centerLng - lngSpan * 0.6]                    // Close the loop
    ];
    
    return points;
}

// Build different pentagon routes for all 4 optimized routes
// Each route gets a unique pentagon shape and positioned further apart
function buildCustomPolygonPath(coords, shapeIndex, fixedLatSpan, fixedLngSpan) {
    if (!coords || coords.length < 1) return [[38.75, -9.15], [38.74, -9.16], [38.74, -9.14], [38.75, -9.15]]; // fallback

    // Use the center of the original coords for positioning
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    coords.forEach(([lat, lng]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
    });
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Use fixed spans for uniform size, scale by sqrt(3) for ~3x area increase
    const scale = 1.732; 
    const sLatSpan = fixedLatSpan * scale;
    const sLngSpan = fixedLngSpan * scale;
    
    const sMinLat = centerLat - sLatSpan / 2;
    const sMaxLat = centerLat + sLatSpan / 2;
    const sMinLng = centerLng - sLngSpan / 2;
    const sMaxLng = centerLng + sLngSpan / 2;
    
    const sCenterLat = (sMinLat + sMaxLat) / 2;
    const sCenterLng = (sMinLng + sMaxLng) / 2;

    // Create different pentagon routes - each route gets a unique shape
    let vertices = [];
    
    switch (shapeIndex % 4) {
        case 0: // Acute-angled pentagon pointing up (гострокутний)
            vertices = createStretchedPentagonUp(sMinLat, sMaxLat, sMinLng, sMaxLng, sCenterLat, sCenterLng);
            break;
        case 1: // Obtuse-angled pentagon pointing right (тупокутний)
            vertices = createStretchedPentagonRight(sMinLat, sMaxLat, sMinLng, sMaxLng, sCenterLat, sCenterLng);
            break;
        case 2: // Irregular pentagon pointing down (неправильний)
            vertices = createStretchedPentagonDown(sMinLat, sMaxLat, sMinLng, sMaxLng, sCenterLat, sCenterLng);
            break;
        case 3: // Star-like pentagon pointing left (зіркоподібний)
            vertices = createStretchedPentagonLeft(sMinLat, sMaxLat, sMinLng, sMaxLng, sCenterLat, sCenterLng);
            break;
    }
    
    return vertices;
}

// Build perimeter points for each route
// This function creates the outer boundary of each route
// It generates a rectangular perimeter that fits within the given rectangle bounds
// The perimeter is used to define the outer shape of each route
// This function is called when building the main route outline
// The points and options parameters are available for future enhancements
// The function returns a closed loop of coordinates that define the route boundary
// This function is essential for creating the main route structure
// The perimeter provides the foundation for route visualization and interaction
// The function handles edge cases gracefully by returning empty array for invalid input
// The function is designed for extensibility and future enhancements
// The function provides a robust foundation for route creation and management
// The function ensures reliable and consistent route boundary creation
// The function calculates the center point and dimensions of the given rectangle
// The center point serves as the reference for positioning the perimeter
// The dimensions determine the size and proportions of the perimeter
// The perimeter is created as a closed loop with 5 points (4 corners + closing point)
// The inset factor of 0.4 creates a buffer zone around each route
// This ensures routes don't touch the outer edges of their bounding rectangles
// The clockwise ordering provides consistent route orientation
// The function is robust and handles various input scenarios gracefully
// The function provides a solid foundation for all route-related operations
function buildPerimeterPoints(rect, points, options) {
    if (!rect) return [];
    
    const centerLat = (rect.minLat + rect.maxLat) / 2;
    const centerLng = (rect.minLng + rect.maxLng) / 2;
    const latSpan = rect.maxLat - rect.minLat;
    const lngSpan = rect.maxLng - rect.minLng;
    
    // Create a perimeter loop around the rectangle
    // The perimeter is inset by 40% from the edges to create a smaller inner boundary
    // This ensures the route doesn't touch the outer edges of the rectangle
    // The inset creates a buffer zone around each route
    // The 0.4 factor provides a good balance between route size and spacing
    // The perimeter is created in clockwise order starting from top-left
    // The closed loop ensures the route forms a complete boundary
    // The clockwise order provides consistent route orientation
    // The inset perimeter creates visually appealing route boundaries
    // The inset perimeter ensures optimal spacing between adjacent routes
    // The inset perimeter creates a balanced and visually appealing route layout
    // The inset perimeter ensures optimal visual balance and route spacing
    const perimeter = [
        [centerLat + latSpan * 0.4, centerLng - lngSpan * 0.4], // Top-left
        [centerLat + latSpan * 0.4, centerLng + lngSpan * 0.4], // Top-right
        [centerLat - latSpan * 0.4, centerLng + lngSpan * 0.4], // Bottom-right
        [centerLat - latSpan * 0.4, centerLng - lngSpan * 0.4], // Bottom-left
        [centerLat + latSpan * 0.4, centerLng - lngSpan * 0.4]  // Close loop
    ];
    
    return perimeter;
}

// Helper function to get default route data if stopsDataAll is unavailable
function getDefaultRouteData(routeName) {
    const defaultData = {
        'A': { 
            name: 'Route A - North District', 
            stops: [
                { id: 1, eta: "08:00", addr: "North Warehouse", lat: 38.725, lon: -9.150 },
                { id: 2, eta: "08:15", addr: "North Delivery Point 1", lat: 38.730, lon: -9.155 },
                { id: 3, eta: "08:30", addr: "North Delivery Point 2", lat: 38.735, lon: -9.160 },
                { id: 4, eta: "08:45", addr: "North Delivery Point 3", lat: 38.740, lon: -9.165 },
                { id: 5, eta: "09:00", addr: "North Warehouse", lat: 38.725, lon: -9.150 }
            ] 
        },
        'B': { 
            name: 'Route B - East District', 
            stops: [
                { id: 1, eta: "09:00", addr: "East Warehouse", lat: 38.720, lon: -9.140 },
                { id: 2, eta: "09:15", addr: "East Delivery Point 1", lat: 38.715, lon: -9.135 },
                { id: 3, eta: "09:30", addr: "East Delivery Point 2", lat: 38.710, lon: -9.130 },
                { id: 4, eta: "09:45", addr: "East Delivery Point 3", lat: 38.705, lon: -9.125 },
                { id: 5, eta: "10:00", addr: "East Warehouse", lat: 38.720, lon: -9.140 }
            ] 
        },
        'C': { 
            name: 'Route C - South District', 
            stops: [
                { id: 1, eta: "10:00", addr: "South Warehouse", lat: 38.700, lon: -9.150 },
                { id: 2, eta: "10:15", addr: "South Delivery Point 1", lat: 38.695, lon: -9.155 },
                { id: 3, eta: "10:30", addr: "South Delivery Point 2", lat: 38.690, lon: -9.160 },
                { id: 4, eta: "10:45", addr: "South Delivery Point 3", lat: 38.685, lon: -9.165 },
                { id: 5, eta: "11:00", addr: "South Warehouse", lat: 38.700, lon: -9.150 }
            ] 
        },
        'D': { 
            name: 'Route D - West District', 
            stops: [
                { id: 1, eta: "11:00", addr: "West Warehouse", lat: 38.720, lon: -9.170 },
                { id: 2, eta: "11:15", addr: "West Delivery Point 1", lat: 38.725, lon: -9.175 },
                { id: 3, eta: "11:30", addr: "West Delivery Point 2", lat: 38.730, lon: -9.180 },
                { id: 4, eta: "11:45", addr: "West Delivery Point 3", lat: 38.735, lon: -9.185 },
                { id: 5, eta: "12:00", addr: "West Warehouse", lat: 38.720, lon: -9.170 }
            ] 
        }
    };
    return defaultData[routeName] || defaultData['A'];
}

// Calculate route distance from stops data
function calculateRouteDistanceFromStops(stops) {
    if (stops.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
        const stop1 = stops[i];
        const stop2 = stops[i + 1];
        totalDistance += calculateDistance(stop1.lat, stop1.lon, stop2.lat, stop2.lon);
    }
    
    return Math.round(totalDistance);
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Get district name for route
function getDistrictName(routeName) {
    const districts = {
        'A': 'North District',
        'B': 'East District', 
        'C': 'South District',
        'D': 'West District'
    };
    return districts[routeName] || 'Unknown District';
}

// Function to update statistics cards with optimized values
// Note: After optimization, some values should be smaller (better), others should be larger (better)
// - Smaller is better: Total Distance, Distance per Stop, CO2 Total
// - Larger is better: Success Rate, Cold-Chain Compliance, Window Accuracy
function updateStatisticsCards(isOptimized) {
    console.log(`📊 Updating statistics cards, isOptimized: ${isOptimized}`);
    console.log('🔍 Function called from:', new Error().stack);
    
    // Find all statistics cards
    let statsContainer = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-6.gap-4.mb-6');
    
    // Try alternative selectors if the first one doesn't work
    if (!statsContainer) {
        statsContainer = document.querySelector('.grid.grid-cols-2');
        console.log('🔍 Trying alternative selector .grid.grid-cols-2');
    }
    
    if (!statsContainer) {
        statsContainer = document.querySelector('[class*="grid-cols-6"]');
        console.log('🔍 Trying alternative selector [class*="grid-cols-6"]');
    }
    
    if (!statsContainer) {
        console.warn('❌ Statistics container not found');
        console.log('🔍 Available containers:', document.querySelectorAll('.grid'));
        console.log('🔍 All elements with grid class:', document.querySelectorAll('[class*="grid"]'));
        console.log('🔍 All elements with grid-cols-6:', document.querySelectorAll('[class*="grid-cols-6"]'));
        return;
    }
    
    let cards = statsContainer.querySelectorAll('.kpi-card');
    
    // If no kpi-card elements found, try to find cards by their structure
    if (cards.length === 0) {
        cards = statsContainer.querySelectorAll('.bg-white.border.border-gray-200.rounded-lg.p-4.shadow-sm');
        console.log('🔍 Trying alternative card selector');
    }
    
    if (cards.length === 0) {
        console.warn('❌ Statistics cards not found');
        console.log('🔍 Container HTML:', statsContainer.innerHTML);
        console.log('🔍 All elements in container:', statsContainer.querySelectorAll('*'));
        return;
    }
    
    console.log(`📊 Found ${cards.length} statistics cards`);
    console.log('🔍 First card:', cards[0]);
    
    if (isOptimized) {
        // Update with optimized (better) values
        console.log('🚀 Updating cards with optimized values...');
        
        // Card 1: Total Distance - reduce by 15% (smaller is better)
        const distanceCard = cards[0];
        if (distanceCard) {
            const distanceValue = distanceCard.querySelector('.text-3xl');
            if (distanceValue) {
                const currentDistance = 120;
                const optimizedDistance = Math.round(currentDistance * 0.85); // 15% reduction
                const optimizationAmount = currentDistance - optimizedDistance;
                distanceValue.innerHTML = `<span class="kpi-main-value">${optimizedDistance} Km</span>`;
                
                // Remove existing pill if any
                const existingPill = distanceCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
                
                // Create new pill next to the value
                const pill = document.createElement('span');
                pill.className = 'kpi-optimization-pill';
                pill.textContent = `-${optimizationAmount} Km`;
                
                // Insert pill after the value
                distanceValue.appendChild(pill);
                
                console.log(`📊 Total Distance: ${currentDistance} → ${optimizedDistance} Km (saved ${optimizationAmount} Km)`);
            }
        }
        
        // Card 2: Distance per Stop - reduce by 20% (smaller is better)
        const distancePerStopCard = cards[1];
        if (distancePerStopCard) {
            const distancePerStopValue = distancePerStopCard.querySelector('.text-3xl');
            if (distancePerStopValue) {
                const currentDistancePerStop = 4.0;
                const optimizedDistancePerStop = (currentDistancePerStop * 0.8).toFixed(1); // 20% reduction
                const optimizationAmount = (currentDistancePerStop - optimizedDistancePerStop).toFixed(1);
                distancePerStopValue.innerHTML = `<span class="kpi-main-value">${optimizedDistancePerStop} Km</span>`;
                
                // Remove existing pill if any
                const existingPill = distancePerStopCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
                
                // Create new pill next to the value
                const pill = document.createElement('span');
                pill.textContent = `-${optimizationAmount} Km`;
                pill.className = 'kpi-optimization-pill';
                
                // Insert pill after the value
                distancePerStopValue.appendChild(pill);
                
                console.log(`📊 Distance per Stop: ${currentDistancePerStop} → ${optimizedDistancePerStop} Km (saved ${optimizationAmount} Km)`);
            }
        }
        
        // Card 3: Success Rate - increase by 5% (larger is better)
        const successRateCard = cards[2];
        if (successRateCard) {
            const successRateValue = successRateCard.querySelector('.text-3xl');
            if (successRateValue) {
                const currentSuccessRate = 92;
                const optimizedSuccessRate = Math.min(100, currentSuccessRate + 5); // 5% increase, max 100%
                const optimizationAmount = optimizedSuccessRate - currentSuccessRate;
                successRateValue.innerHTML = `<span class="kpi-main-value">${optimizedSuccessRate} %</span>`;
                
                // Remove existing pill if any
                const existingPill = successRateCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
                
                // Create new pill next to the value
                const pill = document.createElement('span');
                pill.textContent = `+${optimizationAmount} %`;
                pill.className = 'kpi-optimization-pill';
                
                // Insert pill after the value
                successRateValue.appendChild(pill);
                
                console.log(`📊 Success Rate: ${currentSuccessRate} → ${optimizedSuccessRate} % (improved +${optimizationAmount} %)`);
            }
        }
        
        // Card 4: CO2 Total - reduce by 25% (smaller is better)
        const co2Card = cards[3];
        if (co2Card) {
            const co2Value = co2Card.querySelector('.text-3xl');
            if (co2Value) {
                const currentCO2 = 34;
                const optimizedCO2 = Math.round(currentCO2 * 0.75); // 25% reduction
                const optimizationAmount = currentCO2 - optimizedCO2;
                co2Value.innerHTML = `<span class="kpi-main-value">${optimizedCO2} kg</span>`;
                
                // Remove existing pill if any
                const existingPill = co2Card.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
                
                // Create new pill next to the value
                const pill = document.createElement('span');
                pill.textContent = `-${optimizationAmount} kg`;
                pill.className = 'kpi-optimization-pill';
                
                // Insert pill after the value
                co2Value.appendChild(pill);
                
                console.log(`📊 CO2 Total: ${currentCO2} → ${optimizedCO2} kg (saved ${optimizationAmount} kg)`);
            }
        }
        
        // Card 5: Cold-Chain Compliance - increase by 2% (larger is better)
        const coldChainCard = cards[4];
        if (coldChainCard) {
            const coldChainValue = coldChainCard.querySelector('.text-3xl');
            if (coldChainValue) {
                const currentColdChain = 96.3;
                const optimizedColdChain = Math.min(100, currentColdChain + 2).toFixed(1); // 2% increase, max 100%
                const optimizationAmount = (optimizedColdChain - currentColdChain).toFixed(1);
                coldChainValue.innerHTML = `<span class="kpi-main-value">${optimizedColdChain} %</span>`;
                
                // Remove existing pill if any
                const existingPill = coldChainCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
                
                // Create new pill next to the value
                const pill = document.createElement('span');
                pill.textContent = `+${optimizationAmount} %`;
                pill.className = 'kpi-optimization-pill';
                
                // Insert pill after the value
                coldChainValue.appendChild(pill);
                
                console.log(`📊 Cold-Chain Compliance: ${currentColdChain} → ${optimizedColdChain} % (improved +${optimizationAmount} %)`);
            }
        }
        
        // Card 6: Window Accuracy - increase by 3% (larger is better)
        const windowAccuracyCard = cards[5];
        if (windowAccuracyCard) {
            const windowAccuracyValue = windowAccuracyCard.querySelector('.text-3xl');
            if (windowAccuracyValue) {
                const currentWindowAccuracy = 93.4;
                const optimizedWindowAccuracy = Math.min(100, currentWindowAccuracy + 3).toFixed(1); // 3% increase, max 100%
                const optimizationAmount = (optimizedWindowAccuracy - currentWindowAccuracy).toFixed(1);
                windowAccuracyValue.innerHTML = `<span class="kpi-main-value">${optimizedWindowAccuracy} %</span>`;
                
                // Remove existing pill if any
                const existingPill = windowAccuracyCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
                
                // Create new pill next to the value
                const pill = document.createElement('span');
                pill.textContent = `+${optimizationAmount} %`;
                pill.className = 'kpi-optimization-pill';
                
                // Insert pill after the value
                windowAccuracyValue.appendChild(pill);
                
                console.log(`📊 Window Accuracy: ${currentWindowAccuracy} → ${optimizedWindowAccuracy} % (improved +${optimizationAmount} %)`);
            }
        }
        
        console.log('✅ All statistics cards updated with optimized values');
        
        // Add visual feedback - optimization animation
        cards.forEach(card => {
            card.classList.add('kpi-card-optimized');
            setTimeout(() => {
                card.classList.remove('kpi-card-optimized');
            }, 600);
        });
        
    } else {
        // Reset to original values
        console.log('🔄 Resetting cards to original values...');
        
        // Card 1: Total Distance
        const distanceCard = cards[0];
        if (distanceCard) {
            const distanceValue = distanceCard.querySelector('.text-3xl');
            if (distanceValue) {
                distanceValue.textContent = '120 Km';
                // Remove optimization pill
                const existingPill = distanceCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
            }
        }
        
        // Card 2: Distance per Stop
        const distancePerStopCard = cards[1];
        if (distancePerStopCard) {
            const distancePerStopValue = distancePerStopCard.querySelector('.text-3xl');
            if (distancePerStopValue) {
                distancePerStopValue.textContent = '4.0 Km';
                // Remove optimization pill
                const existingPill = distancePerStopCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
            }
        }
        
        // Card 3: Success Rate
        const successRateCard = cards[2];
        if (successRateCard) {
            const successRateValue = successRateCard.querySelector('.text-3xl');
            if (successRateValue) {
                successRateValue.textContent = '92 %';
                // Remove optimization pill
                const existingPill = successRateCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
            }
        }
        
        // Card 4: CO2 Total
        const co2Card = cards[3];
        if (co2Card) {
            const co2Value = co2Card.querySelector('.text-3xl');
            if (co2Value) {
                co2Value.textContent = '34 kg';
                // Remove optimization pill
                const existingPill = co2Card.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
            }
        }
        
        // Card 5: Cold-Chain Compliance
        const coldChainCard = cards[4];
        if (coldChainCard) {
            const coldChainValue = coldChainCard.querySelector('.text-3xl');
            if (coldChainValue) {
                coldChainValue.textContent = '96.3 %';
                // Remove optimization pill
                const existingPill = coldChainCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
            }
        }
        
        // Card 6: Window Accuracy
        const windowAccuracyCard = cards[5];
        if (windowAccuracyCard) {
            const windowAccuracyValue = windowAccuracyCard.querySelector('.text-3xl');
            if (windowAccuracyValue) {
                windowAccuracyValue.textContent = '93.4 %';
                // Remove optimization pill
                const existingPill = windowAccuracyCard.querySelector('.kpi-optimization-pill');
                if (existingPill) existingPill.remove();
            }
        }
        
        console.log('✅ All statistics cards reset to original values');
    }
}
