// ULTRATHINK OAuth Auto-Redirect Extension
console.log('🧠 ULTRATHINK: OAuth redirect extension activated');

// Extract session data from Appwrite success page
function extractSessionData() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    
    return {
        project: params.get('project'),
        domain: params.get('domain'),
        key: params.get('key'),
        secret: params.get('secret')
    };
}

// Redirect to Recursion Chat with session data
function redirectToApp() {
    const sessionData = extractSessionData();
    
    if (sessionData.key && sessionData.secret) {
        console.log('🧠 ULTRATHINK: Session found, redirecting to Recursion Chat...');
        
        // Build redirect URL with session data
        const redirectUrl = new URL('https://chat.recursionsystems.com/appwrite-oauth-redirect.html');
        redirectUrl.searchParams.set('project', sessionData.project);
        redirectUrl.searchParams.set('domain', sessionData.domain);
        redirectUrl.searchParams.set('key', sessionData.key);
        redirectUrl.searchParams.set('secret', sessionData.secret);
        
        // Redirect immediately
        window.location.href = redirectUrl.toString();
    } else {
        console.error('🧠 ULTRATHINK: No session data found in URL');
    }
}

// Execute redirect immediately
if (window.location.href.includes('cloud.appwrite.io/console/auth/oauth2/success')) {
    redirectToApp();
}