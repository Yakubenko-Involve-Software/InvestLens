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
        <div class="flex flex-col h-full">
            <div class="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" style="height: 50vh;">
                <div id="routes-map" class="w-full h-full bg-white shadow rounded-lg lg:col-span-2"></div>
                <div id="routes-sidebar" class="bg-white shadow rounded-lg p-6 flex flex-col" style="height: 50vh;">
                    <div id="routes-kpis" class="space-y-6 flex-grow">
                        <!-- KPIs will be injected here -->
                    </div>
                </div>
            </div>
            <div class="bg-white shadow rounded-lg overflow-y-auto" style="height: calc(50vh - 120px);">
                <table id="routes-table" class="min-w-full">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            <th class="py-3 px-4 text-left cursor-pointer hover:text-gray-800" data-sort-key="id">ID<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 text-left cursor-pointer hover:text-gray-800" data-sort-key="name">Name<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 text-left cursor-pointer hover:text-gray-800" data-sort-key="stops">Stops<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 text-left cursor-pointer hover:text-gray-800" data-sort-key="km">Km<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                            <th class="py-3 px-4 text-left cursor-pointer hover:text-gray-800" data-sort-key="risk">Risk<i class="ri-arrow-up-down-line ml-1 align-middle text-gray-400"></i></th>
                        </tr>
                    </thead>
                    <tbody>
                         <!-- Route data will be injected here -->
                    </tbody>
                </table>
            </div>
        </div>
    `,
    'live-map': `
        <div class="grid grid-cols-1 lg:grid-cols-6 gap-6 h-full">
            <div id="live-map-container" class="w-full h-full bg-white shadow rounded-lg lg:col-span-5 min-h-[400px] lg:min-h-0"></div>
            <div id="live-map-sidebar" class="bg-white shadow rounded-lg p-4 flex flex-col lg:col-span-1">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Route Details</h3>
                <div id="live-map-kpis" class="space-y-4">
                    <!-- KPIs will be injected here -->
                </div>
                <div class="flex-grow"></div>
                <button id="show-timeline-btn" class="w-full mt-4 py-2 px-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition text-sm">
                    Show Timeline
                </button>
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
            <div class="flex-none mb-4"><h2 class="text-2xl font-bold">AI Route Optimizer</h2></div>
            <div class="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white shadow rounded-lg p-4 flex flex-col">
                    <div id="map" class="flex-grow bg-gray-200 rounded-lg min-h-[300px] lg:min-h-0"></div>
                    <div class="mt-4 overflow-y-auto max-h-60">
                        <table id="route-list" class="min-w-full"><thead class="bg-gray-50"><tr><th class="py-2 px-3 text-left">Courier</th><th class="py-2 px-3 text-left">Stops</th><th class="py-2 px-3 text-left">KM</th><th class="py-2 px-3 text-left">Risk</th></tr></thead><tbody></tbody></table>
                    </div>
                </div>
                <div class="bg-white shadow rounded-lg p-4 flex flex-col space-y-4">
                    <div id="kpi-snap" class="grid grid-cols-2 gap-4"></div>
                    <div id="timeline-drawer" class="flex-grow bg-gray-50 rounded-lg p-4 overflow-y-auto"><h3 class="font-bold mb-2">Timeline</h3><ul id="timeline-list"></ul></div>
                    <div class="flex-none"><button id="back-to-overview" class="w-full py-2 px-4 bg-gray-200 rounded hover:bg-gray-300">Back to Overview</button></div>
                </div>
            </div>
            <div class="flex-none mt-4"><div id="summary-cards" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"></div></div>
        </div>
        <div id="summary-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
                <h3 id="modal-title" class="text-xl font-bold mb-4"></h3>
                <ul id="modal-list" class="list-disc list-inside"></ul>
                <div class="mt-6 text-right"><button id="modal-close" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button></div>
            </div>
        </div>
    `
}; 