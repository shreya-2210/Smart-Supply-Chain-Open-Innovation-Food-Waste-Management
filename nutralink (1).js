// ==================== NUTRILINK INDIA - FULL JAVASCRIPT ====================
// Combines Backend (Data Layer) + Frontend (UI Controller)

// ---------- INDIA STATE COORDINATES (Major Cities) ----------
const indiaCoords = {
    "Mumbai, Maharashtra": { lat: 19.0760, lng: 72.8777 },
    "Delhi, Delhi": { lat: 28.6139, lng: 77.2090 },
    "Bengaluru, Karnataka": { lat: 12.9716, lng: 77.5946 },
    "Chennai, Tamil Nadu": { lat: 13.0827, lng: 80.2707 },
    "Ahmedabad, Gujarat": { lat: 23.0225, lng: 72.5714 },
    "Kolkata, West Bengal": { lat: 22.5726, lng: 88.3639 },
    "Hyderabad, Telangana": { lat: 17.3850, lng: 78.4867 },
    "Pune, Maharashtra": { lat: 18.5204, lng: 73.8567 },
    "Jaipur, Rajasthan": { lat: 26.9124, lng: 75.7873 },
    "Lucknow, Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
    "Chandigarh, Punjab": { lat: 30.7333, lng: 76.7794 },
    "Bhopal, Madhya Pradesh": { lat: 23.2599, lng: 77.4126 },
    "Bhubaneswar, Odisha": { lat: 20.2961, lng: 85.8245 },
    "Guwahati, Assam": { lat: 26.1445, lng: 91.7362 },
    "Patna, Bihar": { lat: 25.5941, lng: 85.1376 },
    "Dehradun, Uttarakhand": { lat: 30.3165, lng: 78.0322 }
};

function getCoords(locationName) {
    return indiaCoords[locationName] || { lat: 20.5937, lng: 78.9629 };
}

// Storage Key
const STORAGE_KEY = 'NutriLinkIndiaV8';

// Global Data State
let donations = [];
let ngos = [];
let claimsHistory = [];

// Chart instances
let weeklyChart = null;
let categoryChart = null;

// Map instances
let map = null;
let markersLayer = null;

// Helper Functions
function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== BACKEND: DATA LAYER ====================

function loadDataFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            donations = data.donations || [];
            ngos = data.ngos || [];
            claimsHistory = data.claimsHistory || [];
        } catch (e) {
            console.error("Failed to parse storage", e);
        }
    }
    
    // Initialize with sample data if empty
    if (donations.length === 0) {
        donations.push({ 
            id: generateId(), donorName: "Mumbai Dabbawala", foodType: "Veg Thali", 
            quantityKg: 15, location: "Mumbai, Maharashtra", expiryTimestamp: Date.now() + 10 * 3600000, 
            imageUrl: "https://picsum.photos/id/127/100/100", status: "Available", 
            claimedByNgoId: null, ngoName: null, deliveryStage: null, createdAt: Date.now() 
        });
        donations.push({ 
            id: generateId(), donorName: "Delhi Haat", foodType: "Chole Bhature", 
            quantityKg: 12, location: "Delhi, Delhi", expiryTimestamp: Date.now() + 8 * 3600000, 
            imageUrl: "https://picsum.photos/id/102/100/100", status: "Available", 
            claimedByNgoId: null, ngoName: null, deliveryStage: null, createdAt: Date.now() 
        });
        donations.push({ 
            id: generateId(), donorName: "Bengaluru Caterers", foodType: "Dosa Set", 
            quantityKg: 20, location: "Bengaluru, Karnataka", expiryTimestamp: Date.now() + 6 * 3600000, 
            imageUrl: "https://picsum.photos/id/108/100/100", status: "Available", 
            claimedByNgoId: null, ngoName: null, deliveryStage: null, createdAt: Date.now() 
        });
    }
    
    if (ngos.length === 0) {
        ngos.push({ id: generateId(), name: "Roti Bank India", location: "Mumbai, Maharashtra", capacity: 200 });
        ngos.push({ id: generateId(), name: "Delhi Food Network", location: "Delhi, Delhi", capacity: 150 });
        ngos.push({ id: generateId(), name: "Bengaluru Cares", location: "Bengaluru, Karnataka", capacity: 120 });
        ngos.push({ id: generateId(), name: "Chennai Annadanam", location: "Chennai, Tamil Nadu", capacity: 100 });
    }
    
    saveDataToStorage();
}

function saveDataToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ donations, ngos, claimsHistory }));
}

function addDonation(donationData) {
    const newDonation = {
        id: generateId(),
        donorName: donationData.donorName,
        foodType: donationData.foodType,
        quantityKg: donationData.quantityKg,
        location: donationData.location,
        expiryTimestamp: donationData.expiryTimestamp,
        imageUrl: donationData.imageUrl,
        status: "Available",
        claimedByNgoId: null,
        ngoName: null,
        deliveryStage: null,
        createdAt: Date.now()
    };
    donations.unshift(newDonation);
    saveDataToStorage();
    return newDonation;
}

function registerNgo(name, location) {
    const newNgo = { id: generateId(), name, location, capacity: 100 };
    ngos.push(newNgo);
    saveDataToStorage();
    return newNgo;
}

function claimDonationById(donationId, ngoId) {
    const donation = donations.find(d => d.id === donationId);
    const ngo = ngos.find(n => n.id === ngoId);
    
    if (!donation || donation.status !== "Available") {
        throw new Error("Donation not available or already claimed");
    }
    if (!ngo) {
        throw new Error("Invalid NGO");
    }
    
    donation.status = "Claimed";
    donation.claimedByNgoId = ngo.id;
    donation.ngoName = ngo.name;
    donation.deliveryStage = "In Transit 🚛";
    
    const newClaim = {
        id: generateId(),
        donationId: donation.id,
        donorName: donation.donorName,
        foodType: donation.foodType,
        quantityKg: donation.quantityKg,
        ngoName: ngo.name,
        ngoLocation: ngo.location,
        location: donation.location,
        claimedAt: new Date().toISOString(),
        deliveryStage: "In Transit 🚛",
        status: "Claimed"
    };
    
    claimsHistory.unshift(newClaim);
    saveDataToStorage();
    return { donation, claim: newClaim };
}

function getAvailableDonations() {
    return donations.filter(d => d.status === "Available" && d.expiryTimestamp > Date.now());
}

function getAllDonations() {
    return [...donations];
}

function getAllNgos() {
    return [...ngos];
}

function getClaimsHistory() {
    return [...claimsHistory];
}

function getTotalRescuedKg() {
    return claimsHistory.reduce((sum, c) => sum + c.quantityKg, 0);
}

function getCo2Saved() {
    return getTotalRescuedKg() * 2.5;
}

function getMealsServed() {
    return Math.floor(getTotalRescuedKg() / 0.5);
}

function getWeeklyRescuedData() {
    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    const now = Date.now();
    claimsHistory.forEach(c => {
        const daysDiff = Math.floor((now - new Date(c.claimedAt).getTime()) / (1000 * 3600 * 24));
        if (daysDiff >= 0 && daysDiff < 7) {
            weeklyData[6 - daysDiff] += c.quantityKg;
        }
    });
    return weeklyData;
}

function getCategoryData() {
    const catMap = new Map();
    claimsHistory.forEach(c => {
        let type = c.foodType.split(' ')[0];
        catMap.set(type, (catMap.get(type) || 0) + c.quantityKg);
    });
    return {
        labels: Array.from(catMap.keys()),
        data: Array.from(catMap.values())
    };
}

// ==================== FRONTEND: UI RENDERING ====================

function renderDonationsFeed() {
    const container = document.getElementById('liveDonationsFeed');
    if (!container) return;
    
    if (donations.length === 0) {
        container.innerHTML = '<div class="donation-card">No donations yet. Be the first to donate in India!</div>';
        return;
    }
    
    container.innerHTML = donations.slice().reverse().map(d => `
        <div class="donation-card">
            <img src="${d.imageUrl}" onerror="this.src='https://via.placeholder.com/50'" class="food-item-img">
            <div style="flex:1">
                <strong>${escapeHtml(d.foodType)}</strong> - ${d.quantityKg}kg by ${escapeHtml(d.donorName)}<br>
                <small>📍 ${escapeHtml(d.location)} | ⏳ ${Math.max(0, Math.floor((d.expiryTimestamp - Date.now()) / 3600000))}h left | Status: ${d.status}</small>
            </div>
            ${d.status === 'Available' ? '<span class="badge-green"><i class="fas fa-clock"></i> Ready to Claim</span>' : `<span class="badge-claimed"><i class="fas fa-check-circle"></i> ${d.deliveryStage || 'Claimed'}</span>`}
        </div>
    `).join('');
}

function renderAvailableClaimGrid() {
    const available = getAvailableDonations();
    const container = document.getElementById('availableForClaimGrid');
    if (!container) return;
    
    if (available.length === 0) {
        container.innerHTML = `<div class="donation-card" style="text-align:center;">✨ No available food across India right now. New donations appear instantly! ✨</div>`;
        return;
    }
    
    container.innerHTML = available.map(d => `
        <div class="donation-card" style="border-left: 6px solid #ffb74d; flex-direction: column; align-items: stretch;">
            <div class="flex-between">
                <strong>🍲 ${escapeHtml(d.foodType)}</strong> 
                <span class="badge-green">${d.quantityKg} kg</span>
            </div>
            <div><i class="fas fa-store"></i> ${escapeHtml(d.donorName)} | 📍 ${escapeHtml(d.location)}</div>
            <div><i class="fas fa-hourglass-half"></i> Expires in ${Math.max(0, Math.floor((d.expiryTimestamp - Date.now()) / 3600000))}h</div>
            <img src="${d.imageUrl}" width="45" style="border-radius: 30px;" onerror="this.src='https://via.placeholder.com/45'">
            <button class="btn-claim claim-btn" data-id="${d.id}" style="margin-top: 8px; width: 100%;">
                <i class="fas fa-hand-holding-heart"></i> CLAIM NOW (India)
            </button>
        </div>
    `).join('');
    
    // Attach claim event listeners
    document.querySelectorAll('.claim-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const donationId = btn.getAttribute('data-id');
            const selectedNgoId = document.getElementById('ngoSelector').value;
            if (!selectedNgoId) {
                alert("⚠️ Please select or register an NGO from the dropdown above.");
                return;
            }
            handleClaimDonation(donationId, selectedNgoId);
        });
    });
}

function handleClaimDonation(donationId, ngoId) {
    try {
        const result = claimDonationById(donationId, ngoId);
        alert(`✅ ${result.claim.ngoName} claimed ${result.claim.quantityKg}kg of ${result.claim.foodType} from ${result.claim.location}! Live map updated.`);
        refreshEntireUI();
    } catch (error) {
        alert(error.message);
    }
}

function renderClaimedFoodTable() {
    const tbody = document.getElementById('claimedTableBody');
    if (!tbody) return;
    
    if (claimsHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No food claimed yet. NGOs can claim from the "Claim Food" section.<tr></tr>';
        return;
    }
    
    tbody.innerHTML = claimsHistory.map(claim => `
        <tr>
            <td><strong>${escapeHtml(claim.donorName)}</strong></td>
            <td>${escapeHtml(claim.foodType)}</td>
            <td>${claim.quantityKg} kg</td>
            <td><span class="badge-green">${escapeHtml(claim.ngoName)}</span></td>
            <td>📍 ${escapeHtml(claim.location || claim.ngoLocation)}</td>
            <td><span class="badge-claimed">${claim.deliveryStage || 'Claimed'}</span></td>
            <td>${new Date(claim.claimedAt).toLocaleString()}</td>
        </tr>
    `).join('');
}

function updateImpactStatsAndGraphs() {
    document.getElementById('totalRescuedKg').innerText = getTotalRescuedKg().toFixed(1);
    document.getElementById('co2Saved').innerText = getCo2Saved().toFixed(1);
    document.getElementById('mealsServed').innerText = getMealsServed();
    document.getElementById('activeNgos').innerText = ngos.length;
    
    // Weekly Chart
    const weeklyData = getWeeklyRescuedData();
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ label: 'Food Rescued (kg) - India', data: weeklyData, backgroundColor: '#0f5c3f', borderRadius: 10 }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    // Category Chart
    const catData = getCategoryData();
    const catCtx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: catData.labels,
            datasets: [{ data: catData.data, backgroundColor: ['#ffb74d', '#2ba150', '#0f5c3f', '#ff8c42', '#e67e22'] }]
        },
        options: { responsive: true }
    });
}

function updateNgoSelector() {
    const select = document.getElementById('ngoSelector');
    if (!select) return;
    select.innerHTML = '<option value="">-- Select NGO (India) --</option>' + 
        ngos.map(n => `<option value="${n.id}">${escapeHtml(n.name)} (${escapeHtml(n.location)})</option>`).join('');
}

// ==================== MAP FUNCTIONS ====================

function initMap() {
    if (map) return;
    map = L.map('liveMap').setView([22.5937, 78.9629], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap | India Food Rescue Network'
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    updateMapMarkers();
}

function updateMapMarkers() {
    if (!markersLayer) return;
    markersLayer.clearLayers();
    
    const activeClaims = donations.filter(d => d.status === "Claimed" && d.deliveryStage !== "Delivered");
    
    activeClaims.forEach(claim => {
        const donorCoord = getCoords(claim.location);
        const ngo = ngos.find(n => n.id === claim.claimedByNgoId);
        if (ngo) {
            const ngoCoord = getCoords(ngo.location);
            
            L.marker([donorCoord.lat, donorCoord.lng], {
                icon: L.divIcon({ html: '<i class="fas fa-store" style="font-size:22px; color:#0f5c3f;"></i>', iconSize: [28, 28] })
            }).bindPopup(`<b>Donor:</b> ${claim.donorName}<br>${claim.foodType}<br>📍 ${claim.location}`).addTo(markersLayer);
            
            L.marker([ngoCoord.lat, ngoCoord.lng], {
                icon: L.divIcon({ html: '<i class="fas fa-hand-holding-heart" style="font-size:22px; color:#ffb74d;"></i>', iconSize: [28, 28] })
            }).bindPopup(`<b>NGO:</b> ${ngo.name}<br>📍 ${ngo.location}`).addTo(markersLayer);
            
            L.polyline([[donorCoord.lat, donorCoord.lng], [ngoCoord.lat, ngoCoord.lng]], {
                color: '#2ba150', weight: 3, dashArray: '5, 8', opacity: 0.8
            }).addTo(markersLayer);
        }
    });
}

// ==================== EVENT HANDLERS ====================

function handlePostDonation() {
    const donorName = document.getElementById('donorName').value.trim();
    const foodType = document.getElementById('foodType').value.trim();
    const quantityKg = parseFloat(document.getElementById('foodQty').value);
    const location = document.getElementById('donorLocation').value;
    const expiryHrs = parseInt(document.getElementById('expiryHrs').value);
    const imageUrl = document.getElementById('foodImgUrl').value.trim() || "https://picsum.photos/100";
    
    if (!donorName || !foodType || isNaN(quantityKg) || !location) {
        alert("Fill all fields");
        return;
    }
    
    const newDonation = {
        donorName, foodType, quantityKg, location,
        expiryTimestamp: Date.now() + expiryHrs * 3600000,
        imageUrl
    };
    
    addDonation(newDonation);
    refreshEntireUI();
    
    const msgDiv = document.getElementById('postMessage');
    msgDiv.innerHTML = `<span class="badge-green">✅ Donation posted in ${location}! Visible to all NGOs across India.</span>`;
    setTimeout(() => msgDiv.innerHTML = '', 3000);
    
    document.getElementById('donorName').value = "";
    document.getElementById('foodType').value = "";
    document.getElementById('foodQty').value = "10";
    document.getElementById('expiryHrs').value = "8";
}

function toggleNgoRegisterForm() {
    const form = document.getElementById('ngoRegisterForm');
    form.classList.toggle('hidden');
}

function handleConfirmNgo() {
    const name = document.getElementById('quickNgoName').value.trim();
    const loc = document.getElementById('quickNgoLocation').value;
    if (!name || !loc) {
        alert("Enter NGO name & select location in India");
        return;
    }
    registerNgo(name, loc);
    refreshEntireUI();
    document.getElementById('ngoRegisterForm').classList.add('hidden');
    document.getElementById('quickNgoName').value = "";
    alert(`NGO ${name} registered in ${loc}! Now you can claim food across India.`);
}

function refreshEntireUI() {
    renderDonationsFeed();
    renderAvailableClaimGrid();
    renderClaimedFoodTable();
    updateImpactStatsAndGraphs();
    updateNgoSelector();
    if (map) updateMapMarkers();
}

function bindEvents() {
    document.getElementById('postDonationBtn')?.addEventListener('click', handlePostDonation);
    document.getElementById('quickRegisterNgoBtn')?.addEventListener('click', toggleNgoRegisterForm);
    document.getElementById('confirmQuickNgoBtn')?.addEventListener('click', handleConfirmNgo);
    document.getElementById('refreshAvailableBtn')?.addEventListener('click', () => renderAvailableClaimGrid());
    document.getElementById('refreshMapBtn')?.addEventListener('click', () => updateMapMarkers());
    document.getElementById('scrollToDonateBtn')?.addEventListener('click', () => document.getElementById('donate-section').scrollIntoView({ behavior: 'smooth' }));
    document.getElementById('scrollToClaimNavBtn')?.addEventListener('click', () => document.getElementById('claim-section').scrollIntoView({ behavior: 'smooth' }));
}

// ==================== INITIALIZATION ====================

function initApp() {
    loadDataFromStorage();
    bindEvents();
    initMap();
    refreshEntireUI();
    setInterval(() => refreshEntireUI(), 4000);
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);