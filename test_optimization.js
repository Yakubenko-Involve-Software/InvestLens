// Test file to demonstrate optimization logic
// This shows which values should be smaller vs larger after optimization

const beforeOptimization = {
    // KPI Cards - some should be smaller, some larger
    'routes-optimised': '15 %',    // Should be SMALLER (better)
    'stops-merged': '7',           // Should be SMALLER (better)
    'calls-scheduled': '2',        // Should be SMALLER (better)
    'time-saved': '42 min',        // Should be LARGER (better)
    'success-rate': '+7.2 %',      // Should be LARGER (better)
    'spoilage-risk': '-0.8 %',     // Should be SMALLER (more negative = better)
    'efficiency-gain': '15 %',     // Should be LARGER (better)
    'cost-reduction': '€2,340'     // Should be LARGER (better)
};

const afterOptimization = {
    // KPI Cards - optimized values
    'routes-optimised': '8 %',     // ✅ SMALLER (better)
    'stops-merged': '3',           // ✅ SMALLER (better)
    'calls-scheduled': '0',        // ✅ SMALLER (better)
    'time-saved': '58 min',        // ✅ LARGER (better)
    'success-rate': '+9.8 %',      // ✅ LARGER (better)
    'spoilage-risk': '-2.1 %',     // ✅ SMALLER (more negative = better)
    'efficiency-gain': '24 %',     // ✅ LARGER (better)
    'cost-reduction': '€3,420'     // ✅ LARGER (better)
};

const statisticsCards = {
    before: {
        'Total Distance': '120 Km',        // Should be SMALLER
        'Distance per Stop': '4.0 Km',     // Should be SMALLER
        'Success Rate': '92 %',            // Should be LARGER
        'CO2 Total': '34 kg',              // Should be SMALLER
        'Cold-Chain Compliance': '96.3 %', // Should be LARGER
        'Window Accuracy': '93.4 %'        // Should be LARGER
    },
    after: {
        'Total Distance': '102 Km',        // ✅ SMALLER (better)
        'Distance per Stop': '3.2 Km',     // ✅ SMALLER (better)
        'Success Rate': '97 %',            // ✅ LARGER (better)
        'CO2 Total': '25.5 kg',            // ✅ SMALLER (better)
        'Cold-Chain Compliance': '98.3 %', // ✅ LARGER (better)
        'Window Accuracy': '96.4 %'        // ✅ LARGER (better)
    }
};

// Test function to validate optimization logic
function testOptimizationLogic() {
    console.log('🧪 Testing Optimization Logic...\n');
    
    console.log('📊 KPI Cards Optimization:');
    Object.keys(beforeOptimization).forEach(key => {
        const before = beforeOptimization[key];
        const after = afterOptimization[key];
        const beforeNum = parseFloat(before.replace(/[^\d.-]/g, ''));
        const afterNum = parseFloat(after.replace(/[^\d.-]/g, ''));
        
        let result = '';
        if (key === 'spoilage-risk') {
            // For spoilage risk, more negative is better
            result = afterNum < beforeNum ? '✅ BETTER' : '❌ WORSE';
        } else if (['routes-optimised', 'stops-merged', 'calls-scheduled'].includes(key)) {
            // These should be smaller
            result = afterNum < beforeNum ? '✅ BETTER' : '❌ WORSE';
        } else {
            // These should be larger
            result = afterNum > beforeNum ? '✅ BETTER' : '❌ WORSE';
        }
        
        console.log(`${key}: ${before} → ${after} ${result}`);
    });
    
    console.log('\n📈 Statistics Cards Optimization:');
    Object.keys(statisticsCards.before).forEach(key => {
        const before = statisticsCards.before[key];
        const after = statisticsCards.after[key];
        const beforeNum = parseFloat(before.replace(/[^\d.-]/g, ''));
        const afterNum = parseFloat(after.replace(/[^\d.-]/g, ''));
        
        let result = '';
        if (['Total Distance', 'Distance per Stop', 'CO2 Total'].includes(key)) {
            // These should be smaller
            result = afterNum < beforeNum ? '✅ BETTER' : '❌ WORSE';
        } else {
            // These should be larger
            result = afterNum > beforeNum ? '✅ BETTER' : '❌ WORSE';
        }
        
        console.log(`${key}: ${before} → ${after} ${result}`);
    });
    
    console.log('\n🎨 Font Size Comparison:');
    console.log('Main values (text-3xl): 1.875rem (30px) - Large and Bold');
    console.log('Optimization pills: 0.75rem (12px) - Smaller and Normal weight');
    console.log('Ratio: Main value is 2.5x larger than optimization pill');
    
    console.log('\n✅ Optimization logic test completed!');
}

// Run the test
testOptimizationLogic();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        beforeOptimization,
        afterOptimization,
        statisticsCards,
        testOptimizationLogic
    };
}
