// Standalone KPI Popup Initialization
console.log('🚀 KPI Popup Init Script Loading...');

// Wait for DOM to be ready
function waitForDOM(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Initialize KPI Popups
function initializeKPIPopups() {
    console.log('🔧 Initializing KPI Popups (standalone)...');
    
    // Find all KPI cards
    const cards = document.querySelectorAll('#results-view .kpi-card, [data-kpi]');
    console.log(`📊 Found ${cards.length} KPI cards`);
    
    if (cards.length === 0) {
        console.warn('⚠️ No KPI cards found. Will retry in 2 seconds...');
        setTimeout(initializeKPIPopups, 2000);
        return;
    }
    
    // Popup data
    const popupData = [
        {
            title: 'Routes Optimised',
            details: [
                '• Analysis of the geographical distribution of orders',
                '• Clustering of nearby delivery points',
                '• Merging of adjacent routes'
            ],
            metrics: {
                'Before optimization': '15 routes',
                'After optimization': '8 routes',
                'Savings': '7 routes (47%)'
            }
        },
        {
            title: 'Stops Merged',
            details: [
                '• Identification of closely located addresses',
                '• Grouping of orders by district',
                '• Optimization of logistics hubs'
            ],
            metrics: {
                'Before optimization': '7 stops',
                'After optimization': '3 stops',
                'Savings': '4 stops (57%)'
            }
        },
        {
            title: 'Calls Scheduled',
            details: [
                '• Automatic call scheduling',
                '• Optimization of communication time',
                '• Customer prioritization'
            ],
            metrics: {
                'Before optimization': '2 calls',
                'After optimization': '0 calls',
                'Savings': '2 calls (100%)'
            }
        },
        {
            title: 'Time Saved',
            details: [
                '• Route optimization',
                '• Reduction of downtime',
                '• Improved planning'
            ],
            metrics: {
                'Before optimization': '42 minutes',
                'After optimization': '58 minutes',
                'Savings': '16 minutes (38%)'
            }
        },
        {
            title: 'Success Rate',
            details: [
                '• Improved delivery accuracy',
                '• Reduction of routing errors',
                '• Optimization of delivery time'
            ],
            metrics: {
                'Before optimization': '+7.2%',
                'After optimization': '+9.8%',
                'Improvement': '+2.6% (36%)'
            }
        },
        {
            title: 'Spoilage Risk',
            details: [
                '• Optimization of temperature control',
                '• Improved quality control',
                '• Reduction of transportation time'
            ],
            metrics: {
                'Before optimization': '-0.8%',
                'After optimization': '-2.1%',
                'Improvement': '-1.3% (163%)'
            }
        },
        {
            title: 'Efficiency Gain',
            details: [
                '• Optimization of delivery processes',
                '• Improved resource utilization',
                '• Cost reduction'
            ],
            metrics: {
                'Before optimization': '15%',
                'After optimization': '24%',
                'Improvement': '+9% (60%)'
            }
        },
        {
            title: 'Cost Reduction',
            details: [
                '• Route optimization',
                '• Reduction of fuel costs',
                '• Improved vehicle utilization'
            ],
            metrics: {
                'Before optimization': '€2,340',
                'After optimization': '€3,420',
                'Savings': '€1,080 (46%)'
            }
        }
    ];
    
    // Create popup container if it doesn't exist
    let popupContainer = document.getElementById('kpi-popup-container');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'kpi-popup-container';
        popupContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
        `;
        document.body.appendChild(popupContainer);
    }
    
    // Function to show popup
    function showPopup(index) {
        console.log(`🎯 Showing popup for card ${index}`);
        const data = popupData[index] || popupData[0];
        
        popupContainer.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            ">
                <button onclick="document.getElementById('kpi-popup-container').style.display='none'" style="
                    position: absolute;
                    top: 16px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6b7280;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                " onmouseover="this.style.backgroundColor='#fee2e2'; this.style.color='#dc2626';" onmouseout="this.style.backgroundColor='transparent'; this.style.color='#6b7280';">×</button>
                
                <div style="margin-bottom: 20px; padding-right: 40px;">
                    <div style="display: flex; align-items: center; margin-bottom: 16px;">
                        <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${data.title}</h2>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
                        ${data.details.map(detail => `<li style="margin-bottom: 8px;">${detail}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                        ${Object.entries(data.metrics).map(([key, value]) => `
                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #f3f4f6;">
                                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${key}</div>
                                <div style="font-size: 16px; font-weight: 600; color: #111827;">${value}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        popupContainer.style.display = 'flex';
        
        // Close on background click
        popupContainer.onclick = (e) => {
            if (e.target === popupContainer) {
                popupContainer.style.display = 'none';
            }
        };
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                popupContainer.style.display = 'none';
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    // Add click handlers to cards
    cards.forEach((card, index) => {
        card.style.cursor = 'pointer';
        card.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Card ${index} clicked`);
            showPopup(index);
        };
        console.log(`✅ Click handler added to card ${index}`);
    });
    
    // Make showPopup globally available for testing
    window.showKPIPopupSimple = showPopup;
    
    console.log('✅ KPI Popups initialized successfully!');
}

// Auto-initialize when AI widget is loaded
waitForDOM(() => {
    // Try to initialize immediately
    setTimeout(initializeKPIPopups, 1000);
    
    // Retry after 3 seconds if needed
    setTimeout(initializeKPIPopups, 3000);
    
    // Final retry after 5 seconds
    setTimeout(initializeKPIPopups, 5000);
});

// Export for manual initialization
window.initializeKPIPopups = initializeKPIPopups;

console.log('✅ KPI Popup Init Script Loaded');
