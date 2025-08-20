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
            icon: '🚛',
            description: 'Оптимізація маршрутів доставки',
            details: [
                '• Аналіз географічного розподілу замовлень',
                '• Кластеризація близьких точок доставки',
                '• Об\'єднання суміжних маршрутів'
            ],
            metrics: {
                'До оптимізації': '15 маршрутів',
                'Після оптимізації': '8 маршрутів',
                'Економія': '7 маршрутів (47%)'
            }
        },
        {
            title: 'Stops Merged',
            icon: '📍',
            description: 'Об\'єднання зупинок доставки',
            details: [
                '• Ідентифікація близько розташованих адрес',
                '• Групування замовлень по районах',
                '• Оптимізація логістичних хабів'
            ],
            metrics: {
                'До оптимізації': '7 зупинок',
                'Після оптимізації': '3 зупинки',
                'Економія': '4 зупинки (57%)'
            }
        },
        {
            title: 'Calls Scheduled',
            icon: '📞',
            description: 'Планування дзвінків клієнтам',
            details: [
                '• Автоматичне планування дзвінків',
                '• Оптимізація часу спілкування',
                '• Пріоритизація клієнтів'
            ],
            metrics: {
                'До оптимізації': '2 дзвінки',
                'Після оптимізації': '0 дзвінків',
                'Економія': '2 дзвінки (100%)'
            }
        },
        {
            title: 'Time Saved',
            icon: '⏰',
            description: 'Економія часу доставки',
            details: [
                '• Оптимізація маршрутів',
                '• Зменшення простоїв',
                '• Покращення планування'
            ],
            metrics: {
                'До оптимізації': '42 хвилини',
                'Після оптимізації': '58 хвилин',
                'Економія': '16 хвилин (38%)'
            }
        },
        {
            title: 'Success Rate',
            icon: '✅',
            description: 'Показник успішності доставки',
            details: [
                '• Покращення точності доставки',
                '• Зменшення помилок маршрутизації',
                '• Оптимізація часу доставки'
            ],
            metrics: {
                'До оптимізації': '+7.2%',
                'Після оптимізації': '+9.8%',
                'Покращення': '+2.6% (36%)'
            }
        },
        {
            title: 'Spoilage Risk',
            icon: '⚠️',
            description: 'Ризик псування продукції',
            details: [
                '• Оптимізація температурного режиму',
                '• Покращення контролю якості',
                '• Зменшення часу транспортування'
            ],
            metrics: {
                'До оптимізації': '-0.8%',
                'Після оптимізації': '-2.1%',
                'Покращення': '-1.3% (163%)'
            }
        },
        {
            title: 'Efficiency Gain',
            icon: '📈',
            description: 'Підвищення ефективності',
            details: [
                '• Оптимізація процесів доставки',
                '• Покращення використання ресурсів',
                '• Зменшення витрат'
            ],
            metrics: {
                'До оптимізації': '15%',
                'Після оптимізації': '24%',
                'Покращення': '+9% (60%)'
            }
        },
        {
            title: 'Cost Reduction',
            icon: '💰',
            description: 'Зменшення витрат на доставку',
            details: [
                '• Оптимізація маршрутів',
                '• Зменшення витрат на паливо',
                '• Покращення використання транспорту'
            ],
            metrics: {
                'До оптимізації': '€2,340',
                'Після оптимізації': '€3,420',
                'Економія': '€1,080 (46%)'
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
                        <span style="font-size: 32px; margin-right: 16px;">${data.icon}</span>
                        <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">${data.title}</h2>
                    </div>
                    <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0;">${data.description}</p>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 12px;">Деталі оптимізації:</h3>
                    <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
                        ${data.details.map(detail => `<li style="margin-bottom: 8px;">${detail}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
                    <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 12px;">Ключові показники:</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                        ${Object.entries(data.metrics).map(([key, value]) => `
                            <div style="text-align: center;">
                                <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${key}</div>
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
