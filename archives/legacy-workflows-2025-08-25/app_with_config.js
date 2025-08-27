// Import configuration
let tradingPostConfig;
if (typeof require !== 'undefined') {
    tradingPostConfig = require('./config.js');
} else {
    // Assume config.js is loaded via script tag
    tradingPostConfig = window.tradingPostConfig;
}

// Wait for config to initialize
async function waitForConfig() {
    while (!tradingPostConfig.isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// API Configuration
let API_URL = 'http://localhost:8000'; // Default, will be updated
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await waitForConfig();
    
    // Update API URL from config
    API_URL = tradingPostConfig.getApiUrl();
    console.log('Using API URL:', API_URL);
    
    // Display access type
    const accessInfo = document.getElementById('access-info');
    if (accessInfo) {
        accessInfo.textContent = tradingPostConfig.isInternalAccess() ? 
            'Internal Network Access' : 'External Access via Cloudflare';
    }
    
    loadListings();
    setupEventListeners();
    checkAuth();
});

// Zip code to coordinates mapping (simplified for demo)
const zipCodeCoords = {
    // New York Area
    '10001': { lat: 40.7506, lon: -73.9972 }, // Manhattan
    '10002': { lat: 40.7159, lon: -73.9866 },
    '10003': { lat: 40.7317, lon: -73.9885 },
    '10004': { lat: 40.6894, lon: -74.0185 },
    '10005': { lat: 40.7057, lon: -74.0087 },
    '10006': { lat: 40.7086, lon: -74.0130 },
    '10007': { lat: 40.7130, lon: -74.0077 },
    '10008': { lat: 40.7094, lon: -74.0065 },
    '10009': { lat: 40.7264, lon: -73.9772 },
    '10010': { lat: 40.7391, lon: -73.9826 },
    '10011': { lat: 40.7420, lon: -74.0001 },
    '10012': { lat: 40.7256, lon: -73.9983 },
    '10013': { lat: 40.7205, lon: -74.0047 },
    '10014': { lat: 40.7341, lon: -74.0067 },
    '11201': { lat: 40.6932, lon: -73.9894 }, // Brooklyn
    '11211': { lat: 40.7125, lon: -73.9538 },
    // Add more common zip codes
    '90210': { lat: 34.0901, lon: -118.4065 }, // Beverly Hills
    '60601': { lat: 41.8857, lon: -87.6181 }, // Chicago
    '33101': { lat: 25.7783, lon: -80.1893 }, // Miami
    '02101': { lat: 42.3702, lon: -71.0269 }, // Boston
    '98101': { lat: 47.6086, lon: -122.3357 }, // Seattle
    '94102': { lat: 37.7816, lon: -122.4190 }, // San Francisco
    '78701': { lat: 30.2711, lon: -97.7437 }, // Austin
    '80202': { lat: 39.7549, lon: -104.9952 }, // Denver
    '85001': { lat: 33.4494, lon: -112.0667 }, // Phoenix
    '30301': { lat: 33.7590, lon: -84.3863 }, // Atlanta
};

async function getCoordinatesFromZip(zipCode) {
    // First check our local mapping
    if (zipCodeCoords[zipCode]) {
        return zipCodeCoords[zipCode];
    }
    
    // Try to get from backend API with config-aware URL
    try {
        const response = await fetch(tradingPostConfig.getApiUrl(`/api/zipcode/${zipCode}`), {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            return { lat: data.latitude, lon: data.longitude };
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error);
    }
    
    // Default fallback (center of US)
    return { lat: 39.8283, lon: -98.5795 };
}

// Add authentication headers to requests
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// Check authentication status
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const response = await fetch(tradingPostConfig.getApiUrl('/api/users/me'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                currentUser = await response.json();
                authToken = token;
                updateUIForAuth();
            } else {
                logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        }
    }
}

// Update UI based on authentication status
function updateUIForAuth() {
    const authContainer = document.getElementById('auth-container');
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (currentUser) {
        if (authContainer) authContainer.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'block';
            userInfo.querySelector('#username-display').textContent = currentUser.username;
        }
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline';
    } else {
        if (authContainer) authContainer.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter controls
    const filterInputs = document.querySelectorAll('.filter-controls input, .filter-controls select');
    filterInputs.forEach(input => {
        input.addEventListener('change', loadListings);
    });
    
    // Sort controls
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', loadListings);
    }
    
    // Auth buttons
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', showLoginForm);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (signupBtn) signupBtn.addEventListener('click', showSignupForm);
}

// Load and display listings with config-aware API calls
async function loadListings() {
    try {
        const filters = getFilters();
        const queryParams = new URLSearchParams(filters);
        
        const response = await fetch(tradingPostConfig.getApiUrl(`/api/listings?${queryParams}`), {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load listings');
        }
        
        const listings = await response.json();
        displayListings(listings);
    } catch (error) {
        console.error('Error loading listings:', error);
        displayError('Failed to load listings. Please try again.');
    }
}

// Get filter values from UI
function getFilters() {
    const filters = {};
    
    // Category filter
    const category = document.getElementById('category-filter')?.value;
    if (category && category !== 'all') {
        filters.category = category;
    }
    
    // Distance filter
    const distance = document.getElementById('distance-filter')?.value;
    if (distance) {
        filters.max_distance = distance;
        
        // Get user's zip code
        const userZip = document.getElementById('user-zip')?.value || 
                       (currentUser ? currentUser.zip_code : null);
        if (userZip) {
            filters.zip_code = userZip;
        }
    }
    
    // Search query
    const search = document.getElementById('search-input')?.value;
    if (search) {
        filters.search = search;
    }
    
    // Sort option
    const sort = document.getElementById('sort-select')?.value;
    if (sort) {
        filters.sort = sort;
    }
    
    return filters;
}

// Display listings in the grid
function displayListings(listings) {
    const container = document.getElementById('listings-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (listings.length === 0) {
        container.innerHTML = '<p class="no-results">No listings found.</p>';
        return;
    }
    
    listings.forEach(listing => {
        const card = createListingCard(listing);
        container.appendChild(card);
    });
}

// Create a listing card element
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    
    const imageUrl = listing.image_url || '/images/placeholder.png';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${listing.title}" onerror="this.src='/images/placeholder.png'">
        <div class="listing-content">
            <h3>${listing.title}</h3>
            <p class="listing-description">${listing.description}</p>
            <div class="listing-meta">
                <span class="listing-category">${listing.category}</span>
                <span class="listing-location">${listing.location || listing.zip_code}</span>
            </div>
            <div class="listing-user">
                <i class="fas fa-user"></i> ${listing.username || 'Anonymous'}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showListingDetail(listing));
    
    return card;
}

// Show listing detail modal
function showListingDetail(listing) {
    // Implementation for showing listing details
    console.log('Show listing:', listing);
}

// Display error messages
function displayError(message) {
    const container = document.getElementById('listings-container');
    if (container) {
        container.innerHTML = `<p class="error-message">${message}</p>`;
    }
}

// Auth functions
function showLoginForm() {
    // Implementation for login form
    console.log('Show login form');
}

function showSignupForm() {
    // Implementation for signup form
    console.log('Show signup form');
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    updateUIForAuth();
    loadListings();
}