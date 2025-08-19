const templates = {
    'orders': `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Orders</h2>
            <div class="flex items-center space-x-2">
                <button class="bg-blue-600 text-white px-4 py-2 rounded-lg font-normal hover:bg-blue-700 transition">+ New Order</button>
                <button class="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-normal hover:bg-blue-50 transition">Export</button>
            </div>
        </div>

        <div id="order-stats-cards" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <!-- Stats cards will be injected here -->
        </div>

        <div class="bg-white shadow rounded-lg overflow-y-auto" style="max-height: calc(100vh - 320px);">
            <table id="orders-table" class="min-w-full table-fixed">
                <thead class="bg-gray-50 sticky top-0">
                    <tr class="text-left text-gray-500 text-sm">
                        <th class="py-3 px-12 font-normal cursor-pointer hover:text-gray-800 w-2/12" data-sort-key="orderId">Order ID<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                        <th class="py-3 px-12 font-normal w-3/12">Customer</th>
                        <th class="py-3 px-12 font-normal cursor-pointer hover:text-gray-800 w-1/12" data-sort-key="slot">Slot<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                        <th class="py-3 px-12 font-normal cursor-pointer hover:text-gray-800 w-1/12" data-sort-key="eta">ETA<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                        <th class="py-3 px-12 font-normal cursor-pointer hover:text-gray-800 w-1/12" data-sort-key="courier">Courier<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                        <th class="py-3 px-12 font-normal cursor-pointer hover:text-gray-800 w-1/12" data-sort-key="temp">Temp<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                        <th class="py-3 px-12 font-normal cursor-pointer hover:text-gray-800 w-2/12" data-sort-key="status">Status<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                        <th class="py-3 px-12 font-normal text-right w-1/12">Actions</th>
                    </tr>
                </thead>
                <tbody class="text-gray-700"></tbody>
            </table>
        </div>
    `,
    'routes': `
        <h2 class="text-2xl font-bold mb-6">Routes</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p class="text-sm font-medium text-gray-600">Active Routes</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">24</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p class="text-sm font-medium text-gray-600">Total Distance</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">792 km</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p class="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">45 m</p>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p class="text-sm font-medium text-gray-600">Avg Efficiency</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">89%</p>
            </div>
        </div>
        
            <div class="flex gap-6" style="height: calc(100vh - 300px);">
            <!-- Left side - Map -->
            <div class="flex-1 bg-white shadow rounded-lg relative overflow-hidden">
                <div id="routes-map" class="w-full h-full" style="min-height: 500px;"></div>
            </div>
            
            <!-- Right side - Table -->
                <div class="w-1/2">
                <div class="bg-white shadow rounded-lg overflow-hidden h-full flex flex-col">
                    <div class="bg-gray-50 px-4 py-3 border-b flex-shrink-0">
                        <h3 class="text-lg font-semibold text-gray-800">Routes List</h3>
                    </div>
                    <div class="overflow-y-auto flex-1">
                        <table id="routes-table" class="min-w-full">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr class="text-sm text-gray-600">
                                    <th class="py-2 px-3 text-left font-semibold cursor-pointer hover:text-gray-800" data-sort-key="id">ID <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                                    <th class="py-2 px-3 text-left font-semibold cursor-pointer hover:text-gray-800" data-sort-key="name">Courier <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                                    <th class="py-2 px-3 text-left font-semibold cursor-pointer hover:text-gray-800" data-sort-key="stops">Stops <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                                    <th class="py-2 px-3 text-left font-semibold cursor-pointer hover:text-gray-800" data-sort-key="km">Distance km <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                                    <th class="py-2 px-3 text-left font-semibold cursor-pointer hover:text-gray-800" data-sort-key="eta_last">ETA last <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                                    <th class="py-2 px-3 text-left font-semibold cursor-pointer hover:text-gray-800" data-sort-key="risk">Risk <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                                </tr>
                            </thead>
                            <tbody class="text-sm">
                                 <!-- Route data will be injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    'live-map': `
        <div class="flex flex-col h-full" style="height: calc(100vh - 120px);">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Live Map</h2>
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow">
                <div id="live-map-container" class="w-full h-full bg-white shadow rounded-lg lg:col-span-3"></div>
                <div class="lg:col-span-1 flex flex-col gap-4 h-full">
                    <div id="delay-banner" class="bg-orange-100 border border-orange-300 rounded-lg p-4 shadow flex-shrink-0">
                        <div class="flex items-center">
                            <i class="ri-time-line text-orange-600 mr-2"></i>
                            <span class="text-sm font-semibold text-orange-800">Courier L delayed 18 min</span>
                        </div>
                    </div>
                    <div id="live-map-sidebar" class="bg-white shadow rounded-lg flex flex-col flex-grow overflow-hidden">
                    <div class="p-4 border-b flex-shrink-0">
                        <h3 class="text-lg font-bold text-gray-800">Live Fleet</h3>
                        <p class="text-sm text-gray-500">24 active vehicles</p>
                    </div>
                    <div class="flex-grow overflow-y-auto" style="max-height: calc(100vh - 340px);">
                        <table id="live-map-table" class="min-w-full">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr class="text-xs text-left text-gray-500">
                                    <th class="p-2 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="id">
                                        ID <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i>
                                    </th>
                                    <th class="p-2 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="name">
                                        Courier <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i>
                                    </th>
                                    <th class="p-2 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="risk">
                                        Risk <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i>
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="text-sm text-gray-700">
                                <!-- Vehicle data will be injected here -->
                            </tbody>
                        </table>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    'cold-chain': `
        <h2 class="text-2xl font-bold mb-4">Cold Chain Monitoring</h2>
        <div class="bg-white shadow rounded-lg p-6 overflow-y-auto" style="max-height: calc(100vh - 160px);">
            <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div class="flex items-center">
                    <i class="ri-alert-line text-red-600 mr-2"></i>
                    <span class="text-sm font-semibold text-red-800">Critical Alert: Vehicle L - High Spoilage Risk (12.4%)</span>
                </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle A</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">2°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 45%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 0.8%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle B</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">3°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 42%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 1.2%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle C</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Warning</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">6°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 52%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 3.1%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle D</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">1°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 40%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 0.6%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle E</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">4°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 47%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 1.5%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle F</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Warning</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">7°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 55%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 4.2%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle G</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">2°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 43%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 0.9%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle H</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">3°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 46%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 1.0%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle I</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">4°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 44%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 1.3%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle J</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">1°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 41%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 0.7%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle K</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Warning</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">5°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 51%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 2.8%</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-600">Vehicle L</p>
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800">Critical</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mt-1">12°C</p>
                    <p class="text-xs text-gray-500 mt-1">Humidity: 68%</p>
                    <p class="text-xs text-gray-400 mt-1">Spoilage Risk: 12.4%</p>
                </div>
            </div>
        </div>
    `,
    'reports': `
        <div class="flex flex-col h-full" style="height: calc(100vh - 120px);">
            <h2 class="text-2xl font-bold mb-6">Reports</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
            <!-- Orders/hour Chart -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p class="text-sm font-medium text-gray-600">Orders/Hour</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">18.7</p>
                <p class="text-xs text-gray-400 mt-1">Peak: 24</p>
            </div>

            <!-- First-Attempt Success -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p class="text-sm font-medium text-gray-600">First-Attempt Success</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">92.4%</p>
                <p class="text-xs text-gray-400 mt-1">Target: 95%</p>
            </div>

            <!-- Spoilage Rate -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p class="text-sm font-medium text-gray-600">Spoilage Rate</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">1.6%</p>
                <p class="text-xs text-gray-400 mt-1">Threshold: 2%</p>
            </div>

            <!-- Avg Delivery Time -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p class="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">42 m</p>
                <p class="text-xs text-gray-400 mt-1">Target: 45m</p>
            </div>
        </div>

            <!-- Top 20 Missed Table -->
            <div class="bg-white shadow rounded-lg overflow-hidden flex flex-col flex-grow">
                <div class="p-6 border-b flex-shrink-0">
                    <h3 class="text-lg font-semibold text-gray-800">Top 20 Missed Deliveries</h3>
                </div>
                <div class="overflow-y-auto flex-grow">
                <table id="missed-deliveries-table" class="min-w-full">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr class="text-sm text-left text-gray-500">
                            <th class="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="orderId">Order ID <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="customer">Customer <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="courier">Courier <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="scheduled">Scheduled <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="missedBy">Missed By <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="reason">Reason <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800" data-sort-key="status">Status <i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                        </tr>
                    </thead>
                    <tbody class="text-sm text-gray-700">
                        <!-- Missed deliveries data will be injected here -->
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    `,
    'settings': `
        <div class="flex flex-col h-full" style="height: calc(100vh - 120px);">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold">Settings</h2>
                <div class="flex items-center gap-3">
                    <button class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">Cancel</button>
                    <button class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">Save Changes</button>
                </div>
            </div>
            
            <!-- Status Indicator -->
            <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center">
                    <i class="ri-check-line text-green-600 mr-2"></i>
                    <span class="text-sm font-semibold text-green-800">Settings page loaded successfully</span>
                    <span class="ml-2 text-xs text-green-600" id="settings-timestamp"></span>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto auto-rows-auto items-stretch">
                <!-- User Profile Form -->
                <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full flex flex-col min-h-[420px]">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">User Profile</h3>
                    <form class="space-y-4 flex-1">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="João Silva" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input type="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="joao.silva@investlens.pt" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input type="tel" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="+351 912 345 678" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="logistics">Logistics</option>
                                <option value="operations">Operations</option>
                                <option value="management">Management</option>
                                <option value="analytics">Analytics</option>
                            </select>
                        </div>
                        
                        
                    </form>
                    
                </div>

                <!-- Company Settings Form -->
                <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full flex flex-col min-h-[420px]">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Company Settings</h3>
                    <form class="space-y-4 flex-1">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="InvestLens Logistics" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="utc">UTC+0 (Lisbon, London)</option>
                                <option value="cet">CET+1 (Berlin, Paris)</option>
                                <option value="est">EST-5 (New York)</option>
                                <option value="pst">PST-8 (Los Angeles)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="eur">EUR (€)</option>
                                <option value="usd">USD ($)</option>
                                <option value="gbp">GBP (£)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Headquarters Address</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Av. da Liberdade 100, Lisboa" />
                        </div>
                        
                        
                    </form>
                    
                </div>

                <!-- AI & Automation Settings -->
                <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full flex flex-col min-h-[420px]">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">AI & Automation</h3>
                    <form id="ai-auto-apply-form" class="space-y-6 flex-1" onsubmit="return false;">
                        <!-- AI Auto-Apply Toggle (demo only) -->
                        <div class="flex items-center justify-between">
                            <div>
                                <label for="ai-auto-apply-toggle" class="text-sm font-medium text-gray-700">Enable AI auto-apply</label>
                                <p class="text-xs text-gray-500 mt-1">Automatically apply AI route optimizations (demo only, not persisted)</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input id="ai-auto-apply-toggle" type="checkbox" class="sr-only peer" />
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <!-- AI Confidence Threshold -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">AI Confidence Threshold</label>
                            <input type="range" min="50" max="95" value="85" class="w-full h-2 bg-gray-200 rounded-lg cursor-pointer" />
                            <div class="flex justify-between text-xs text-gray-500 mt-1">
                                <span>50%</span>
                                <span class="font-medium text-blue-600">85%</span>
                                <span>95%</span>
                            </div>
                        </div>

                        <!-- Auto-optimize Schedule -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Auto-optimize Schedule</label>
                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="disabled">Disabled</option>
                                <option value="hourly">Every Hour</option>
                                <option value="daily" selected>Daily at 6:00 AM</option>
                                <option value="weekly">Weekly on Monday</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Simulation Mode</label>
                                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option>Off</option>
                                    <option selected>Visual Only</option>
                                    <option>Apply to Sandbox</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Max Daily Auto-applies</label>
                                <input type="number" min="0" max="24" value="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                        
                    </form>
                    
                </div>

                <!-- Notification Settings -->
                <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full flex flex-col min-h-[420px]">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
                    <div class="space-y-4 flex-1">
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Route Updates</label>
                                <p class="text-xs text-gray-500">Get notified about route changes</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked />
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Critical Alerts</label>
                                <p class="text-xs text-gray-500">Emergency notifications for urgent issues</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked />
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Cold Chain Warnings</label>
                                <p class="text-xs text-gray-500">Temperature and spoilage alerts</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" />
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Daily Reports</label>
                                <p class="text-xs text-gray-500">Automated daily performance summaries</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked />
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Digest Frequency</label>
                                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option>Off</option>
                                    <option>Hourly</option>
                                    <option selected>Daily</option>
                                    <option>Weekly</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">SMS Number</label>
                                <input type="tel" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="+351 900 000 000" />
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>

            
        </div>
    `,
    'ai-widget': `
        <div class="flex flex-col h-full">
            <div class="flex-none mb-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">AI Route Optimizer</h2>
                    <button class="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-normal hover:bg-blue-50 transition">Export</button>
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm font-medium text-gray-600">Distance</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1">120</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm font-medium text-gray-600">Km / Stop</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1">4.0</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm font-medium text-gray-600">First-Attempt</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1">92 %</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm font-medium text-gray-600">Spoilage Risk</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1">1.6 %</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm font-medium text-gray-600">Cold-Chain Compliance</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1">96.3 %</p>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm font-medium text-gray-600">Window Accuracy</p>
                    <p class="text-3xl font-bold text-gray-900 mt-1">93.4 %</p>
                </div>
            </div>
            <div class="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6" style="height: calc(100vh - 350px);">
                <div class="lg:col-span-2 flex flex-col gap-4">
                    <div class="bg-white shadow rounded-lg flex flex-col h-full overflow-hidden">
                        <div id="map" class="w-full h-full" style="min-height: 400px; height: 100%; width: 100%;"></div>
                    </div>

                </div>
                <div class="bg-white shadow rounded-lg p-4 flex flex-col h-full">
                <!-- Results view -->
                <div id="results-view" class="flex flex-col h-full">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Optimization Results</h3>
                    </div>
                    <div class="flex bg-gray-100 rounded-lg p-1 mb-4">
                        <button id="toggle-yesterday" class="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-blue-600 text-white transition-colors">Yesterday</button>
                        <button id="toggle-today" class="flex-1 py-2 px-3 text-sm font-medium rounded-md text-gray-600 hover:text-gray-800 transition-colors">Today</button>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-6 flex-grow">
                        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <p class="text-sm font-medium text-gray-700">Routes Optimised</p>
                            <p id="routes-optimised" class="text-2xl font-bold text-blue-600 mt-1">15 %</p>
                        </div>
                        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <p class="text-sm font-medium text-gray-700">Stops Merged</p>
                            <p id="stops-merged" class="text-2xl font-bold text-gray-900 mt-1">7</p>
                        </div>
                        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <p class="text-sm font-medium text-gray-700">Calls Scheduled</p>
                            <p id="calls-scheduled" class="text-2xl font-bold text-gray-900 mt-1">2</p>
                        </div>
                        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <p class="text-sm font-medium text-gray-700">Time Saved</p>
                            <p id="time-saved" class="text-2xl font-bold text-green-600 mt-1">42 min</p>
                        </div>
                        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <p class="text-sm font-medium text-gray-700">Success Rate</p>
                            <p id="success-rate" class="text-2xl font-bold text-green-600 mt-1">+7.2 %</p>
                        </div>
                        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <p class="text-sm font-medium text-gray-700">Spoilage Risk</p>
                            <p id="spoilage-risk" class="text-2xl font-bold text-green-600 mt-1">-0.8 %</p>
                        </div>
                        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <p class="text-sm font-medium text-gray-700">Efficiency Gain</p>
                            <p id="efficiency-gain" class="text-2xl font-bold text-blue-600 mt-1">15 %</p>
                        </div>
                        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                            <p class="text-sm font-medium text-gray-700">Cost Reduction</p>
                            <p id="cost-reduction" class="text-2xl font-bold text-green-600 mt-1">€2,340</p>
                        </div>
                    </div>
                    <!-- Optional inline timeline (kept hidden) -->
                    <div id="optimization-timeline" class="hidden mb-4">
                        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p class="text-sm font-semibold text-gray-800 mb-2">Timeline</p>
                            <ul id="optimization-timeline-list" class="space-y-2 text-sm text-gray-700"></ul>
                        </div>
                    </div>
                    <div class="space-y-3 mt-auto">
                        <button id="optimize-btn" class="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Optimize</button>
                        <button id="timeline-btn" class="w-full border border-blue-600 text-blue-600 px-4 py-3 rounded-lg font-normal hover:bg-blue-50 transition">Timeline</button>
                    </div>
                </div>

                <!-- Timeline view (replaces results view) -->
                <div id="timeline-view" class="hidden flex-col h-full">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-1">
                            <span id="timeline-panel-courier" class="text-base font-semibold text-gray-900">Courier</span>
                        </div>
                        <button id="timeline-close-panel" class="p-2 rounded hover:bg-gray-100" title="Close"><i class="ri-close-line text-xl text-gray-600"></i></button>
                    </div>
                    <div id="timeline-panel-content" class="space-y-3 max-h-[60vh] overflow-y-auto pr-1"></div>
                </div>
            </div>
        </div>
    `
}; 