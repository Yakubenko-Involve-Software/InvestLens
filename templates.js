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

        <div class="bg-white shadow rounded-lg overflow-y-auto" style="max-height: calc(100vh - 260px);">
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
            <div class="flex-1 bg-gray-200 shadow rounded-lg relative">
                <div id="routes-map" class="w-full h-full"></div>
                <!-- Map Legend -->
                <div class="absolute top-4 right-4 bg-white shadow-lg rounded-lg p-3 border border-gray-200" style="z-index: 401;">
                    <h4 class="text-sm font-semibold text-gray-800 mb-2">Route Risk</h4>
                    <div class="space-y-1 text-xs">
                        <div class="flex items-center"><div class="w-3 h-3 mr-2" style="background-color: #DC3545;"></div>High</div>
                        <div class="flex items-center"><div class="w-3 h-3 mr-2" style="background-color: #FFC107;"></div>Medium</div>
                        <div class="flex items-center"><div class="w-3 h-3 mr-2" style="background-color: #28A745;"></div>Low</div>
                    </div>
                </div>
            </div>
            
            <!-- Right side - Table -->
            <div class="w-2/5">
                <div class="bg-white shadow rounded-lg overflow-hidden h-full flex flex-col">
                    <div class="bg-gray-50 px-4 py-3 border-b flex-shrink-0">
                        <h3 class="text-lg font-semibold text-gray-800">Routes List</h3>
                    </div>
                    <div class="overflow-y-auto flex-1">
                        <table id="routes-table" class="min-w-full">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr class="text-sm text-gray-600">
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
        <div class="bg-white shadow rounded-lg p-6">
            <p>Real-time temperature and humidity data for all vehicles will be displayed here.</p>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center justify-between"><h3 class="font-bold">Vehicle A-12</h3><span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span></div>
                    <p class="text-2xl mt-2">2°C</p><p class="text-sm text-gray-500">Humidity: 45%</p>
                </div>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center justify-between"><h3 class="font-bold">Vehicle B-07</h3><span class="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Warning</span></div>
                    <p class="text-2xl mt-2">6°C</p><p class="text-sm text-gray-500">Humidity: 50%</p>
                </div>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center justify-between"><h3 class="font-bold">Vehicle C-03</h3><span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">Optimal</span></div>
                    <p class="text-2xl mt-2">3°C</p><p class="text-sm text-gray-500">Humidity: 48%</p>
                </div>
            </div>
        </div>
    `,
    'reports': `
        <h2 class="text-2xl font-bold mb-4">Reports</h2>
        <div class="bg-white shadow rounded-lg p-6">
            <p>This section will contain various reports.</p>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 rounded-lg p-4"><h3 class="font-bold">Driver Performance</h3><p class="text-sm text-gray-500">Weekly and monthly driver performance metrics.</p><button class="mt-2 text-sm text-blue-500 hover:underline">View Report</button></div>
                <div class="bg-gray-50 rounded-lg p-4"><h3 class="font-bold">Delivery Success Rate</h3><p class="text-sm text-gray-500">Analysis of on-time and successful deliveries.</p><button class="mt-2 text-sm text-blue-500 hover:underline">View Report</button></div>
                <div class="bg-gray-50 rounded-lg p-4"><h3 class="font-bold">Fuel Consumption</h3><p class="text-sm text-gray-500">Vehicle fuel efficiency and cost analysis.</p><button class="mt-2 text-sm text-blue-500 hover:underline">View Report</button></div>
                <div class="bg-gray-50 rounded-lg p-4"><h3 class="font-bold">Customer Satisfaction</h3><p class="text-sm text-gray-500">Summary of customer feedback and ratings.</p><button class="mt-2 text-sm text-blue-500 hover:underline">View Report</button></div>
            </div>
        </div>
    `,
    'settings': `
        <h2 class="text-2xl font-bold mb-4">Settings</h2>
        <div class="bg-white shadow rounded-lg p-6">
            <p class="mb-4">Manage your account and application settings here.</p>
            <div class="space-y-6">
                <div><h3 class="text-lg font-medium text-gray-900">Profile</h3><p class="mt-1 text-sm text-gray-600">This information will be displayed publicly.</p></div>
                <div class="grid grid-cols-3 gap-6"><div class="col-span-3 sm:col-span-2"><label for="company_website" class="block text-sm font-medium text-gray-700"> Website </label><div class="mt-1 flex rounded-md shadow-sm"><span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm"> http:// </span><input type="text" name="company_website" id="company_website" class="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300" placeholder="www.example.com"></div></div></div>
                <div><h3 class="text-lg font-medium text-gray-900">Notifications</h3><p class="mt-1 text-sm text-gray-600">Choose what you want to be notified about.</p></div>
                <fieldset><legend class="text-base font-medium text-gray-900">By Email</legend><div class="mt-4 space-y-4"><div class="flex items-start"><div class="flex items-center h-5"><input id="comments" name="comments" type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"></div><div class="ml-3 text-sm"><label for="comments" class="font-medium text-gray-700">Comments</label><p class="text-gray-500">Get notified when someones posts a comment.</p></div></div><div class="flex items-start"><div class="flex items-center h-5"><input id="candidates" name="candidates" type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"></div><div class="ml-3 text-sm"><label for="candidates" class="font-medium text-gray-700">Candidates</label><p class="text-gray-500">Get notified when a candidate applies for a job.</p></div></div></div></fieldset>
                <div class="pt-5"><div class="flex justify-end"><button type="button" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Save</button></div></div>
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
            <div class="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6" style="height: calc(100vh - 250px);">
                <div class="lg:col-span-2 flex flex-col gap-4">
                    <div class="bg-white shadow rounded-lg p-4 flex-1 flex flex-col" style="min-height: 650px;">
                        <div id="map" class="flex-grow bg-gray-200 rounded-lg min-h-[600px]"></div>
                    </div>

                </div>
                <div class="bg-white shadow rounded-lg p-4 flex flex-col" style="height: 650px;">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Optimization Results</h3>
                    
                    <div class="flex bg-gray-100 rounded-lg p-1 mb-4">
                        <button id="toggle-tomorrow" class="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-blue-600 text-white transition-colors">
                            Tomorrow
                        </button>
                        <button id="toggle-today" class="flex-1 py-2 px-3 text-sm font-medium rounded-md text-gray-600 hover:text-gray-800 transition-colors">
                            Today
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mb-6">
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p class="text-sm font-medium text-gray-600">Routes Optimised</p>
                            <p id="routes-optimised" class="text-2xl font-bold text-blue-600 mt-1">15 %</p>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p class="text-sm font-medium text-gray-600">Stops Merged</p>
                            <p id="stops-merged" class="text-2xl font-bold text-gray-900 mt-1">7</p>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p class="text-sm font-medium text-gray-600">Calls Scheduled</p>
                            <p id="calls-scheduled" class="text-2xl font-bold text-gray-900 mt-1">2</p>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p class="text-sm font-medium text-gray-600">Time Saved</p>
                            <p id="time-saved" class="text-2xl font-bold text-green-600 mt-1">42 min</p>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p class="text-sm font-medium text-gray-600">Success Rate</p>
                            <p id="success-rate" class="text-2xl font-bold text-green-600 mt-1">+7.2 %</p>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p class="text-sm font-medium text-gray-600">Spoilage Risk</p>
                            <p id="spoilage-risk" class="text-2xl font-bold text-green-600 mt-1">-0.8 %</p>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p class="text-sm font-medium text-gray-600">Efficiency Gain</p>
                            <p id="efficiency-gain" class="text-2xl font-bold text-blue-600 mt-1">15 %</p>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p class="text-sm font-medium text-gray-600">Cost Reduction</p>
                            <p id="cost-reduction" class="text-2xl font-bold text-green-600 mt-1">€2,340</p>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <button id="optimize-btn" class="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            Optimize
                        </button>
                        <button class="w-full border border-blue-600 text-blue-600 px-4 py-3 rounded-lg font-normal hover:bg-blue-50 transition">
                            Timeline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
}; 