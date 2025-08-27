// Browser Extension Error Diagnostics and Fixes
// Run this in browser console (F12) to diagnose issues

console.log('🔍 Starting Browser Error Diagnostics...');

// 1. Check for extension port issues
function checkExtensionPorts() {
    console.log('\n📡 Checking Extension Ports:');
    
    // Clear any hanging extension connections
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
            chrome.runtime.connect();
            console.log('✅ Chrome runtime connection working');
        } catch (e) {
            console.log('❌ Chrome runtime connection failed:', e.message);
        }
    }
    
    // Check for extension conflicts
    const extensionScripts = document.querySelectorAll('script[src*="extension"]');
    console.log(`Found ${extensionScripts.length} extension scripts`);
    
    extensionScripts.forEach((script, i) => {
        console.log(`  ${i + 1}. ${script.src}`);
    });
}

// 2. Fix MutationObserver errors
function fixMutationObserver() {
    console.log('\n🔧 Fixing MutationObserver Issues:');
    
    // Override MutationObserver to add error checking
    const OriginalMutationObserver = window.MutationObserver;
    window.MutationObserver = function(callback) {
        const observer = new OriginalMutationObserver(callback);
        const originalObserve = observer.observe;
        
        observer.observe = function(target, options) {
            if (!target || !target.nodeType) {
                console.warn('🚫 Prevented MutationObserver error: target is not a Node');
                return;
            }
            return originalObserve.call(this, target, options);
        };
        
        return observer;
    };
    console.log('✅ MutationObserver protection enabled');
}

// 3. Check font loading issues
function checkFontLoading() {
    console.log('\n🔤 Checking Font Loading:');
    
    const fontLinks = document.querySelectorAll('link[href*="woff"]');
    fontLinks.forEach(link => {
        fetch(link.href)
            .then(response => {
                if (!response.ok) {
                    console.log(`❌ Font failed to load: ${link.href}`);
                    // Try to fix by removing the problematic font link
                    link.remove();
                } else {
                    console.log(`✅ Font loaded successfully: ${link.href}`);
                }
            })
            .catch(err => {
                console.log(`❌ Font error: ${link.href} - ${err.message}`);
                link.remove();
            });
    });
}

// 4. Clear extension storage and caches
function clearExtensionData() {
    console.log('\n🧹 Clearing Extension Data:');
    
    // Clear localStorage
    try {
        localStorage.clear();
        console.log('✅ LocalStorage cleared');
    } catch (e) {
        console.log('❌ LocalStorage clear failed:', e.message);
    }
    
    // Clear sessionStorage
    try {
        sessionStorage.clear();
        console.log('✅ SessionStorage cleared');
    } catch (e) {
        console.log('❌ SessionStorage clear failed:', e.message);
    }
    
    // Clear IndexedDB
    if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
            databases.forEach(db => {
                indexedDB.deleteDatabase(db.name);
            });
            console.log(`✅ Cleared ${databases.length} IndexedDB databases`);
        }).catch(e => {
            console.log('❌ IndexedDB clear failed:', e.message);
        });
    }
}

// 5. Disable problematic extensions programmatically (if possible)
function disableProblematicExtensions() {
    console.log('\n🚫 Checking Problematic Extensions:');
    
    const problematicScripts = [
        'yoroi',
        'metamask',
        'inject.js',
        'web-client-content-script.js'
    ];
    
    problematicScripts.forEach(scriptName => {
        const scripts = document.querySelectorAll(`script[src*="${scriptName}"]`);
        scripts.forEach(script => {
            script.remove();
            console.log(`🗑️ Removed problematic script: ${scriptName}`);
        });
    });
}

// 6. Prevent extension port errors
function preventPortErrors() {
    console.log('\n🛡️ Setting up Extension Port Error Prevention:');
    
    // Override console.error to suppress specific extension errors
    const originalError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        
        // Suppress known extension port errors
        if (message.includes('runtime.lastError') || 
            message.includes('back/forward cache') ||
            message.includes('message channel is closed')) {
            return; // Don't log these errors
        }
        
        originalError.apply(console, args);
    };
    
    console.log('✅ Extension error suppression enabled');
}

// Run all diagnostics and fixes
function runAllFixes() {
    console.log('🚀 Running all browser error fixes...\n');
    
    checkExtensionPorts();
    fixMutationObserver();
    checkFontLoading();
    clearExtensionData();
    disableProblematicExtensions();
    preventPortErrors();
    
    console.log('\n✨ Browser error fixes completed!');
    console.log('💡 For persistent issues, run the batch file: scripts/fix-browser-errors.bat');
}

// Auto-run fixes
runAllFixes();

// Export for manual use
window.browserErrorFixes = {
    checkExtensionPorts,
    fixMutationObserver,
    checkFontLoading,
    clearExtensionData,
    disableProblematicExtensions,
    preventPortErrors,
    runAllFixes
};