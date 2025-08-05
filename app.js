document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    const navLinks = document.querySelectorAll('aside nav a');

    const loadPage = async (page) => {
        try {
            navLinks.forEach(link => link.classList.remove('bg-blue-600', 'text-white'));
            const activeLink = document.querySelector(`a[data-page='${page}']`);
            if (activeLink) {
                activeLink.classList.add('bg-blue-600', 'text-white');
            }

            const html = templates[page];
            if (!html) {
                throw new Error(`Template not found for page: ${page}`);
            }
            content.innerHTML = html;

            if (page === 'ai-widget') {
                if (typeof initAI === 'function') {
                    initAI();
                } else {
                    console.error('initAI function not found');
                }
            } else if (page === 'orders') {
                await loadOrders();
            } else if (page === 'routes') {
                setTimeout(() => {
                    loadRoutes();
                    if (typeof initRoutesMap === 'function') {
                        initRoutesMap(allRoutesData);
                    } else {
                        console.error('initRoutesMap function not found');
                    }
                }, 50); // Small delay to ensure DOM is ready
            } else if (page === 'live-map') {
                if (typeof initLiveMap === 'function') {
                    initLiveMap();
                } else {
                    console.error('initLiveMap function not found');
                }
            }

        } catch (error) {
            content.innerHTML = `<div class="p-6 text-red-500">Error: ${error.message}</div>`;
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
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
            <tr class="hover:bg-gray-50 cursor-pointer" onclick="highlightRouteOnMap('${route.id}')">
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
    if (typeof window.selectRoute === 'function') {
        window.selectRoute(routeId);
    } else {
        console.warn('selectRoute function not available yet');
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
