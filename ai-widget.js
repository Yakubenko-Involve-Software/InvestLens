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
        const rects = quadrantsFromBounds(lastAIBounds, 0.0); // no padding: same total area
        const colors = ['#28A745', '#0D6EFD', '#FFC107', '#DC3545'];
        const ids = ['A', 'B', 'C', 'D'];

        function pointInRect([lat, lng], r) {
            return lat >= r.minLat && lat <= r.maxLat && lng >= r.minLng && lng <= r.maxLng;
        }

        function rectBoundaryPoints(r, inset = 0.0008) {
            const a = [r.maxLat - inset, r.minLng + inset]; // NW
            const b = [r.maxLat - inset, r.maxLng - inset]; // NE
            const c = [r.minLat + inset, r.maxLng - inset]; // SE
            const d = [r.minLat + inset, r.minLng + inset]; // SW
            // include midpoints as soft anchors
            const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            const bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
            const cd = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2];
            const da = [(d[0] + a[0]) / 2, (d[1] + a[1]) / 2];
            // return 8 anchors (no explicit closing point)
            return [a, ab, b, bc, c, cd, d, da];
        }

        function rectCenter(r) {
            return [(r.minLat + r.maxLat) / 2, (r.minLng + r.maxLng) / 2];
        }

        function angleFromCenter(pt, center) {
            return Math.atan2(pt[0] - center[0], pt[1] - center[1]);
        }

        // Chaikin smoothing for a more realistic route shape
        function smoothClosedPathChaikin(points, iterations = 2) {
            let pts = points.slice();
            for (let it = 0; it < iterations; it++) {
                const out = [];
                for (let i = 0; i < pts.length; i++) {
                    const p0 = pts[i];
                    const p1 = pts[(i + 1) % pts.length];
                    const q = [0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]];
                    const r = [0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]];
                    out.push(q, r);
                }
                pts = out;
            }
            return pts;
        }

        function ensureClosedPath(points, epsilon = 1e-9) {
            if (!points || points.length === 0) return points;
            const first = points[0];
            const last = points[points.length - 1];
            const dLat = Math.abs(first[0] - last[0]);
            const dLng = Math.abs(first[1] - last[1]);
            if (dLat > epsilon || dLng > epsilon) {
                return [...points, [first[0], first[1]]];
            }
            return points;
        }

        // Helpers to create a natural-looking outer-perimeter path that hugs the rectangle edges
        function seededRandFactory(seed) {
            let s = seed;
            return () => {
                s = Math.sin(s) * 10000;
                return s - Math.floor(s);
            };
        }

        function buildNaturalPerimeter(rect, inset, seed) {
            const rand = seededRandFactory(seed);
            const topY = rect.maxLat - inset;
            const bottomY = rect.minLat + inset;
            const leftX = rect.minLng + inset;
            const rightX = rect.maxLng - inset;

            const latSpan = rect.maxLat - rect.minLat;
            const lngSpan = rect.maxLng - rect.minLng;
            const ampLat = Math.min(latSpan * 0.008, inset * 0.8);
            const ampLng = Math.min(lngSpan * 0.008, inset * 0.8);

            const topSteps = 14, rightSteps = 14, bottomSteps = 14, leftSteps = 14;
            const topPhase = rand() * Math.PI * 2, rightPhase = rand() * Math.PI * 2, bottomPhase = rand() * Math.PI * 2, leftPhase = rand() * Math.PI * 2;
            const topFreq = 1.5 + rand() * 1.2, rightFreq = 1.5 + rand() * 1.2, bottomFreq = 1.5 + rand() * 1.2, leftFreq = 1.5 + rand() * 1.2;

            const pts = [];
            // Top edge: left -> right
            for (let i = 0; i <= topSteps; i++) {
                const t = i / topSteps;
                const x = leftX + (rightX - leftX) * t;
                const y = topY - ampLat * Math.sin(topPhase + topFreq * t);
                pts.push([y, x]);
            }
            // Right edge: top -> bottom
            for (let i = 1; i <= rightSteps; i++) {
                const t = i / rightSteps;
                const y = topY - (topY - bottomY) * t;
                const x = rightX - ampLng * Math.sin(rightPhase + rightFreq * t);
                pts.push([y, x]);
            }
            // Bottom edge: right -> left
            for (let i = 1; i <= bottomSteps; i++) {
                const t = i / bottomSteps;
                const x = rightX - (rightX - leftX) * t;
                const y = bottomY + ampLat * Math.sin(bottomPhase + bottomFreq * t);
                pts.push([y, x]);
            }
            // Left edge: bottom -> top
            for (let i = 1; i < leftSteps; i++) {
                const t = i / leftSteps;
                const y = bottomY + (topY - bottomY) * t;
                const x = leftX + ampLng * Math.sin(leftPhase + leftFreq * t);
                pts.push([y, x]);
            }
            return pts;
        }

        // Distance helpers & conversions
        const toRad = (deg) => deg * Math.PI / 180;
        const haversineMeters = (a, b) => {
            const R = 6371000; // meters
            const dLat = toRad(b[0] - a[0]);
            const dLng = toRad(b[1] - a[1]);
            const lat1 = toRad(a[0]);
            const lat2 = toRad(b[0]);
            const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
            return 2 * R * Math.asin(Math.sqrt(h));
        };
        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));

        // Build convex hull of points and inset toward centroid; densify to ~80–150m spacing
        function buildPerimeterPoints(rect, points, opts = {}) {
            // Tunables for inset and spacing
            const insetMin = opts.insetMinM ?? 20;
            const insetMax = opts.insetMaxM ?? 35;
            const stepMin = opts.stepMinM ?? 80;
            const stepMax = opts.stepMaxM ?? 150;
            const varianceMin = opts.varianceMin ?? 0.2; // 20%
            const varianceMax = opts.varianceMax ?? 0.6; // 60%

            // Small inset to stay on streets near the outer boundary while preserving area location
            const insetM = insetMin + Math.random() * (insetMax - insetMin);
            const insetLat = metersToLat(insetM);
            const insetLng = metersToLng(insetM, (rect.minLat + rect.maxLat) / 2);

            let base = (points && points.length >= 3) ? points : [
                [rect.maxLat - insetLat, rect.minLng + insetLng],
                [rect.maxLat - insetLat, rect.maxLng - insetLng],
                [rect.minLat + insetLat, rect.maxLng - insetLng],
                [rect.minLat + insetLat, rect.minLng + insetLng]
            ];

            const hull = (function convexHullLatLng(pts) {
                if (!pts || pts.length <= 3) return pts.slice();
                const arr = pts.map(([la, ln]) => ({ x: ln, y: la, ll: [la, ln] }))
                               .sort((a,b)=> a.x===b.x ? a.y-b.y : a.x-b.x);
                const cross = (o,a,b)=> (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
                const lower=[]; for(const p of arr){ while(lower.length>=2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop(); lower.push(p);} 
                const upper=[]; for(let i=arr.length-1;i>=0;i--){ const p=arr[i]; while(upper.length>=2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop(); upper.push(p);} 
                const h=lower.concat(upper.slice(1,-1));
                return h.map(p=>p.ll);
            })(base);

            const centroid = hull.reduce((acc,p)=>[acc[0]+p[0], acc[1]+p[1]],[0,0]).map(v=>v/hull.length);
            const inset = hull.map(([lat,lng])=>{
                const dy = lat - centroid[0];
                const dx = lng - centroid[1];
                const len = Math.sqrt(dy*dy + dx*dx) || 1e-6;
                return [lat - insetLat * (dy/len), lng - insetLng * (dx/len)];
            });

            const densified = [];
            for (let i=0;i<inset.length;i++){
                const a = inset[i];
                const b = inset[(i+1)%inset.length];
                const segLen = haversineMeters(a,b);
                let step = stepMin + Math.random()*(stepMax - stepMin);
                const variance = varianceMin + Math.random()*(varianceMax - varianceMin);
                step *= (1 - variance);
                const steps = Math.max(1, Math.floor(segLen/step));
                for(let s=0;s<steps;s++){
                    const t = s/steps;
                    densified.push([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]);
                }
            }
            densified.push(densified[0]);
            return densified;
        }

        async function osrmSnapLoop(points) {
            const maxPerReq = 20;
            const chunks = [];
            for(let i=0;i<points.length;i+=maxPerReq-1){
                const slice = points.slice(i, Math.min(points.length, i+maxPerReq));
                if (i>0) slice.unshift(points[i-1]);
                chunks.push(slice);
            }
            const allCoords = [];
            for (const ch of chunks){
                const coordStr = ch.map(p=> `${p[1].toFixed(6)},${p[0].toFixed(6)}`).join(';');
                const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&continue_straight=true&alternatives=false`;
                try{
                    const res = await fetch(url);
                    const json = await res.json();
                    const coords = json?.routes?.[0]?.geometry?.coordinates || [];
                    coords.forEach(([lng,lat])=> allCoords.push([lat,lng]));
                }catch(e){
                    ch.forEach(p=> allCoords.push([p[0],p[1]]));
                }
            }
            const simplified = [];
            for(const p of allCoords){
                const last = simplified[simplified.length-1];
                if (!last || Math.abs(last[0]-p[0])>1e-6 || Math.abs(last[1]-p[1])>1e-6){
                    simplified.push(p);
                }
            }
            return simplified;
        }

        function clampPathToRectMeters(path, rect, padM) {
            const padLat = metersToLat(padM);
            const padLng = metersToLng(padM, (rect.minLat + rect.maxLat) / 2);
            return path.map(([la, ln]) => [
                Math.min(Math.max(la, rect.minLat + padLat), rect.maxLat - padLat),
                Math.min(Math.max(ln, rect.minLng + padLng), rect.maxLng - padLng)
            ]);
        }

        function fitBoundsIfShrunk(path, rect, scaleCap = 1.12) {
            // If snapped path shrank too much, nudge points outward linearly toward rect edges
            let latMin = Infinity, latMax = -Infinity, lngMin = Infinity, lngMax = -Infinity;
            path.forEach(([la,ln]) => { latMin = Math.min(latMin, la); latMax = Math.max(latMax, la); lngMin = Math.min(lngMin, ln); lngMax = Math.max(lngMax, ln); });
            const latSpan = latMax - latMin; const lngSpan = lngMax - lngMin;
            const targetLatSpan = (rect.maxLat - rect.minLat) * 0.96; // keep ~same area
            const targetLngSpan = (rect.maxLng - rect.minLng) * 0.96;
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
            const options = isAB ? { insetMinM: 12, insetMaxM: 22, stepMinM: 60, stepMaxM: 120, varianceMin: 0.3, varianceMax: 0.6 } : {};
            let ring = buildPerimeterPoints(r, pts, options);
            ring = await osrmSnapLoop(ring);
            // Keep snapped path inside the same quadrant area (with small padding)
            ring = clampPathToRectMeters(ring, r, 12);
            // Expand slightly more for A/B to lengthen perimeter
            ring = fitBoundsIfShrunk(ring, r, isAB ? 1.20 : 1.12);
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
                <div style=\"display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#fff;border:2px solid #2563eb;\">\n                    <div style=\"color:#2563eb;font-weight:700;font-size:12px;\">${ids[idx]}</div>\n                </div>`;
            const idIcon = L.divIcon({ html: idIconHtml, className: '', iconSize: [24,24], iconAnchor: [12,12] });
            const idMarker = L.marker(startLatLng, { icon: idIcon }).addTo(map);

            const markers = [idMarker];
            let accum = 0; let lastPt = finalPath[0];
            for (let vi = 1; vi < finalPath.length; vi++) {
                const pt = finalPath[vi];
                accum += haversineMeters(lastPt, pt);
                if (accum >= 150) {
                    const dot = L.circleMarker(pt, { radius: 4, color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
                    markers.push(dot);
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
            const jitterLat = (Math.random() - 0.5) * rectLatSpan * 0.04;
            const jitterLng = (Math.random() - 0.5) * rectLngSpan * 0.04;
            target = [c[0] + jitterLat, c[1] + jitterLng];
        } else {
            const anchor = landAnchors[anchorIndices[i % anchorIndices.length]];
            const jitterLat = (Math.random() - 0.5) * 0.004;
            const jitterLng = (Math.random() - 0.5) * 0.004;
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
            <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#fff;border:2px solid #2563eb;">
                <div style="color:#2563eb;font-weight:700;font-size:12px;">${getRouteLetter(routeInfo.id)}</div>
            </div>`;
        const idIcon = L.divIcon({ html: idIconHtml, className: '', iconSize: [24,24], iconAnchor: [12,12] });
        const idMarker = L.marker(startLatLng, { icon: idIcon }).addTo(map);

        const vertices = (path.length > 1 && path[0][0] === path[path.length - 1][0] && path[0][1] === path[path.length - 1][1]) ? path.slice(0, -1) : path;
        const markers = [idMarker];
        const step = isOptimized ? Math.ceil(vertices.length / 8) : 1; // fewer dots when optimized
        for (let vi = 0; vi < vertices.length; vi += step) {
            const pt = vertices[vi];
            const dot = L.circleMarker(pt, { radius: 4, color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
            markers.push(dot);
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
        optimizeBtn.textContent = 'Optimize Now!';
        currentToggleState = 'today';
        console.log('✅ Optimize button enabled');
    });

    console.log('✅ Event listeners attached successfully');

    // Initialize with Yesterday selected by default; keep optimize disabled
    console.log('Initializing with Yesterday data and disabled Optimize button...');
    updateToggleState(yesterdayBtn, todayBtn);
    updateOptimizationData(yesterdayData);
    updateOptimizeButton(true); // disabled
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
                isOptimized = true;
                const computePromise = computeAndSnapOptimizedRoutes();
                const delayMs = 5000 + Math.floor(Math.random() * 5001); // 5–10 seconds
                await Promise.all([
                    computePromise,
                    new Promise(resolve => setTimeout(resolve, delayMs))
                ]);

                const merged = await computePromise;
                renderOptimizedRoutesOnAI(merged);

                // Update KPIs with sample improved numbers
                const updates = {
                    'routes-optimised': '18 %',
                    'stops-merged': '9',
                    'calls-scheduled': '1',
                    'time-saved': '54 min',
                    'success-rate': '+8.1 %',
                    'spoilage-risk': '-1.1 %',
                    'efficiency-gain': '18 %',
                    'cost-reduction': '€2,940'
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
                console.error('Optimization failed:', e);
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
 
    function renderTimelineItems(route) {
        if (!timelineContent) return;
        const stops = (stopsData[route.id] || []).slice(0, 12);
        timelineCourier.textContent = route.name || `Courier ${route.id}`;
        timelineContent.innerHTML = stops.map((stop, idx) => {
            const base = 'rounded-lg border p-3';
            const accent = idx === 0 || idx === stops.length - 1 ? 'bg-blue-50 border-blue-200' : (stop.optimised ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200');
            const badge = stop.optimised ? '<span class="ml-2 inline-flex items-center text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Optimised by AI</span>' : '';
            const warn = stop.warning ? `<div class="text-xs text-amber-600 mt-1"><i class="ri-alert-line mr-1"></i>${stop.warning}</div>` : '';
            const placeBadge = stop.type === 'warehouse' ? '<span class="ml-2 inline-flex items-center text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">Warehouse</span>' : '';
            return `
                <div class="${base} ${accent}">
                    <div class="text-sm font-semibold text-gray-900">${stop.eta || stop.time || ''} ${stop.addr || stop.address || 'Stop'}</div>
                    <div class="text-xs text-gray-500 mt-1 flex items-center">${placeBadge}${badge}</div>
                    ${warn}
                </div>
            `;
        }).join('');
    }
 
    function showTimelinePanel(route) {
        if (!resultsView || !timelineView) return;
        renderTimelineItems(route);
        resultsView.classList.add('hidden');
        timelineView.classList.remove('hidden');
        timelineView.classList.add('flex');
    }

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
            const firstRoute = allRoutes && allRoutes.length ? allRoutes[0] : null;
            if (firstRoute) {
                setFocus(firstRoute.id);
                showTimelinePanel(firstRoute);
            } else {
                console.warn('No routes available to show timeline');
            }
        });
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
            <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#fff;border:2px solid #2563eb;">
                <div style="color:#2563eb;font-weight:700;font-size:12px;">${getRouteLetter(r.id)}</div>
            </div>`;
        const idIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [24,24], iconAnchor: [12,12] });
        const idMarker = L.marker(startLatLng, { icon: idIcon }).addTo(map);

        const dots = (path[0][0] === path[path.length-1][0] && path[0][1] === path[path.length-1][1]) ? path.slice(0,-1) : path;
        const markers = [idMarker];
        dots.forEach(pt => {
            const dot = L.circleMarker(pt, { radius: 4, color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
            markers.push(dot);
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

    // 2) K-means (k=4) clustering on lat/lng (simple implementation)
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
    const assign = new Array(points.length).fill(0);
    function dist2(a, b) { const dy = a[0]-b[0], dx = a[1]-b[1]; return dy*dy + dx*dx; }
    for (let iter = 0; iter < 12; iter++) {
        // assign
        for (let i = 0; i < points.length; i++) {
            let best = 0, bd = Infinity;
            for (let k = 0; k < K; k++) { const d = dist2(points[i], centers[k]); if (d < bd) { bd = d; best = k; } }
            assign[i] = best;
        }
        // recompute centers
        const sums = Array.from({length: K}, () => [0,0,0]);
        for (let i = 0; i < points.length; i++) { const k = assign[i]; sums[k][0]+=points[i][0]; sums[k][1]+=points[i][1]; sums[k][2]++; }
        for (let k = 0; k < K; k++) { if (sums[k][2] > 0) centers[k] = [sums[k][0]/sums[k][2], sums[k][1]/sums[k][2]]; }
    }

    // 3) Order points within each cluster by nearest-neighbor tour (simple TSP heuristic)
    function nnOrder(clusterPts, startPoint) {
        if (clusterPts.length <= 2) return clusterPts.slice();
        // choose start as the point closest to the provided start or centroid
        const c = startPoint || clusterPts.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]).map(v=>v/clusterPts.length);
        let start = 0; let best = Infinity;
        for (let i=0;i<clusterPts.length;i++){ const d=dist2(clusterPts[i],c); if(d<best){best=d; start=i;} }
        const used = new Array(clusterPts.length).fill(false);
        const route = []; let cur = start; used[cur]=true; route.push(clusterPts[cur]);
        for (let step=1; step<clusterPts.length; step++){
            let nxt=-1, bd=Infinity;
            for (let j=0;j<clusterPts.length;j++) if(!used[j]){ const d=dist2(clusterPts[cur],clusterPts[j]); if(d<bd){bd=d;nxt=j;} }
            cur=nxt; used[cur]=true; route.push(clusterPts[cur]);
        }
        // close loop to end near start
        route.push(route[0]);
        return route;
    }

    const clusters = Array.from({length: K}, () => []);
    for (let i = 0; i < points.length; i++) clusters[assign[i]].push(points[i]);

    // Ensure all 4 clusters are non-empty by moving nearest points to empty clusters
    function rehydrateEmptyClusters() {
        for (let k = 0; k < K; k++) {
            while (clusters[k].length < 2) {
                // Find a donor cluster with > 2 points
                let donor = -1;
                let bestDist = Infinity;
                let bestIdxInDonor = -1;
                for (let j = 0; j < K; j++) {
                    if (j === k || clusters[j].length <= 2) continue;
                    // Pick the point in donor closest to center k
                    for (let idx = 0; idx < clusters[j].length; idx++) {
                        const d = dist2(clusters[j][idx], centers[k]);
                        if (d < bestDist) { bestDist = d; donor = j; bestIdxInDonor = idx; }
                    }
                }
                if (donor === -1) break; // cannot move more
                const moved = clusters[donor].splice(bestIdxInDonor, 1)[0];
                clusters[k].push(moved);
            }
        }
    }
    rehydrateEmptyClusters();
    // If still not exactly 4 non-empty clusters, split the largest until we have 4
    function ensureFourClusters() {
        let nonEmpty = clusters.filter(c => c.length > 0).length;
        while (nonEmpty < K) {
            // find largest cluster
            let li = clusters.reduce((bestIdx, c, idx, arr) => (arr[idx].length > arr[bestIdx].length ? idx : bestIdx), 0);
            if (clusters[li].length <= 1) break;
            // split by simple alternating pick
            const a = []; const b = [];
            clusters[li].forEach((pt, i) => (i % 2 === 0 ? a : b).push(pt));
            clusters[li] = a;
            const emptyIdx = clusters.findIndex(c => c.length === 0);
            if (emptyIdx !== -1) clusters[emptyIdx] = b; else clusters.push(b);
            nonEmpty = clusters.filter(c => c.length > 0).length;
            if (clusters.length > K) clusters.length = K; // cap
        }
        // remove any accidental empties by moving nearest points
        rehydrateEmptyClusters();
    }
    ensureFourClusters();
    const starts = centers;
    const orderedClusters = clusters.map((pts, idx) => nnOrder(pts, starts[idx]));

    // 4) Snap each cluster path to roads using OSRM and smooth
    // Helpers for bounds clamping to keep final 4 routes in same area as previous 24
    const toRad = (deg) => deg * Math.PI / 180;
    const metersToLat = (m) => m / 111320;
    const metersToLng = (m, atLat) => m / (111320 * Math.cos(toRad(atLat)));
    function clampPathToBounds(path, bounds, padMeters = 12) {
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

    const colors = ['#DC3545','#DC3545','#DC3545','#DC3545']; // all red
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
    function clampPathToRectMeters(path, rect, padMeters = 12) {
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
    const snapped = [];
    for (let k=0;k<K;k++){
        // Prefer standardized template per quadrant to make routes similar
        let candidatePath = (rects && rects[k]) ? buildTemplateLoop(rects[k], k+1) : orderedClusters[k];
        let roadPath = await osrmSnap(candidatePath);
        // Guarantee at least two coordinates for rendering/snapping fallback
        if (!roadPath || roadPath.length < 2) {
            const base = orderedClusters[k];
            if (base && base.length >= 2) {
                roadPath = base;
            } else if (base && base.length === 1) {
                const p = base[0];
                // tiny offset ~15m east
                roadPath = [p, [p[0], p[1] + 15 / (111320 * Math.cos(toRad(p[0])) )]];
            } else {
                // synthesize minimal segment near cluster center
                const c = centers[k];
                const off = 15 / (111320 * Math.cos(toRad(c[0])));
                roadPath = [[c[0], c[1]], [c[0], c[1] + off]];
            }
        }
        // Keep within previous 24-routes' overall area if available
        if (lastAIBounds) roadPath = clampPathToBounds(roadPath, lastAIBounds, 12);
        // Nudge northwest to better reflect routing (stay within bounds/quadrant)
        roadPath = shiftPathByMeters(roadPath, 600, 800); // ~600m north, ~800m west
        if (rects && rects[k]) {
            roadPath = clampPathToRectMeters(roadPath, rects[k], 12);
        } else if (lastAIBounds) {
            roadPath = clampPathToBounds(roadPath, lastAIBounds, 12);
        }
        const smooth = chaikinSmoothClosed(roadPath, 1);
        snapped.push({ name: names[k], color: colors[k], coords: smooth });
    }
    return snapped;
}

function renderOptimizedRoutesOnAI(mergedRoutes) {
    // Clear existing layers
    routeLayers.forEach(layer => {
        try { map.removeLayer(layer.polyline); } catch(e) {}
        (layer.markers || []).forEach(m => { try { map.removeLayer(m);} catch(e) {} });
    });
    routeLayers = [];

    mergedRoutes.forEach(r => {
        // ensure red rendering regardless of input color
        const polyline = L.polyline(r.coords, { color: '#DC3545', weight: 5, opacity: 0.95 }).addTo(map);
        const start = r.coords[0];
        const iconHtml = `
            <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:#fff;border:2px solid #2563eb;">
                <div style="color:#2563eb;font-weight:700;font-size:12px;">${r.name}</div>
            </div>`;
        const idIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [24,24], iconAnchor: [12,12] });
        const idMarker = L.marker([start[0], start[1]], { icon: idIcon }).addTo(map);
        const markers = [idMarker];
        // sparse dots
        const step = Math.max(1, Math.floor(r.coords.length / 18));
        for (let i=0;i<r.coords.length;i+=step){ const pt=r.coords[i]; const dot=L.circleMarker(pt,{radius:4,color:'#fff',weight:2,fillColor:'#DC3545',fillOpacity:1}).addTo(map); markers.push(dot); }
        routeLayers.push({ polyline, markers, id: r.name, color: '#DC3545' });
    });
    const group = L.featureGroup(routeLayers.map(l=>l.polyline));
    if (lastAIBounds) {
        map.fitBounds(lastAIBounds, { padding: [20,20] });
    } else {
        map.fitBounds(group.getBounds(), { padding: [20,20] });
    }

    // Expose output as GeoJSON-like objects
    window.optimizedGeoJSON = {};
    mergedRoutes.forEach(r => {
        window.optimizedGeoJSON[r.name] = { type:'Feature', properties:{ id:r.name, color:'#DC3545' }, geometry:{ type:'LineString', coordinates: r.coords.map(([lat,lng])=>[lng,lat]) } };
    });
}
