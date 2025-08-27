// API Configuration
const API_URL = 'http://localhost:8000';
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
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
    
    // Use our backend proxy API to avoid CORS and rate limiting issues
    try {
        // Try the specialized zipcode endpoint first
        const response = await fetch(`${API_URL}/api/geocode/zipcode/${zipCode}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.coordinates) {
                console.log(`✅ Successfully geocoded ${zipCode} via backend proxy`);
                return {
                    lat: data.coordinates.lat,
                    lon: data.coordinates.lon
                };
            } else if (data.fallback) {
                console.log(`⚠️ Geocoding failed for ${zipCode}, using fallback coordinates`);
                showNotification('Using default location for zip code', 'warning');
                return {
                    lat: data.fallback.lat,
                    lon: data.fallback.lon
                };
            }
        }
        
        // Fallback to general geocoding endpoint
        const fallbackResponse = await fetch(`${API_URL}/api/geocode?q=${zipCode}&limit=1&countrycodes=us`);
        if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.success && fallbackData.results && fallbackData.results.length > 0) {
                const result = fallbackData.results[0];
                console.log(`✅ Successfully geocoded ${zipCode} via general proxy`);
                return {
                    lat: parseFloat(result.lat),
                    lon: parseFloat(result.lon)
                };
            }
        }
    } catch (error) {
        console.error('Geocoding proxy error:', error);
        showNotification('Geocoding service temporarily unavailable', 'error');
    }
    
    // Default to NYC coordinates if all geocoding attempts fail
    console.log(`❌ All geocoding attempts failed for ${zipCode}, using default NYC coordinates`);
    showNotification('Using default location (NYC) - geocoding unavailable', 'warning');
    return { lat: 40.7128, lon: -74.0060 };
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('addListingForm').addEventListener('submit', handleAddListing);
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            
            // Get user info
            await getUserInfo(email);
            
            closeModal();
            updateUIForAuth();
            showNotification('Login successful!', 'success');
            // Scroll to top of dashboard
            window.scrollTo(0, 0);
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    // Debug: Check if form elements exist
    console.log('Signup form elements:', {
        email: document.getElementById('signupEmail'),
        password: document.getElementById('signupPassword'),
        age: document.getElementById('signupAge'),
        zipCode: document.getElementById('signupZipCode'),
        bio: document.getElementById('signupBio')
    });
    
    const zipCode = document.getElementById('signupZipCode').value;
    
    // Convert zip code to coordinates
    const coords = await getCoordinatesFromZip(zipCode);
    if (!coords) {
        showNotification('Invalid zip code', 'error');
        return;
    }
    
    const userData = {
        username: document.getElementById('signupEmail').value.split('@')[0], // Use email prefix as username
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value,
        zipcode: zipCode,
        optInLocation: true
    };
    
    try {
        const response = await fetch(`${API_URL}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            
            currentUser = userData;
            closeModal();
            updateUIForAuth();
            showNotification('Welcome to Trading Post!', 'success');
            // Scroll to top of dashboard
            window.scrollTo(0, 0);
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Signup failed', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function getUserInfo(email) {
    try {
        // Store user info for welcome message
        currentUser = {
            username: email.split('@')[0], // Use part before @ as display name
            email: email
        };
        // Update welcome message immediately
        const welcomeEl = document.getElementById('welcomeUsername');
        if (welcomeEl && currentUser.username) {
            welcomeEl.textContent = currentUser.username;
        }
    } catch (error) {
        console.error('Error getting user info:', error);
    }
}

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        updateUIForAuth();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateUIForAuth();
    showNotification('Logged out successfully', 'success');
}

function updateUIForAuth() {
    const loginBtn = document.querySelector('.btn-login');
    const landingSections = ['home', 'features', 'demo', 'market', 'contact'];
    const dashboard = document.getElementById('dashboard');
    const navLinks = document.querySelector('.nav-links');
    
    if (authToken) {
        // Hide ALL landing page sections completely
        document.querySelectorAll('section:not(#dashboard)').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show ONLY the dashboard
        dashboard.style.display = 'block';
        dashboard.style.minHeight = '100vh';
        
        // Update navigation
        loginBtn.textContent = 'Logout';
        loginBtn.onclick = logout;
        
        // Update nav links for logged in user
        navLinks.innerHTML = `
            <a href="#dashboard">Dashboard</a>
            <a href="#" onclick="showMarketplace()">Marketplace</a>
            <button class="btn-login" onclick="logout()">Logout</button>
        `;
        
        // Load user data
        loadUserDashboard();
        
        // Update welcome message
        if (currentUser && currentUser.username) {
            document.getElementById('welcomeUsername').textContent = currentUser.username;
        }
    } else {
        // Show landing page sections
        landingSections.forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'block';
        });
        
        // Hide dashboard
        dashboard.style.display = 'none';
        
        // Reset navigation
        navLinks.innerHTML = `
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#demo">Demo</a>
            <a href="#market">Market</a>
            <a href="#contact">Contact</a>
            <button class="btn-login" onclick="showLogin()">Login</button>
        `;
    }
}

// Load Listings
async function loadListings() {
    try {
        const response = await fetch(`${API_URL}/api/listings`);
        if (response.ok) {
            const data = await response.json();
            displayListings(data.items || []);
        }
    } catch (error) {
        console.error('Error loading listings:', error);
        // Display demo data if API is not available
        displayDemoListings();
    }
}

function displayListings(listings) {
    const container = document.getElementById('listings-container');
    
    if (listings.length === 0) {
        displayDemoListings();
        return;
    }
    
    container.innerHTML = listings.slice(0, 6).map(listing => `
        <div class="listing-card">
            <div class="listing-category">${listing.category}</div>
            <h4 class="listing-title">${listing.description.substring(0, 50)}...</h4>
            <div class="listing-price">$${listing.price}</div>
            <div class="listing-user">
                <i class="fas fa-user-circle"></i>
                ${listing.owner?.username || 'User'}
            </div>
        </div>
    `).join('');
}

function displayDemoListings() {
    const demoListings = [
        {
            category: 'Electronics',
            description: 'iPhone 12 Pro in excellent condition with box',
            price: 500,
            owner: { username: 'alice_smith' }
        },
        {
            category: 'Furniture',
            description: 'Mid-century modern coffee table, solid wood',
            price: 300,
            owner: { username: 'charlie_brown' }
        },
        {
            category: 'Sports',
            description: 'Professional road bike, carbon frame',
            price: 800,
            owner: { username: 'diana_prince' }
        },
        {
            category: 'Books',
            description: 'Complete Harry Potter series, hardcover',
            price: 50,
            owner: { username: 'alice_smith' }
        },
        {
            category: 'Gaming',
            description: 'PlayStation 5 with extra controller',
            price: 600,
            owner: { username: 'evan_williams' }
        },
        {
            category: 'Outdoor',
            description: 'Complete camping gear set with tent',
            price: 250,
            owner: { username: 'diana_prince' }
        }
    ];
    
    displayListings(demoListings);
}

// Demo Tab Switching
function showDemoTab(tabName) {
    // Update active tab
    document.querySelectorAll('.demo-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update active panel
    document.querySelectorAll('.demo-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-demo`).classList.add('active');
}

// Modal Functions
function showLogin() {
    closeModal();
    document.getElementById('loginModal').style.display = 'block';
}

function showSignup() {
    closeModal();
    document.getElementById('signupModal').style.display = 'block';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Make functions globally accessible
window.showLogin = showLogin;
window.showSignup = showSignup;
window.closeModal = closeModal;

// Mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
}

window.toggleMobileMenu = toggleMobileMenu;

// Click outside modal to close
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
}

// Notifications
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#EF4444'};
        color: white;
        border-radius: 0.5rem;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Dashboard Functions
async function loadUserDashboard() {
    if (!authToken) return;
    
    // Load user's listings
    loadMyListings();
    
    // Load user's matches
    loadMyMatches();
}

async function loadMyListings() {
    try {
        const response = await fetch(`${API_URL}/api/listings`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const myListings = data.items || [];
            displayMyListings(myListings);
            document.getElementById('userListingsCount').textContent = myListings.length;
        }
    } catch (error) {
        console.error('Error loading my listings:', error);
    }
}

async function loadMyMatches() {
    try {
        const response = await fetch(`${API_URL}/api/matches`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const myMatches = data.items || [];
            displayMyMatches(myMatches);
            document.getElementById('userMatchesCount').textContent = myMatches.length;
        }
    } catch (error) {
        console.error('Error loading my matches:', error);
    }
}

function displayMyListings(listings) {
    const container = document.getElementById('myListingsContainer');
    
    if (listings.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6B7280;">No listings yet. Add your first item above!</p>';
        return;
    }
    
    container.innerHTML = listings.map(listing => `
        <div class="listing-card">
            <div class="listing-category">${listing.category}</div>
            <h4 class="listing-title">${listing.description.substring(0, 50)}...</h4>
            <div class="listing-price">$${listing.price}</div>
            <div class="listing-actions">
                <button class="btn-delete" onclick="deleteListing(${listing.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function displayMyMatches(matches) {
    const container = document.getElementById('myMatchesContainer');
    
    if (matches.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6B7280;">No matches yet.</p>';
        return;
    }
    
    container.innerHTML = matches.map(match => `
        <div class="match-item">
            <div class="match-details">
                <i class="fas fa-exchange-alt"></i>
                <div>
                    <strong>Listing:</strong> ${match.listing?.description?.substring(0, 50) || 'Unknown'}...
                    <br>
                    <small>Matched with: ${match.getter?.username || match.giver?.username || 'Unknown user'}</small>
                </div>
            </div>
            <span class="match-date">${new Date(match.created_at).toLocaleDateString()}</span>
        </div>
    `).join('');
}

// Add Listing
async function handleAddListing(e) {
    e.preventDefault();
    
    if (!authToken) {
        showNotification('Please login to add listings', 'error');
        return;
    }
    
    const listingData = {
        category: document.getElementById('listingCategory').value,
        description: document.getElementById('listingDescription').value,
        price: parseFloat(document.getElementById('listingPrice').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/api/listings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(listingData)
        });
        
        if (response.ok) {
            showNotification('Listing added successfully!', 'success');
            document.getElementById('addListingForm').reset();
            loadMyListings(); // Reload listings
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Failed to add listing', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

// Delete Listing
async function deleteListing(listingId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/listings/${listingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok || response.status === 204) {
            showNotification('Listing deleted successfully', 'success');
            loadMyListings(); // Reload listings
        } else {
            showNotification('Failed to delete listing', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

// Show Marketplace (placeholder)
function showMarketplace() {
    showNotification('Marketplace coming soon!', 'info');
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href && href !== '#') {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});