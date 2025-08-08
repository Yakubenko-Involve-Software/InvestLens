document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    const navLinks = document.querySelectorAll('aside nav a');

    const loadPage = async (page) => {
        try {
            console.log(`=== Loading page: ${page} ===`);
            
            navLinks.forEach(link => link.classList.remove('bg-blue-600', 'text-white'));
            // Highlight the matching link; if alias used (settings <-> seatings), try both
            let activeLink = document.querySelector(`a[data-page='${page}']`);
            if (!activeLink && page === 'settings') {
                activeLink = document.querySelector("a[data-page='seatings']");
            }
            if (activeLink) {
                activeLink.classList.add('bg-blue-600', 'text-white');
            }

            const html = templates[page];
            if (!html) {
                throw new Error(`Template not found for page: ${page}`);
            }
            
            console.log(`Template found for ${page}, length: ${html.length}`);
            content.innerHTML = html;

            if (page === 'ai-widget') {
                console.log('=== Loading AI Widget page ===');
                setTimeout(() => {
                    console.log('Loading AI widget...');
                    if (typeof initAI === 'function') {
                        initAI();
                        
                        // Check for toggle elements after initialization
                        setTimeout(() => {
                            const toggleElements = {
                                tomorrowBtn: document.getElementById('toggle-tomorrow'),
                                todayBtn: document.getElementById('toggle-today'),
                                optimizeBtn: document.getElementById('optimize-btn')
                            };
                            console.log('Toggle elements after AI init:', toggleElements);
                            
                            // Test functionality availability
                            if (typeof window.testToggleFunctionality === 'function') {
                                console.log('Running toggle functionality test...');
                                window.testToggleFunctionality();
                            }
                        }, 1000);
                        
                        // Additional refresh after a longer delay
                        setTimeout(() => {
                            if (window.aiMap && typeof window.aiMap.invalidateSize === 'function') {
                                console.log('Refreshing AI map size...');
                                window.aiMap.invalidateSize();
                            }
                        }, 300);
                        
                        // Force map refresh one more time
                        setTimeout(() => {
                            if (window.aiMap && typeof window.aiMap.invalidateSize === 'function') {
                                console.log('Final AI map refresh...');
                                window.aiMap.invalidateSize();
                            }
                        }, 1000);
                    } else {
                        console.error('initAI function not found');
                    }
                }, 200); // Increased delay to ensure DOM is ready
            } else if (page === 'orders') {
                await loadOrders();
            } else if (page === 'routes') {
                console.log('=== Loading Routes page ===');
                setTimeout(() => {
                    console.log('Loading routes data...');
                    loadRoutes();
                    console.log('Checking for initRoutesMap function...');
                    if (typeof initRoutesMap === 'function') {
                        console.log('Calling initRoutesMap with data:', allRoutesData);
                        // Ensure the DOM is fully rendered before initializing the map
                        setTimeout(() => {
                            initRoutesMap(allRoutesData);
                            // Additional refresh after a longer delay
                            setTimeout(() => {
                                console.log('Calling refreshRoutesMap...');
                                if (typeof window.refreshRoutesMap === 'function') {
                                    window.refreshRoutesMap();
                                }
                                // Force map refresh one more time
                                if (window.routesMap && typeof window.routesMap.invalidateSize === 'function') {
                                    window.routesMap.invalidateSize();
                                }
                            }, 500);
                        }, 300);
                    } else {
                        console.error('initRoutesMap function not found');
                    }
                }, 100); // Small delay to ensure DOM is ready
            } else if (page === 'live-map') {
                if (typeof initLiveMap === 'function') {
                    initLiveMap();
                } else {
                    console.error('initLiveMap function not found');
                }
            } else if (page === 'settings') {
                // Initialize settings page
                console.log('=== Loading Settings page ===');
                setTimeout(() => {
                    initSettingsPage();
                }, 100);
            } else if (page === 'cold-chain') {
                // Initialize cold chain page
                console.log('=== Loading Cold Chain page ===');
            } else if (page === 'reports') {
                // Initialize reports page
                console.log('=== Loading Reports page ===');
                setTimeout(() => {
                    initReportsPage();
                }, 100);
            }

        } catch (error) {
            content.innerHTML = `<div class="p-6 text-red-500">Error: ${error.message}</div>`;
        }
    };

    navLinks.forEach(link => {
        console.log(`Setting up nav link for: ${link.dataset.page}`);
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const raw = link.dataset.page;
            const page = raw === 'seatings' ? 'settings' : raw; // alias support
            console.log(`Nav link clicked: ${page}`);
            
            loadPage(page);
        });
    });

    loadPage('orders');
});

function getStatusClass(status) {
    switch (status) {
        case 'Packed': return 'bg-yellow-100 text-yellow-800';
        case 'Picking': return 'bg-orange-100 text-orange-800';
        case 'Delivered': return 'bg-green-100 text-green-800';
        case 'In Transit': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getTempClass(temp) {
    switch (temp) {
        case 'COLD': return '';
        case 'FRESH': return '';
        default: return 'text-gray-600';
    }
}

async function loadOrders() {
    const orders = allOrdersData.filter(o => o.temp !== 'AMBIENT');
    const tableBody = document.querySelector('#orders-table tbody');
    const sortableHeaders = document.querySelectorAll('#orders-table th[data-sort-key]');
    const statsContainer = document.getElementById('order-stats-cards');
    
    let state = {
        statusFilter: 'All Statuses',
        sortKey: 'orderId',
        sortAsc: true
    };

    const getStatusTextColor = (status) => 'text-gray-500';

    const render = () => {
        // 1. Render Stats Cards based on state
        const stats = {
            'Total Orders': orders.length,
            'Picking': orders.filter(o => o.status === 'Picking').length,
            'Packed': orders.filter(o => o.status === 'Packed').length,
            'In Transit': orders.filter(o => o.status === 'In Transit').length,
            'Delivered': orders.filter(o => o.status === 'Delivered').length,
        };
        const statusMap = { 'Total Orders': 'All Statuses', 'Picking': 'Picking', 'Packed': 'Packed', 'In Transit': 'In Transit', 'Delivered': 'Delivered' };

        if (statsContainer) {
            statsContainer.innerHTML = Object.entries(stats).map(([key, value]) => {
                const statusValue = statusMap[key];
                const isActive = state.statusFilter === statusValue;
                return `
                    <div class="bg-white p-4 rounded-lg shadow cursor-pointer transition hover:shadow-md ${isActive ? 'ring-2 ring-blue-500' : ''}" data-status="${statusValue}">
                        <p class="text-sm ${getStatusTextColor(key)} font-normal">${key}</p>
                        <p class="text-3xl font-bold text-gray-900 mt-1">${value}</p>
                    </div>
                `;
            }).join('');
            
            statsContainer.querySelectorAll('[data-status]').forEach(card => {
                card.addEventListener('click', () => {
                    state.statusFilter = card.dataset.status;
                    render();
                });
            });
        }

        // 2. Filter and Sort Data based on state
        let processedData = [...orders];
        if (state.statusFilter !== 'All Statuses') {
            processedData = processedData.filter(o => o.status === state.statusFilter);
        }
        processedData.sort((a, b) => {
            let valA = a[state.sortKey];
            let valB = b[state.sortKey];
            if (valA < valB) return state.sortAsc ? -1 : 1;
            if (valA > valB) return state.sortAsc ? 1 : -1;
            return 0;
        });
        
        // 3. Render Table
        if (tableBody) {
            tableBody.innerHTML = processedData.map(order => `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-3 px-12 font-semibold text-blue-600 cursor-pointer hover:underline" onclick="alert('Link to AI timeline for order ${order.orderId}')">${order.orderId}</td>
                    <td class="py-3 px-12">${order.customer}</td>
                    <td class="py-3 px-12 whitespace-nowrap">${order.slot}</td>
                    <td class="py-3 px-12">${order.eta}</td>
                    <td class="py-3 px-12">${order.courier === 'Unassigned' ? '<span class="text-red-500">Unassigned</span>' : order.courier}</td>
                    <td class="py-3 px-12 font-normal capitalize ${getTempClass(order.temp)}">
                        ${order.temp.toLowerCase()}
                    </td>
                    <td class="py-3 px-12">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}">
                            ${order.status}
                        </span>
                    </td>
                    <td class="py-3 px-12 text-right whitespace-nowrap">
                        <button class="text-gray-400 hover:text-blue-600 p-1"><i class="ri-pencil-line"></i></button>
                        <button class="text-gray-400 hover:text-red-600 p-1"><i class="ri-delete-bin-line"></i></button>
                    </td>
                </tr>
            `).join('');
        }

        // 4. Update Sort Icons
        sortableHeaders.forEach(header => {
            const icon = header.querySelector('i');
            if (header.dataset.sortKey === state.sortKey) {
                icon.className = state.sortAsc 
                    ? 'ri-arrow-up-line ml-1 align-middle text-gray-800' 
                    : 'ri-arrow-down-line ml-1 align-middle text-gray-800';
            } else {
                icon.className = 'ri-arrow-up-down-line ml-1 align-middle text-gray-400';
            }
        });
    };

    sortableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sortKey;
            if (state.sortKey === sortKey) {
                state.sortAsc = !state.sortAsc;
            } else {
                state.sortKey = sortKey;
                state.sortAsc = true;
            }
            render();
        });
    });

    render(); // Initial render
}

function loadRoutes() {
    const routes = allRoutesData;
    const tbody = document.querySelector('#routes-table tbody');
    if (!tbody) return;

    const routesWithEta = routes.map(route => {
        const stops = stopsDataAll[route.id];
        const eta_last = stops ? stops[stops.length - 1].eta : 'N/A';
        return { ...route, eta_last };
    });

    let state = {
        sortKey: 'name',
        sortAsc: true
    };

    const renderRoutesTable = () => {
        const sortedRoutes = [...routesWithEta].sort((a, b) => {
            const valA = a[state.sortKey];
            const valB = b[state.sortKey];

            if (typeof valA === 'string') {
                return state.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return state.sortAsc ? valA - valB : valB - valA;
            }
        });

        tbody.innerHTML = sortedRoutes.map(route => `
            <tr class="hover:bg-gray-50 cursor-pointer" onclick="panToRoute('${route.id}')">
                <td class="py-2 px-4 font-semibold text-blue-600">${route.id}</td>
                <td class="py-2 px-4">${route.name}</td>
                <td class="py-2 px-4">${route.stops}</td>
                <td class="py-2 px-4">${route.km}</td>
                <td class="py-2 px-4">${route.eta_last}</td>
                <td class="py-2 px-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${getRiskClass(route.risk)}">
                        ${route.risk}
                    </span>
                </td>
            </tr>
        `).join('');
    };

    const updateSortIcons = () => {
        document.querySelectorAll('#routes-table th[data-sort-key]').forEach(header => {
            const icon = header.querySelector('i');
            if (header.dataset.sortKey === state.sortKey) {
                icon.className = state.sortAsc 
                    ? 'ri-arrow-up-line ml-1 align-middle text-gray-800' 
                    : 'ri-arrow-down-line ml-1 align-middle text-gray-800';
            } else {
                icon.className = 'ri-arrow-up-down-line ml-1 align-middle text-gray-400';
            }
        });
    };

    document.querySelectorAll('#routes-table th[data-sort-key]').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sortKey;
            if (state.sortKey === sortKey) {
                state.sortAsc = !state.sortAsc;
            } else {
                state.sortKey = sortKey;
                state.sortAsc = true;
            }
            renderRoutesTable();
            updateSortIcons();
        });
    });

    renderRoutesTable();
    updateSortIcons();
}

function getRiskClass(risk) {
    switch (risk) {
        case 'High': return 'bg-red-100 text-red-800';
        case 'Med': return 'bg-yellow-100 text-yellow-800';
        case 'Low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function highlightRouteOnMap(routeId) {
    console.log('Highlighting route on map:', routeId);
    if (typeof window.panToRoute === 'function') {
        window.panToRoute(routeId);
    } else if (typeof window.selectRoute === 'function') {
        window.selectRoute(routeId);
    } else {
        console.warn('panToRoute function not available yet');
    }
    
    // Also highlight the row in the table
    const rows = document.querySelectorAll('#routes-table tbody tr');
    rows.forEach(row => {
        row.classList.remove('bg-blue-50', 'border-blue-200');
    });
    
    const targetRow = Array.from(rows).find(row => {
        const firstCell = row.querySelector('td:first-child');
        return firstCell && firstCell.textContent.trim() === routeId;
    });
    
    if (targetRow) {
        targetRow.classList.add('bg-blue-50', 'border-blue-200');
    }
}

function initSettingsPage() {
    console.log('Initializing Settings page...');
    
    // Set timestamp on status indicator
    const timestamp = document.getElementById('settings-timestamp');
    if (timestamp) {
        timestamp.textContent = `(${new Date().toLocaleTimeString()})`;
    }
    
    // Wait a bit more for DOM to be ready
    setTimeout(() => {
        console.log('Setting up Settings page event handlers...');
        
        // Find buttons more specifically
        const allButtons = document.querySelectorAll('#content button');
        console.log('Found buttons:', allButtons.length);
        
        let saveButton = null;
        let cancelButton = null;
        
        allButtons.forEach((button, index) => {
            console.log(`Button ${index}: "${button.textContent.trim()}", classes: ${button.className}`);
            
            if (button.textContent.trim() === 'Save Changes') {
                saveButton = button;
                console.log('Found Save Changes button');
            }
            if (button.textContent.trim() === 'Cancel') {
                cancelButton = button;
                console.log('Found Cancel button');
            }
        });
        
        // Add event listener for Save button
        if (saveButton) {
            console.log('Adding event listener to Save button');
            saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Save button clicked - demo mode');
                
                const originalText = saveButton.textContent;
                const originalClasses = saveButton.className;
                
                saveButton.textContent = 'Saved! (Demo)';
                saveButton.className = saveButton.className.replace('bg-blue-600', 'bg-green-600');
                saveButton.className = saveButton.className.replace('hover:bg-blue-700', 'hover:bg-green-700');
                
                setTimeout(() => {
                    saveButton.textContent = originalText;
                    saveButton.className = originalClasses;
                }, 2000);
            });
        } else {
            console.error('Save button not found!');
        }
        
        // Add event listener for Cancel button  
        if (cancelButton) {
            console.log('Adding event listener to Cancel button');
            cancelButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Cancel button clicked - resetting form values');
                
                // Show feedback
                const originalText = cancelButton.textContent;
                cancelButton.textContent = 'Reset! (Demo)';
                
                setTimeout(() => {
                    cancelButton.textContent = originalText;
                }, 1000);
            });
        } else {
            console.error('Cancel button not found!');
        }
        
        // Add interactive behavior to toggles
        const toggles = document.querySelectorAll('#content input[type="checkbox"]');
        console.log('Found toggles:', toggles.length);
        
        toggles.forEach((toggle, index) => {
            console.log(`Setting up toggle ${index}`);
            toggle.addEventListener('change', (e) => {
                console.log(`Toggle ${index} changed: ${e.target.checked ? 'ON' : 'OFF'} - demo mode`);
            });
        });
        
        // Add interactive behavior to range slider
        const rangeInput = document.querySelector('#content input[type="range"]');
        if (rangeInput) {
            console.log('Found range slider');
            const rangeDisplay = document.querySelector('#content .text-blue-600');
            
            rangeInput.addEventListener('input', (e) => {
                const value = e.target.value;
                if (rangeDisplay) {
                    rangeDisplay.textContent = `${value}%`;
                }
                console.log(`AI Confidence Threshold: ${value}% - demo mode`);
            });
        } else {
            console.log('Range slider not found');
        }
        
        // Add change listeners to inputs for demo feedback
        const inputs = document.querySelectorAll('#content input[type="text"], #content input[type="email"], #content input[type="tel"]');
        console.log('Found form inputs:', inputs.length);
        
        inputs.forEach((input, index) => {
            input.addEventListener('change', (e) => {
                console.log(`Input ${index} changed to: ${e.target.value} - demo mode (changes won't persist)`);
            });
        });
        
        // Add change listeners to selects
        const selects = document.querySelectorAll('#content select');
        console.log('Found selects:', selects.length);
        
        selects.forEach((select, index) => {
            select.addEventListener('change', (e) => {
                console.log(`Select ${index} changed to: ${e.target.value} - demo mode (changes won't persist)`);
            });
        });
        
        console.log('Settings page initialized successfully');
    }, 200);
}

function initReportsPage() {
    console.log('=== Initializing Reports page ===');
    
    // Initialize missed deliveries table
    initMissedDeliveriesTable();
}

function initMissedDeliveriesTable() {
    const tableBody = document.querySelector('#missed-deliveries-table tbody');
    if (!tableBody) {
        console.error('Missed deliveries table body not found');
        return;
    }

    let state = {
        sortKey: 'orderId',
        sortAsc: true
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Rescheduled': return 'bg-yellow-100 text-yellow-800';
            case 'Failed': return 'bg-red-100 text-red-800';
            case 'Reassigned': return 'bg-yellow-100 text-yellow-800';
            case 'Delivered': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const parseMissedBy = (missedBy) => {
        // Convert "2h 15m" or "58m" to minutes for sorting
        const hours = missedBy.match(/(\d+)h/);
        const minutes = missedBy.match(/(\d+)m/);
        let totalMinutes = 0;
        if (hours) totalMinutes += parseInt(hours[1]) * 60;
        if (minutes) totalMinutes += parseInt(minutes[1]);
        return totalMinutes;
    };

    const renderTable = () => {
        // Sort data based on current sort settings
        const sortedData = [...missedDeliveriesData].sort((a, b) => {
            let valA = a[state.sortKey];
            let valB = b[state.sortKey];

            // Handle special cases for sorting
            if (state.sortKey === 'missedBy') {
                valA = parseMissedBy(valA);
                valB = parseMissedBy(valB);
            } else if (state.sortKey === 'orderId') {
                valA = parseInt(valA);
                valB = parseInt(valB);
            } else if (state.sortKey === 'scheduled') {
                // Convert time to minutes for sorting (e.g., "14:30" -> 870 minutes)
                const [hoursA, minutesA] = valA.split(':').map(Number);
                const [hoursB, minutesB] = valB.split(':').map(Number);
                valA = hoursA * 60 + minutesA;
                valB = hoursB * 60 + minutesB;
            }

            if (typeof valA === 'string') {
                return state.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return state.sortAsc ? valA - valB : valB - valA;
            }
        });

        // Render table rows
        tableBody.innerHTML = sortedData.map(delivery => `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-4 font-semibold text-blue-600">#${delivery.orderId}</td>
                <td class="py-3 px-4">${delivery.customer}</td>
                <td class="py-3 px-4">${delivery.courier}</td>
                <td class="py-3 px-4">${delivery.scheduled}</td>
                <td class="py-3 px-4 text-red-600">${delivery.missedBy}</td>
                <td class="py-3 px-4">${delivery.reason}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(delivery.status)}">
                        ${delivery.status}
                    </span>
                </td>
            </tr>
        `).join('');
    };

    const updateSortIcons = () => {
        const headers = document.querySelectorAll('#missed-deliveries-table th[data-sort-key]');
        headers.forEach(header => {
            const icon = header.querySelector('i');
            if (header.dataset.sortKey === state.sortKey) {
                icon.className = state.sortAsc 
                    ? 'ri-arrow-up-line ml-1 align-middle text-gray-800' 
                    : 'ri-arrow-down-line ml-1 align-middle text-gray-800';
            } else {
                icon.className = 'ri-arrow-up-down-line ml-1 align-middle text-gray-400';
            }
        });
    };

    // Add click event listeners to sortable headers
    const sortableHeaders = document.querySelectorAll('#missed-deliveries-table th[data-sort-key]');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortKey;
            if (state.sortKey === sortKey) {
                state.sortAsc = !state.sortAsc;
            } else {
                state.sortKey = sortKey;
                state.sortAsc = true;
            }
            renderTable();
            updateSortIcons();
        });
    });

    // Initial render
    renderTable();
    updateSortIcons();
}
