// Font Loading Fix - Handles 404 font errors and provides fallbacks
(function() {
    'use strict';
    
    console.log('🔤 Font Loading Fix activated');
    
    // 1. Check and fix broken font links
    function fixBrokenFontLinks() {
        const fontLinks = document.querySelectorAll('link[href*="woff"], link[href*="ttf"], link[href*="otf"]');
        
        fontLinks.forEach((link, index) => {
            fetch(link.href, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        console.log(`❌ Font failed (${response.status}): ${link.href}`);
                        
                        // Remove broken font link
                        link.remove();
                        
                        // Add fallback font CSS
                        addFallbackFontCSS();
                    } else {
                        console.log(`✅ Font loaded: ${link.href}`);
                    }
                })
                .catch(error => {
                    console.log(`❌ Font error: ${link.href} - ${error.message}`);
                    link.remove();
                    addFallbackFontCSS();
                });
        });
    }
    
    // 2. Add fallback font CSS
    function addFallbackFontCSS() {
        const existingFallback = document.getElementById('font-fallback-css');
        if (existingFallback) return;
        
        const fallbackCSS = document.createElement('style');
        fallbackCSS.id = 'font-fallback-css';
        fallbackCSS.textContent = `
            * {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
                             'Droid Sans', 'Helvetica Neue', sans-serif !important;
            }
            
            body {
                font-display: swap;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
        `;
        
        document.head.appendChild(fallbackCSS);
        console.log('✅ Fallback fonts applied');
    }
    
    // 3. Monitor for dynamically added font links
    function monitorDynamicFonts() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check for font links
                        if (node.tagName === 'LINK' && 
                            (node.href.includes('woff') || 
                             node.href.includes('ttf') || 
                             node.href.includes('otf'))) {
                            
                            // Test the font link
                            fetch(node.href, { method: 'HEAD' })
                                .catch(() => {
                                    console.log(`❌ Dynamic font failed: ${node.href}`);
                                    node.remove();
                                    addFallbackFontCSS();
                                });
                        }
                        
                        // Check for @font-face in style elements
                        if (node.tagName === 'STYLE') {
                            const content = node.textContent;
                            if (content.includes('@font-face')) {
                                validateFontFaceUrls(content, node);
                            }
                        }
                    }
                });
            });
        });
        
        observer.observe(document.head, { 
            childList: true, 
            subtree: true 
        });
    }
    
    // 4. Validate @font-face URLs in CSS
    function validateFontFaceUrls(cssText, styleElement) {
        const urlMatches = cssText.match(/url\(['"]?([^'"]+\.(?:woff2?|ttf|otf))['"']?\)/gi);
        
        if (urlMatches) {
            urlMatches.forEach(match => {
                const url = match.match(/url\(['"]?([^'"]+)['"']?\)/)[1];
                
                fetch(url, { method: 'HEAD' })
                    .then(response => {
                        if (!response.ok) {
                            console.log(`❌ @font-face URL failed: ${url}`);
                            
                            // Replace the problematic @font-face with system fonts
                            const newCSS = cssText.replace(
                                /@font-face\s*{[^}]*url\(['"]?[^'"]*\.(woff2?|ttf|otf)['"']?\)[^}]*}/gi,
                                '/* Font replaced with system fonts */'
                            );
                            
                            styleElement.textContent = newCSS;
                            addFallbackFontCSS();
                        }
                    })
                    .catch(() => {
                        console.log(`❌ @font-face URL error: ${url}`);
                        styleElement.remove();
                        addFallbackFontCSS();
                    });
            });
        }
    }
    
    // 5. Font loading performance optimization
    function optimizeFontLoading() {
        // Preload critical system fonts
        const fontPreload = document.createElement('link');
        fontPreload.rel = 'preload';
        fontPreload.as = 'font';
        fontPreload.type = 'font/woff2';
        fontPreload.crossOrigin = 'anonymous';
        
        // Use a reliable font from Google Fonts as fallback
        fontPreload.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZs.woff2';
        
        document.head.appendChild(fontPreload);
        
        // Set font-display: swap on existing stylesheets
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach(stylesheet => {
            stylesheet.addEventListener('load', () => {
                try {
                    const cssRules = stylesheet.sheet.cssRules;
                    for (let rule of cssRules) {
                        if (rule.type === CSSRule.FONT_FACE_RULE) {
                            rule.style.fontDisplay = 'swap';
                        }
                    }
                } catch (e) {
                    // CORS or other security restrictions
                    console.log('Cannot modify stylesheet:', e.message);
                }
            });
        });
    }
    
    // 6. Run all font fixes
    function runFontFixes() {
        fixBrokenFontLinks();
        addFallbackFontCSS();
        monitorDynamicFonts();
        optimizeFontLoading();
        
        console.log('✅ Font loading fixes applied');
    }
    
    // Run immediately and after DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runFontFixes);
    } else {
        runFontFixes();
    }
    
    // Also run on window load for late-loading fonts
    window.addEventListener('load', runFontFixes);
    
    // Export for manual use
    window.fontLoadingFix = {
        fixBrokenFontLinks,
        addFallbackFontCSS,
        optimizeFontLoading,
        runFontFixes
    };
    
})();