// Integrated with global security.js
console.log("📂 profile.js: Loading Version 1.2 (Harden)...");

const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:5000';

// User Data Isolation Helpers
function getUserKey(baseKey) {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user || !user.email) return baseKey;
    // Clean email to use as key part (remove special chars)
    const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${baseKey}_${cleanEmail}`;
}


// --- MODAL & GLOBAL FUNCTIONS (TOP LEVEL FOR RELIABILITY) ---
// --- ADMIN MODAL SYSTEM (Consolidated) ---
// This section handles the premium product management modal
window.openAddProductModal = function () {
    console.log("📦 Standard Call: openAddProductModal");
    if (typeof window.openProductModal === 'function') {
        window.openProductModal();
    } else {
        console.error("openProductModal not found");
    }
};


window.updateAdminStats = async function () {
    try {
        const token = localStorage.getItem('authToken');
        const [productsRes, ordersRes, usersRes] = await Promise.all([
            fetch(`${API_BASE}/api/products`),
            fetch(`${API_BASE}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const products = await productsRes.json();
        const orders = ordersRes.ok ? await ordersRes.json() : [];
        const users = usersRes.ok ? await usersRes.json() : [];
        const revenue = orders.reduce((sum, o) => sum + (['Failed', 'Returned', 'Cancelled'].includes(o.status) ? 0 : o.totalAmount), 0);

        const totalProdEl = document.getElementById('admin-stat-total-products');
        const totalOrderEl = document.getElementById('admin-stat-total-orders');
        const revenueEl = document.getElementById('admin-stat-revenue');
        const usersEl = document.getElementById('admin-stat-users');

        if (totalProdEl) totalProdEl.textContent = products.length;
        if (totalOrderEl) totalOrderEl.textContent = orders.length;
        if (revenueEl) revenueEl.textContent = '₹' + revenue.toLocaleString();
        if (usersEl) usersEl.textContent = users.length;
    } catch (e) { console.error(e); }
};

window.loadAdminProductsFull = async function () {
    try {
        console.log("🔄 Loading full product list...");
        const res = await fetch(`${API_BASE}/api/products`);
        allAdminProducts = await res.json();
        window.filterAdminProducts();
    } catch (e) { console.error("Load products error:", e); }
};

window.addEventListener('efv-security-violation', () => {
    // 1. Destroy "decrypted buffers" (clear canvases)
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // 2. Kill all audio/video immediately
    document.querySelectorAll('audio, video').forEach(media => {
        media.pause();
        media.src = '';
        media.load();
        media.remove();
    });

    // 3. Clear sensitive overlays
    document.querySelectorAll('.reader-overlay, .efv-audio-player-overlay').forEach(el => {
        el.style.display = 'none';
        el.remove();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check - Redirect if not logged in
    const user = JSON.parse(localStorage.getItem('efv_user'));

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Role-Based Page Protection
    const isProfilePage = window.location.pathname.includes('profile.html');
    const isAdmin = user.role === 'admin' || user.email.toLowerCase() === 'admin@uwo24.com';

    if (isProfilePage && isAdmin) {
        // Admins strictly forbidden from customer profile
        window.location.href = 'admin-dashboard.html';
        return;
    }

    // 2. Initialize Mobile Menu FIRST (Critical)
    const dashHamb = document.getElementById('dashboard-hamburger');
    const sideNav = document.querySelector('.sidebar-nav');

    if (dashHamb && sideNav) {
        // Direct listener — no cloneNode to avoid losing onclick attrs or double binds
        dashHamb.addEventListener('click', function (e) {
            e.stopPropagation();
            this.classList.toggle('active');
            sideNav.classList.toggle('active');
            console.log('🍔 Hamburger clicked! Nav active:', sideNav.classList.contains('active'));
        });

        // Close menu when clicking a nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                dashHamb.classList.remove('active');
                sideNav.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sideNav.contains(e.target) && !dashHamb.contains(e.target)) {
                dashHamb.classList.remove('active');
                sideNav.classList.remove('active');
            }
        });
    }

    // 3. Initialize Dashboard & Filters
    initializeDashboard(user);
    initializeNotificationFilters();

    // 4. Tab Logic
    const tabs = document.querySelectorAll('.nav-item[data-tab]');
    const sections = document.querySelectorAll('.content-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Activate Clicked
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const section = document.getElementById(targetId);
            if (section) section.classList.add('active');

            if (targetId === 'admin-payments') loadAdminPayments();
            if (targetId === 'admin-shipments') loadAdminShipments();
            if (targetId === 'admin-coupons') loadAdminCoupons();

            // Refresh specific data on tab switch
            if (targetId === 'dashboard') updateDashboardOverview();
            if (targetId === 'admin') updateAdminStats();
            if (targetId === 'library') syncLibraryWithBackend();
            if (targetId === 'orders') renderOrdersTab();
            if (targetId === 'notifications') renderNotificationsTab();
            if (targetId === 'admin-orders') loadAdminOrdersFull();
            if (targetId === 'admin-products') loadAdminProductsFull();

            // ROLE BASED SETTINGS REDIRECTION
            if (targetId === 'settings') {
                const isAdmin = user.role === 'admin' || user.email.toLowerCase() === 'admin@uwo24.com';
                if (isAdmin) {
                    tab.classList.remove('active');
                    sections.forEach(s => s.classList.remove('active'));
                    const adminSettingsSection = document.getElementById('admin-settings');
                    if (adminSettingsSection) adminSettingsSection.classList.add('active');
                    initializeAdminSettings();
                } else {
                    initializeSettingsTabs();
                }
            }

            if (targetId === 'support') loadUserSupportHistory();
        });
    });


    // 3.2 Order Filters (NEW)
    document.querySelectorAll('[data-order-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-order-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderOrdersTab(btn.getAttribute('data-order-filter'));
        });
    });

    // 3.3 Checkout (NEW)
    const checkoutBtn = document.getElementById('proceed-to-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cartKey = getUserKey('efv_cart');
            const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
            if (cart.length === 0) {
                showToast("Your cart is empty", "error");
                return;
            }
            initiateDashboardCheckout(cart, false);
        });
    }

    // 4. Logout
    window.logoutAction = () => {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('efv_user');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('adminLoggedIn');
            // Clear base keys to prevent data leakage to next anonymous user
            localStorage.removeItem('efv_digital_library');
            localStorage.removeItem('efv_purchase_history');
            localStorage.removeItem('efv_cart');
            window.location.href = 'index.html';
        }
    };

    // 5. Profile Form Listener (v2)
    const profileFormV2 = document.getElementById('profile-form-v2');
    if (profileFormV2) {
        profileFormV2.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('authToken');
            const data = {
                name: document.getElementById('settings-name-v2').value,
                phone: document.getElementById('settings-phone-v2').value
            };
            try {
                const res = await fetch(`${API_BASE}/api/users/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    showToast("Profile updated successfully", "success");
                    fetchProfileData();
                } else {
                    showToast("Failed to update profile", "error");
                }
            } catch (err) {
                console.error(err);
                showToast("Server error", "error");
            }
        });
    }

    // 6. Change Password Listener
    const changePassForm = document.getElementById('change-password-form');
    if (changePassForm) {
        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('authToken');
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showToast("Passwords do not match", "error");
                return;
            }

            if (newPassword.length < 6) {
                showToast("Password must be at least 6 characters", "error");
                return;
            }

            const btn = document.getElementById('change-pass-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/api/users/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const data = await res.json();
                if (res.ok) {
                    showToast("Password updated successfully", "success");
                    changePassForm.reset();
                } else {
                    showToast(data.message || "Failed to update password", "error");
                }
            } catch (err) {
                console.error(err);
                showToast("Server error", "error");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // 5. Initial Render
    renderCartTab();
    renderOrdersTab();
    renderLibraryTab();
    updateStats();
    if (typeof updateAuthNavbar === 'function') updateAuthNavbar();

    // Check for query param to open specific tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
        switchTab(tabParam);
    }

    // User Support Form Submission
    const supportForm = document.getElementById('user-support-form');
    if (supportForm) {
        supportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('efv_user'));
            const data = {
                userId: user ? user._id : null,
                name: user ? user.name : 'Anonymous',
                email: user ? user.email : 'No Email',
                subject: document.getElementById('support-subject').value,
                message: document.getElementById('support-message').value
            };

            const btn = document.getElementById('send-support-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/api/support/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    if (typeof showToast === 'function') showToast("Message sent successfully! Our team will contact you.", "success");
                    else alert("Message sent successfully!");
                    supportForm.reset();
                } else {
                    const err = await res.json();
                    if (typeof showToast === 'function') showToast(err.message || "Failed to send message", "error");
                    else alert(err.message || "Failed to send message");
                }
            } catch (err) {
                console.error(err);
                if (typeof showToast === 'function') showToast("Connection error", "error");
                else alert("Connection error");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
                loadUserSupportHistory();
            }
        });
    }
});

async function loadUserSupportHistory() {
    const container = document.getElementById('user-support-history');
    if (!container) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/support/my-messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();

        if (!res.ok) throw new Error(messages.message || 'Failed to fetch');

        if (messages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; opacity: 0.5;">
                    <i class="fas fa-comment-slash" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>No previous inquiries found.</p>
                </div>`;
            return;
        }

        // Sort by newest first
        messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = messages.map(msg => `
            <div class="glass-panel inquiry-item" style="padding: 20px; margin-bottom: 20px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); border-radius: 15px; transition: transform 0.3s ease;">
                <!-- Glowing background accent -->
                <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: var(--gold-text); opacity: 0.05; filter: blur(40px); border-radius: 50%;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
                    <div>
                        <h4 style="margin: 0; color: var(--gold-text); font-family: 'Cinzel', serif; font-size: 1.1rem; letter-spacing: 1px;">${msg.subject}</h4>
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                            <i class="far fa-calendar-alt" style="font-size: 0.75rem; opacity: 0.5;"></i>
                            <span style="font-size: 0.75rem; opacity: 0.5;">${new Date(msg.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <span class="status-badge ${msg.status.toLowerCase().replace(' ', '-')}">${msg.status}</span>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <p style="font-size: 0.95rem; line-height: 1.6; opacity: 0.9; margin: 0; color: #fff;">${msg.message}</p>
                </div>
                
                ${msg.reply ? `
                    <div class="admin-reply-box" style="margin-top: 20px; padding: 18px; background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; position: relative;">
                        <div style="position: absolute; top: 10px; left: -8px; width: 4px; height: calc(100% - 20px); background: var(--gold-text); border-radius: 10px;"></div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <div style="width: 30px; height: 30px; background: var(--gold-text); display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                                <i class="fas fa-user-shield" style="color: #000; font-size: 0.8rem;"></i>
                            </div>
                            <span style="font-weight: 700; font-size: 0.85rem; color: var(--gold-text); text-transform: uppercase; letter-spacing: 1px;">Official Response</span>
                            <span style="font-size: 0.7rem; opacity: 0.5; margin-left: auto;">${msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString() : ''}</span>
                        </div>
                        <p style="font-size: 0.9rem; line-height: 1.6; color: #f0f0f0; margin: 0; font-style: normal;">${msg.reply}</p>
                    </div>
                ` : `
                    <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px; opacity: 0.4; font-size: 0.8rem;">
                        <i class="fas fa-clock"></i>
                        <span>Waiting for response from our executive team...</span>
                    </div>
                `}
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color: var(--error);">Failed to load history.</p>';
    }
}

// GLOBAL UI HELPERS
window.switchTab = function (tabId, subTab = null) {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    const isAdmin = user && (user.role === 'admin' || user.email.toLowerCase() === 'admin@uwo24.com');

    // Handle settings redirection inside switchTab
    let effectiveTabId = tabId;

    // 1. Redirect Admin to Admin Settings
    if (tabId === 'settings' && isAdmin) {
        effectiveTabId = 'admin-settings';
    }

    // 2. Security: Bounce Non-Admins from Admin Sections
    if ((effectiveTabId === 'admin-settings' || effectiveTabId.startsWith('admin-')) && !isAdmin) {
        console.warn("Unauthorized access attempt blocked.");
        window.location.href = 'profile.html';
        return;
    }

    const tabBtn = document.querySelector(`.nav-item[data-tab="${effectiveTabId}"]`);
    if (tabBtn) {
        tabBtn.click();
    } else {
        document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

        const section = document.getElementById(effectiveTabId);
        if (section) section.classList.add('active');

        // Manual triggers if click() wasn't enough
        if (effectiveTabId === 'admin-settings') initializeAdminSettings();
        if (effectiveTabId === 'support') loadUserSupportHistory();
    }

    if (effectiveTabId === 'admin-settings' && subTab) {
        setTimeout(() => {
            const subTabBtn = document.querySelector(`.settings-tab-btn[data-admin-tab="${subTab}"]`);
            if (subTabBtn) subTabBtn.click();
        }, 100);
    } else if (tabId === 'settings' && subTab) {
        setTimeout(() => {
            const subTabBtn = document.querySelector(`.settings-tab-btn[data-settings-tab="${subTab}"]`);
            if (subTabBtn) subTabBtn.click();
        }, 100);
    }
};

async function initializeDashboard(user) {
    const nameDisplay = document.getElementById('user-name-display');
    if (nameDisplay) nameDisplay.textContent = user.name;

    // Sidebar User Summary
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarMember = document.getElementById('sidebar-membership');
    const sidebarAvatar = document.getElementById('sidebar-avatar');

    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarMember) {
        sidebarMember.textContent = user.membership || 'Standard Member';
        sidebarMember.className = `membership-badge ${user.membership === 'Premium' ? 'premium' : ''}`;
    }
    if (sidebarAvatar && user.profileImage) sidebarAvatar.src = user.profileImage;

    // Settings Profile Fields
    const setV2Name = document.getElementById('settings-name-v2');
    const setV2Email = document.getElementById('settings-email-v2');
    if (setV2Name) setV2Name.value = user.name;
    if (setV2Email) setV2Email.value = user.email;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateDisp = document.getElementById('current-date');
    if (dateDisp) dateDisp.textContent = new Date().toLocaleDateString('en-US', options);

    // Admin Check & Sidebar Customization
    const isAdmin = user.role === 'admin' || user.email.toLowerCase() === 'admin@uwo24.com';

    if (isAdmin) {
        // 1. Hide customer-only sidebar items
        const customerTabs = ['cart', 'orders', 'wishlist', 'notifications', 'support'];
        customerTabs.forEach(tab => {
            const btn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
            if (btn) btn.classList.add('hidden');
        });

        // 2. Hide customer-only home widgets/shortcuts
        const homeShortcuts = [
            'button[onclick*="orders"]',
            'button[onclick*="notifications"]',
            // Sidebar explicit hides for non-data-tab buttons
            'button[onclick*="addresses-tab"]',
            'button[onclick*="payments-tab"]',
            '.main-stats-col h3:has(.fa-history)', // Recent Orders Header
            '#recent-orders-mini-list',
            '.main-stats-col > .glass-panel' // Recent Orders Container
        ];

        homeShortcuts.forEach(selector => {
            try {
                const els = document.querySelectorAll(selector);
                els.forEach(el => el.classList.add('hidden'));
            } catch (e) { }
        });

        // 3. Rename "Account Settings" to "System Control" for Admins
        const settingsBtn = document.querySelector('button[data-tab="settings"]');
        if (settingsBtn) {
            const span = settingsBtn.querySelector('span');
            if (span) span.textContent = 'System Control';
        }

        // Show admin-only sidebar items
        document.querySelectorAll('.admin-nav').forEach(btn => btn.classList.remove('hidden'));
        const adminBtn = document.getElementById('sidebar-admin-btn');
        if (adminBtn) adminBtn.classList.remove('hidden');

    } else {
        // Show customer-only items for regular users
        const customerTabs = ['cart', 'orders', 'notifications'];
        customerTabs.forEach(tab => {
            const btn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
            if (btn) btn.classList.remove('hidden');
        });

        // Show home widgets
        const homeShortcuts = ['button[onclick*="orders"]', 'button[onclick*="notifications"]', '#recent-orders-mini-list'];
        homeShortcuts.forEach(selector => {
            const els = document.querySelectorAll(selector);
            els.forEach(el => el.classList.remove('hidden'));
        });

        // Hide admin-only items
        document.querySelectorAll('.admin-nav').forEach(btn => btn.classList.add('hidden'));
        const adminBtn = document.getElementById('sidebar-admin-btn');
        if (adminBtn) adminBtn.classList.add('hidden');
    }

    // Load initial data
    await fetchProfileData();
    syncLibraryWithBackend();
    updateDashboardOverview();
    loadRecommendations();
    loadRecentlyViewed();
}

window.fetchProfileData = async function () {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/api/users/profile?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profile = await res.json();

        if (res.ok) {
            window.currentUserProfile = profile;
            renderWishlistTab();
            renderNotificationsTab();
            renderSavedAddresses();
            updateDashboardOverview();
            updateStats();
        }
    } catch (e) {
        console.error("Profile fetch error:", e);
    }
}

function updateDashboardOverview() {
    const profile = window.currentUserProfile;
    if (!profile) return;

    // 1. Last Order Overview
    const lastOrderContent = document.getElementById('recent-orders-mini-list');
    if (lastOrderContent) renderLastOrderOverview(lastOrderContent);

    // 2. Continue Reading/Listening
    updateReadingProgressShortcuts();

    // 3. Active Shipments
    renderActiveShipments();

    // 4. Newest Addition
    renderNewestAddition();

    // 5. Update Profile Stats in Dashboard (NEW)
    const profileDisplayEmail = document.getElementById('profile-display-email');
    if (profileDisplayEmail) profileDisplayEmail.textContent = profile.email || 'user@example.com';
    const profileDisplayName = document.getElementById('profile-display-name');
    if (profileDisplayName) profileDisplayName.textContent = profile.name || 'Guest User';

    // Fill form fields
    const nameInput = document.getElementById('settings-name-v2');
    if (nameInput) nameInput.value = profile.name || '';
    const phoneInput = document.getElementById('settings-phone-v2');
    if (phoneInput) phoneInput.value = profile.phone || '';
    const emailInput = document.getElementById('settings-email-v2');
    if (emailInput) emailInput.value = profile.email || '';
}

async function renderLastOrderOverview(container) {
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${API_BASE}/api/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await res.json();
        if (orders && orders.length > 0) {
            const last = orders[0];
            const date = new Date(last.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            container.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="margin:0; font-size:1.1rem;">${last.orderId}</h3>
                        <p style="margin:2px 0; font-size:0.8rem; opacity:0.6;">${date} • ₹${last.totalAmount}</p>
                    </div>
                    <span class="status-badge ${getStatusClass(last.status)}">${last.status}</span>
                </div>
                <button class="btn btn-outline small" style="margin-top:10px; width:100%; border-color:rgba(255,255,255,0.1);" onclick="viewOrderDetail('${last._id}')">View Details</button>
            `;
        }
    } catch (e) { }
}

async function updateReadingProgressShortcuts() {
    const libKey = getUserKey('efv_digital_library');
    const library = JSON.parse(localStorage.getItem(libKey)) || [];
    const container = document.getElementById('continue-reading-content-v2');
    if (!container) return;

    if (library.length === 0) {
        container.innerHTML = '<p class="fade-text">Start your reading journey by browsing the store.</p>';
        return;
    }

    // Try to find an item with progress
    let target = library[0];
    for (const item of library) {
        const prog = await fetchProgress(item.productId || item.id);
        if (prog && prog.progress > 0) {
            target = { ...item, progress: prog.progress };
            break;
        }
    }

    container.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center;">
            <img src="${target.thumbnail}" style="width:60px; height:85px; object-fit:cover; border-radius:8px;">
            <div style="flex:1;">
                <h4 style="margin:0; font-size:1rem;">${target.name || target.title}</h4>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${target.progress || 0}%"></div>
                </div>
                <p style="margin:0; font-size:0.75rem; opacity:0.6;">${Math.round(target.progress || 0)}% Completed</p>
            </div>
        </div>
    `;
}

// Status helpers removed (consolidated at end)

window.syncLibraryWithBackend = async function () {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    const token = localStorage.getItem('authToken');
    if (!user || !token) return;

    try {
        const response = await fetch(`${API_BASE}/api/library/my-library`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            const libKey = getUserKey('efv_digital_library');

            // IMPORTANT: Clear localStorage and replace with clean backend data.
            // This prevents stale items (with 'id' field) from mixing with fresh
            // backend items (with 'productId' field) causing duplicates.
            localStorage.removeItem(libKey);

            const localLibrary = data.map(prod => ({
                id: prod.productId || prod._id || prod.id,        // keep 'id' field for cart.js compatibility
                productId: prod.productId || prod._id || prod.id, // keep 'productId' for profile.js
                name: prod.title || prod.name,
                title: prod.title || prod.name,
                type: prod.type,
                thumbnail: prod.thumbnail,
                filePath: prod.filePath,
                language: prod.language || '',
                subtitle: prod.subtitle || '',
                date: prod.purchasedAt ? new Date(prod.purchasedAt).toLocaleDateString() : new Date().toLocaleDateString()
            }));
            localStorage.setItem(libKey, JSON.stringify(localLibrary));

            const activeSub = document.querySelector('.library-sub-tab.active');
            if (activeSub) {
                filterLibraryView(activeSub.dataset.libraryTab);
            } else {
                renderLibraryTab(localLibrary);
            }
            updateStats();
        }
    } catch (error) { console.error('Library sync error:', error); }
}


// --- TAB RENDERING: NOTIFICATIONS ---
function renderNotificationsTab(filter = 'all') {
    const profile = window.currentUserProfile;
    const container = document.getElementById('notifications-list');
    const emptyState = document.getElementById('notifications-empty-state');
    const badge = document.getElementById('unread-notifications-count');

    if (!profile || !profile.notifications || profile.notifications.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (badge) badge.classList.add('hidden');
        return;
    }

    let notifications = [...profile.notifications];

    // Pin Welcome notification to top, rest sorted by newest first
    const welcomeNotes = notifications.filter(n =>
        (n.title || '').toLowerCase().includes('welcome') || (n.message || '').toLowerCase().includes('welcome')
    );
    const otherNotes = notifications.filter(n =>
        !(n.title || '').toLowerCase().includes('welcome') && !(n.message || '').toLowerCase().includes('welcome')
    );
    otherNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    notifications = [...welcomeNotes, ...otherNotes];

    // Apply filter
    if (filter !== 'all') {
        notifications = notifications.filter(n => {
            // Mapping UI filters to notification types
            if (filter === 'orders') return n.type === 'Order' || n.type === 'Shipment';
            if (filter === 'payments') return n.type === 'Payment' || n.type === 'Subscription';
            if (filter === 'offers') return n.type === 'Promo' || n.type === 'Digital';
            return true;
        });
    }

    if (notifications.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    const unreadCount = profile.notifications.filter(n => !n.isRead).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    container.innerHTML = notifications.map(note => {
        const icon = getNotificationIcon(note.type);
        const noteId = note._id || note.id || `temp-${Date.now()}-${Math.random()}`;

        // Don't show delete button for welcome messages
        const isWelcome = note.title.toLowerCase().includes('welcome') ||
            note.message.toLowerCase().includes('welcome');

        return `
            <div class="notification-item ${note.isRead ? '' : 'unread'}" onclick="markNotificationRead('${noteId}')">
                <div class="notification-icon ${note.type.toLowerCase()}">${icon}</div>
                <div class="notification-body">
                    <h5>${note.title}</h5>
                    <p>${note.message}</p>
                    <span class="notification-time">${new Date(note.createdAt).toLocaleString()}</span>
                </div>
                ${!isWelcome ? `
                    <button class="notification-delete-btn" onclick="deleteNotification(event, '${noteId}')" title="Delete Notification">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getNotificationIcon(type) {
    switch (type) {
        case 'Order': return '<i class="fas fa-shopping-bag"></i>';
        case 'Shipment': return '<i class="fas fa-truck"></i>';
        case 'Digital': return '<i class="fas fa-play-circle"></i>';
        default: return '<i class="fas fa-bell"></i>';
    }
}

window.markNotificationRead = async function (id) {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_BASE}/api/users/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchProfileData();
}

window.markAllNotificationsRead = async function () {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_BASE}/api/users/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchProfileData();
}

window.deleteNotification = async function (event, id) {
    if (event) event.stopPropagation(); // Prevent marking as read

    console.log(`🗑️ Delete button clicked for ID: ${id}`);

    // Optimistic UI: Remove from screen immediately
    const noteElement = event.target.closest('.notification-item');
    if (noteElement) {
        noteElement.style.transition = 'all 0.4s ease';
        noteElement.style.opacity = '0';
        noteElement.style.transform = 'translateX(50px)';
        setTimeout(() => noteElement.remove(), 400);
    }

    try {
        console.log(`📤 Sending DELETE request for notification: ${id}`);
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/users/notifications/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        console.log("📥 Server response:", data);

        if (res.ok) {
            console.log("Successfully deleted from server");
            // Also purge from in-memory profile so re-renders don't resurrect it
            if (window.currentUserProfile && window.currentUserProfile.notifications) {
                window.currentUserProfile.notifications = window.currentUserProfile.notifications.filter(n => {
                    const nId = (n._id || n.id || '').toString();
                    return nId !== id.toString() &&
                        nId.replace(/-/g, '_') !== id.toString() &&
                        nId.replace(/_/g, '-') !== id.toString();
                });
            }
        } else {
            console.error(`Delete fail (${res.status}):`, data);
            showToast(data.message || `Failed to delete from server`, 'error');
            // Re-fetch to bring back the item if it failed
            fetchProfileData();
        }
    } catch (e) {
        console.error("Delete notification error:", e);
        // Re-fetch to bring back the item if it failed
        fetchProfileData();
    }
}

// --- SET DEFAULT ADDRESS ---
window.setAsDefaultAddress = async function (id) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/users/address/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isDefault: true })
        });

        if (res.ok) {
            showToast('Default address updated!', 'success');
            fetchProfileData();
        } else {
            showToast('Failed to update default address', 'error');
        }
    } catch (e) {
        console.error("Set default address error:", e);
        showToast('Error connecting to server', 'error');
    }
}

// --- TAB RENDERING: ADDRESSES ---
window.renderSavedAddresses = function () {
    const profile = window.currentUserProfile;
    const container = document.getElementById('saved-addresses-grid-v2');
    if (!container) return;

    // Clear skeletons
    container.innerHTML = '';

    if (!profile || !profile.savedAddresses || profile.savedAddresses.length === 0) {
        container.innerHTML = `
            <div class="address-card glass-panel" style="grid-column: 1 / -1; padding: 40px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); width: 100%;">
                <i class="fas fa-map-marked-alt" style="font-size: 2rem; opacity: 0.1; margin-bottom: 15px;"></i>
                <p class="fade-text">No saved addresses found. Add one to speed up checkout.</p>
            </div>`;
        return;
    }

    container.style.display = 'grid';
    container.style.gap = '20px';
    container.style.gridTemplateColumns = '1fr';

    container.innerHTML = profile.savedAddresses.map(addr => {
        const addrId = addr._id || addr.id;
        return `
        <div class="address-card ${addr.isDefault ? 'default' : ''}" style="margin-bottom: 25px; padding: 20px; border-radius: 12px; background: rgba(10, 10, 10, 0.4); border: 1px solid ${addr.isDefault ? '#FFD700' : 'rgba(255, 211, 105, 0.15)'}; box-shadow: none; cursor: ${addr.isDefault ? 'default' : 'pointer'};" ${!addr.isDefault ? `onclick="setAsDefaultAddress('${addrId}')"` : ''}>
            <h5 style="color:var(--gold-text); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span>${addr.type || 'Home'} ${addr.isDefault ? '<span class="default-badge" style="font-size: 0.65rem; background: #FFD700; color: black; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Default</span>' : ''}</span>
                <i class="fas ${addr.type === 'Work' ? 'fa-briefcase' : 'fa-home'}" style="opacity:0.3;"></i>
            </h5>
            <p class="address-text">
                <strong>${addr.fullName}</strong><br>
                ${addr.house}, ${addr.area}<br>
                ${addr.landmark ? `<span style="font-size:0.8rem; opacity:0.6;">Landmark: ${addr.landmark}</span><br>` : ''}
                ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                Phone: ${addr.phone}
            </p>
            <div class="address-actions" style="margin-top:15px; display:flex; gap:10px;">
                ${!addr.isDefault ? `<button class="btn btn-outline small" onclick="event.stopPropagation(); setAsDefaultAddress('${addrId}')">Set Default</button>` : ''}
                <button class="btn btn-outline small" onclick="event.stopPropagation(); openAddressModal('${addrId}')">Edit</button>
                <button class="btn btn-danger small" style="background:rgba(255,0,0,0.1); border-color:rgba(255,0,0,0.2); color:#ff6b6b;" onclick="event.stopPropagation(); deleteAddress('${addrId}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    }).join('');
}

// --- TAB RENDERING: ORDERS ---
async function renderOrdersTab(filter = 'all') {
    const token = localStorage.getItem('authToken');
    const container = document.getElementById('dashboard-orders-list');
    const emptyState = document.getElementById('orders-empty-state');
    if (!container) return;

    container.innerHTML = `<div class="skeleton" style="height: 150px; border-radius: 12px; margin-bottom: 20px;"></div>`;

    try {
        const res = await fetch(`${API_BASE}/api/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        let orders = res.ok ? await res.json() : [];

        // Apply filters
        if (filter !== 'all') {
            orders = orders.filter(o => o.status.toLowerCase() === filter.toLowerCase());
        }

        if (orders.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        container.innerHTML = orders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            const statusClass = `status-${order.status.toLowerCase().replace(/\s/g, '-')}`;

            // Format items as a professional list
            const itemsHtml = order.items.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-size: 0.9rem; font-weight: 600; color: #fff;">${item.title}</span>
                        <span style="font-size: 0.72rem; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.5px;">${item.type} • Qty: ${item.quantity}</span>
                    </div>
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--gold-text);">₹${item.price * item.quantity}</span>
                </div>
            `).join('');

            return `
                <div class="glass-panel fade-in" style="padding: 24px; border-radius: 18px; margin-bottom: 25px; border: 1px solid rgba(255,211,105,0.08); position: relative; overflow: hidden; background: linear-gradient(145deg, rgba(30,30,30,0.4) 0%, rgba(20,20,20,0.6) 100%);">
                    <!-- Top Ribbon for Status -->
                    <div style="position:absolute; top: 0; right: 0; padding: 6px 20px; border-bottom-left-radius: 12px; font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;" class="${statusClass}">
                        ${order.status}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div>
                            <span style="font-size: 0.7rem; opacity: 0.4; letter-spacing: 1px; text-transform: uppercase; display:block; margin-bottom: 4px;">Order Tracking ID</span>
                            <h3 style="margin: 0; font-family: 'Cinzel'; color: var(--gold-text); font-size: 1.2rem; filter: drop-shadow(0 0 10px rgba(212,175,55,0.1));">#${order.orderId}</h3>
                            <p style="margin: 8px 0 0; font-size: 0.8rem; opacity: 0.5;"><i class="far fa-calendar-alt"></i> ${date}</p>
                        </div>
                        <div style="text-align: right; padding-top: 15px;">
                            <span style="font-size: 0.7rem; opacity: 0.4; display:block; margin-bottom: 4px;">TOTAL AMOUNT</span>
                            <h2 style="margin: 0; color: #fff; font-weight: 800;">₹${order.totalAmount.toLocaleString()}</h2>
                        </div>
                    </div>
                    
                    <div style="padding: 15px 20px; background: rgba(0,0,0,0.2); border-radius: 14px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                        <div style="margin-bottom: 10px; opacity: 0.4; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px;">ORDERED ITEMS (${order.items.length})</div>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${itemsHtml}
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                        
                        ${(order.status !== 'Cancelled' && order.status !== 'Failed') ? `
                            <a href="tracking.html?id=${order.orderId}" target="_blank" class="btn btn-outline small" style="border-radius: 8px; border-color: rgba(255,211,105,0.3); color: var(--gold-text); text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                                <i class="fas fa-satellite-dish"></i> Track Order
                            </a>
                            <button class="btn btn-outline small" style="border-radius: 8px;" onclick="viewOrderDetail('${order._id}', 'details')">
                                <i class="fas fa-list-ul" style="margin-right:6px;"></i> Details
                            </button>
                            <button class="btn btn-gold small" style="border-radius: 8px; box-shadow: 0 4px 15px rgba(212,175,55,0.2);" onclick="downloadInvoice('${order._id}')">
                                <i class="fas fa-file-invoice" style="margin-right:6px;"></i> Invoice
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error rendering orders:', e);
        container.innerHTML = '<p>Failed to load orders.</p>';
    }
}

// --- TAB RENDERING: LIBRARY ---
// --- TAB RENDERING: LIBRARY ---
function renderLibraryTab(directData = null, typeFilter = null) {
    const libKey = getUserKey('efv_digital_library');
    let library = directData || JSON.parse(localStorage.getItem(libKey)) || [];

    // Deduplicate Library Items - normalize all items first so different key formats
    // ('id' from cart.js vs 'productId' from backend) all map to the same canonical key.
    const uniqueMap = new Map();
    library = library
        .map(item => {
            const prodId = (item.productId || item.id || item._id || '').toString();
            const title = (item.name || item.title || '').trim();
            const type = (item.type || '').split(' ')[0].split('-')[0].toLowerCase(); // Normalized type prefix (e-book -> e, audiobook -> a)

            return {
                ...item,
                productId: prodId,
                id: prodId,
                title: title,
                name: title,
                // Create a truly unique key: Name + Simplified Type
                // This prevents "Dummy ID" and "Real ID" versions of the same book from co-existing
                uniqueContentKey: `${title}_${type}_${item.language || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '_')
            };
        })
        .filter(item => {
            if (!item.productId && !item.uniqueContentKey) return false;

            // Deduplicate by Content Key (Name + Type) - most reliable
            const key = item.uniqueContentKey;
            if (uniqueMap.has(key)) return false;
            uniqueMap.set(key, true);
            return true;
        });

    const container = document.getElementById('dashboard-library-list');
    const emptyState = document.getElementById('library-empty-state');

    // Apply type filter if specified
    if (typeFilter === 'ebook') {
        library = library.filter(item => !(item.type || '').toLowerCase().includes('audio'));
    } else if (typeFilter === 'audio') {
        library = library.filter(item => (item.type || '').toLowerCase().includes('audio'));
    }

    if (library.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    // Fetch all progress data in parallel first to avoid overlapping appends
    Promise.all(library.map(async (item) => {
        const prodId = item.productId || item.id || item._id;
        const progress = await fetchProgress(prodId);

        const rawType = (item.type || '').toLowerCase();
        const isAudio = rawType.includes('audio');
        const actionLabel = isAudio ? 'Listen Now' : 'Read Now';
        const icon = isAudio ? 'fa-headphones' : 'fa-book-open';

        let progressHtml = '';
        if (progress) {
            const percent = progress.progress || 0;
            progressHtml = `
                <div class="card-progress-container" style="margin-top:10px;">
                    <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>${Math.round(percent)}% Complete</span>
                    </div>
                    <div style="height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: var(--gold-text); border-radius: 2px;"></div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="dashboard-card fade-in">
                <div class="card-image-container">
                    <span class="card-type-badge">${item.type}</span>
                    <img src="${item.thumbnail || 'img/vol1-cover.png'}" alt="${item.name}" class="card-image" onerror="this.src='img/vol1-cover.png'">
                </div>
                <div class="card-details">
                    ${item.language ? `<span style="display:inline-block; background: rgba(212,175,55,0.15); border: 1px solid var(--gold-energy); color: var(--gold-energy); padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-bottom: 5px; text-transform: uppercase;">${item.language} Edition</span>` : ''}
                    <h3 class="card-title">${item.name || item.title}</h3>
                    <p class="card-subtitle">Purchased: ${item.date || 'Recently'}</p>
                    ${progressHtml}
                    <div class="card-actions" style="margin-top:auto; padding-top:10px; display:flex; gap:10px;">
                        <button class="btn-dashboard btn-primary" onclick="accessContent('${item.type}', '${(item.name || item.title).replace(/'/g, "\\'")}', '${prodId}')" style="flex:1;">
                            <i class="fas ${icon}"></i> ${actionLabel}
                        </button>
                        <button class="btn-dashboard" onclick="removeFromLibrary('${prodId}')" style="background: rgba(255, 77, 77, 0.1); border: 1px solid rgba(255, 77, 77, 0.2); color: #ff4d4d; border-radius: 8px; width: 44px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; cursor: pointer;" onmouseenter="this.style.background='rgba(255,77,77,0.2)'" onmouseleave="this.style.background='rgba(255,77,77,0.1)'" title="Remove from Library">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    })).then(cardsHtml => {
        container.innerHTML = cardsHtml.join('');
    });
}

window.removeFromLibrary = async function (prodId) {
    if (!confirm('Are you sure you want to remove this item from your library? This will permanently delete it.')) return;

    const token = localStorage.getItem('authToken');
    let backendSuccess = false;

    try {
        if (token) {
            const res = await fetch(`${API_BASE}/api/library/my-library/${prodId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                backendSuccess = true;
                console.log('✅ Item permanently removed from library backend');
            } else {
                const errData = await res.json().catch(() => ({}));
                console.warn('Backend delete failed:', errData.message);
                // Still remove from localStorage even if not found on backend
            }
        }
    } catch (e) {
        console.warn('Backend delete error:', e);
    }

    // Always remove from localStorage for instant UI update
    const libKey = getUserKey('efv_digital_library');
    let library = JSON.parse(localStorage.getItem(libKey)) || [];
    library = library.filter(item => {
        const id = (item.productId || item.id || item._id || '').toString();
        return id !== prodId.toString();
    });
    localStorage.setItem(libKey, JSON.stringify(library));
    renderLibraryTab();
    if (typeof updateStats === 'function') updateStats();
    if (backendSuccess) showToast('Item permanently removed from library', 'success');
};

function updateStats() {
    const profile = window.currentUserProfile;
    if (!profile) return;

    const libKey = getUserKey('efv_digital_library');
    const library = JSON.parse(localStorage.getItem(libKey)) || [];

    const statDigital = document.getElementById('stat-total-digital');
    if (statDigital) statDigital.textContent = library.length;

    const token = localStorage.getItem('authToken');
    fetch(`${API_BASE}/api/orders/my-orders`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(orders => {
            const statOrders = document.getElementById('stat-total-orders');
            if (statOrders) statOrders.textContent = orders.length;

            const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
            const statSpent = document.getElementById('stat-total-spent');
            if (statSpent) statSpent.textContent = '₹' + totalSpent.toLocaleString();
        }).catch(err => console.warn("Stats fetch failed", err));
}

// --- TAB RENDERING: CART ---
// --- ACTIONS --- (Moved to end for consistency)

// --- ACTIONS ---

window.buyNowFromDashboard = function (id) {
    const cartKey = getUserKey('efv_cart');
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const item = cart.find(i => i.id === id);
    if (!item) return;

    initiateDashboardCheckout([item], true, id);
};

// --- SECURE MULTI-STEP CHECKOUT SYSTEM ---
window.checkoutState = {
    items: [],
    selectedAddressId: null,
    isSingleItemMode: false,
    cartIdToRemove: null
};

window.initiateDashboardCheckout = async function (items, isSingleItemMode = false, cartIdToRemove = null) {
    if (!items || items.length === 0) {
        showToast("No items to checkout", "error");
        return;
    }

    window.checkoutState = {
        items: items,
        selectedAddressId: null,
        isSingleItemMode: isSingleItemMode,
        cartIdToRemove: cartIdToRemove
    };

    const overlay = document.getElementById('checkout-overlay');
    const container = document.getElementById('checkout-container-v2');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.classList.add('modal-open');
        if (container) {
            container.classList.add('step-1');
            container.classList.remove('step-2');
        }
        renderCheckoutPricing();
        renderCheckoutAddresses();
        backToAddress(); // Reset to step 1
    }
};

window.closeCheckout = () => {
    const overlay = document.getElementById('checkout-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
};

function renderCheckoutPricing() {
    const items = window.checkoutState.items;
    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.price) * (parseInt(i.quantity) || 1)), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    if (document.getElementById('chk-subtotal')) document.getElementById('chk-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    if (document.getElementById('chk-tax')) document.getElementById('chk-tax').textContent = `₹${tax.toFixed(2)}`;
    if (document.getElementById('chk-total')) document.getElementById('chk-total').textContent = `₹${total.toFixed(2)}`;
}

window.renderCheckoutAddresses = function () {
    const profile = window.currentUserProfile;
    const list = document.getElementById('checkout-address-list');
    if (!list) return;

    if (!profile || !profile.savedAddresses || profile.savedAddresses.length === 0) {
        list.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 40px; text-align: center; border: 2px dashed rgba(212, 175, 55, 0.2); border-radius: 20px; background: rgba(212, 175, 55, 0.02);">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: var(--gold-text); margin-bottom: 20px; opacity: 0.5;"></i>
                <h3 style="margin-bottom: 10px;">No saved addresses</h3>
                <p style="opacity:0.6; margin-bottom: 25px;">Please add a delivery address to proceed with your order.</p>
                <button class="btn btn-gold" onclick="openAddressModal()">Add New Address</button>
            </div>`;

        // Auto-popup for a smoother flow if no addresses exist
        setTimeout(() => {
            if (document.getElementById('checkout-overlay').style.display === 'flex') {
                openAddressModal();
            }
        }, 500);
        return;
    }

    list.innerHTML = profile.savedAddresses.map(addr => {
        const id = addr._id || addr.id;
        const isSelected = window.checkoutState.selectedAddressId === id || (addr.isDefault && !window.checkoutState.selectedAddressId);
        if (isSelected && !window.checkoutState.selectedAddressId) window.checkoutState.selectedAddressId = id;

        return `
            <div class="checkout-address-card ${isSelected ? 'selected' : ''}" 
                 onclick="selectCheckoutAddress('${id}')" 
                 style="padding: 20px; margin-bottom: 20px; cursor: pointer; background: rgba(10, 10, 10, 0.4); border: 1px solid ${isSelected ? 'var(--gold-text)' : 'rgba(255,255,255,0.05)'}; transition: all 0.2s; position: relative; border-radius: 12px; box-shadow: none;">
                <div style="position: absolute; top: 15px; right: 15px;">
                    <i class="fas ${isSelected ? 'fa-check-circle' : 'fa-circle'}" style="color: ${isSelected ? 'var(--gold-text)' : 'rgba(255,255,255,0.1)'};"></i>
                </div>
                <h5 style="margin: 0 0 10px; color: ${isSelected ? 'var(--gold-text)' : '#fff'}; font-size: 0.95rem;">${addr.type || 'Home'}</h5>
                <p style="font-size: 0.85rem; opacity: 0.8; margin: 0; line-height: 1.5;">
                    <strong>${addr.fullName}</strong><br>
                    ${addr.house}, ${addr.area}<br>
                    ${addr.city}, ${addr.state} - ${addr.pincode}
                </p>
            </div>
        `;
    }).join('');

    document.getElementById('btn-confirm-address').disabled = !window.checkoutState.selectedAddressId;
};

window.selectCheckoutAddress = (id) => {
    window.checkoutState.selectedAddressId = id;
    renderCheckoutAddresses();
};

window.continueToSummary = () => {
    const step1 = document.getElementById('checkout-step-address');
    const step2 = document.getElementById('checkout-step-summary');
    const container = document.getElementById('checkout-container-v2');
    const pricingCol = document.querySelector('.checkout-pricing-col');

    if (step1 && step2) {
        step1.style.display = 'none';
        step1.classList.remove('active');

        step2.style.opacity = '1';
        step2.style.pointerEvents = 'all';
        step2.style.display = 'block';
        step2.classList.add('active');

        if (container) {
            container.classList.remove('step-1');
            container.classList.add('step-2');
        }
        if (pricingCol) pricingCol.style.display = 'block';

        renderCheckoutSummaryItems();
    }
};

window.backToAddress = () => {
    const step1 = document.getElementById('checkout-step-address');
    const step2 = document.getElementById('checkout-step-summary');
    const container = document.getElementById('checkout-container-v2');
    const pricingCol = document.querySelector('.checkout-pricing-col');

    if (step1 && step2) {
        step1.style.opacity = '1';
        step1.style.pointerEvents = 'all';
        step1.style.display = 'block';
        step1.classList.add('active');

        step2.style.display = 'none';
        step2.classList.remove('active');

        if (container) {
            container.classList.add('step-1');
            container.classList.remove('step-2');
        }
        if (pricingCol) pricingCol.style.display = 'none';
    }
};

function renderCheckoutSummaryItems() {
    const list = document.getElementById('checkout-items-summary');
    const items = window.checkoutState.items;

    if (list) {
        list.innerHTML = items.map(item => {
            // Mapping specifications for premium view
            const edition = item.type === 'PHYSICAL' ? 'Hardcover Edition' : (item.type === 'EBOOK' ? 'Digital eBook' : 'Audiobook');
            const subtotal = (parseFloat(item.price) * (parseInt(item.quantity) || 1)).toFixed(2);
            const originalPrice = (parseFloat(item.price) * 2).toFixed(2); // Mocking original price

            return `
                <div class="premium-summary-card" style="margin-bottom: 15px;">
                    <div class="premium-summary-image-col">
                        <img src="${item.thumbnail || 'img/vol1-cover.png'}" onerror="this.src='img/vol1-cover.png'">
                    </div>
                    <div class="premium-summary-details">
                        <div class="edition-text" style="margin-bottom: 4px;">${edition}</div>
                        <h2 style="margin-bottom: 4px;">${item.name || item.title}</h2>
                        <div style="display:flex; align-items:center; gap:8px; margin: 4px 0;">
                            <span style="background:var(--gold-text); color:black; padding:1px 5px; border-radius:4px; font-weight:800; font-size:0.7rem;">4.8 ★</span>
                            <span style="opacity:0.6; font-size:0.75rem;">2,450 Reviews</span>
                        </div>
                        <div class="price-row" style="margin: 5px 0;">
                            ₹${item.price} <span style="font-size:0.8rem;">₹${originalPrice}</span>
                        </div>

                        <div style="background: rgba(255,255,255,0.02); border-radius:10px; padding:8px 12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="color:var(--gold-text); font-weight:700; font-size:0.8rem;">Qty:</span>
                                <span style="font-weight:800; font-size:0.8rem;">${item.quantity}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:0.8rem;">
                                <span style="opacity:0.6;">Subtotal:</span>
                                <span style="font-weight:700;">₹${subtotal}</span>
                            </div>
                        </div>

                        <div class="premium-summary-spec-grid" style="padding-top:10px;">
                            <div class="premium-summary-spec-item" style="font-size:0.75rem;">Form <strong>${item.type || 'Physical'}</strong></div>
                            <div class="premium-summary-spec-item" style="font-size:0.75rem;">Lang <strong>${item.language || 'Hindi'}</strong></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    const addr = window.currentUserProfile.savedAddresses.find(a => (a._id || a.id) === window.checkoutState.selectedAddressId);
    if (addr && document.getElementById('selected-address-preview')) {
        document.getElementById('selected-address-preview').innerHTML = `
                <strong>${addr.fullName}</strong> | ${addr.phone}<br>
                ${addr.house}, ${addr.area}, ${addr.city}, ${addr.state} - ${addr.pincode}
            `;
    }
}

window.proceedToPayment = async function () {
    const items = window.checkoutState.items;
    const addressId = window.checkoutState.selectedAddressId;
    const user = window.currentUserProfile;

    if (!addressId) {
        showToast("Please select a delivery address", "error");
        return;
    }

    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.price) * (parseInt(i.quantity) || 1)), 0);
    const tax = subtotal * 0.18;
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;

    try {
        const token = localStorage.getItem('authToken');
        // Create Order on Backend (Cashfree)
        const cfRes = await fetch(`${API_BASE}/api/orders/cashfree`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: totalAmount,
                customerName: user.name,
                customerEmail: user.email,
                customerPhone: user.phone || '0000000000'
            })
        });
        const cfOrderData = await cfRes.json();
        if (!cfRes.ok) {
            console.error('Cashfree API Error Details:', cfOrderData.error);
            throw new Error(cfOrderData.message || 'Cashfree init failed');
        }

        const cashfree = Cashfree({
            mode: "sandbox" // Change to "production" in live
        });

        let checkoutOptions = {
            paymentSessionId: cfOrderData.payment_session_id,
            redirectTarget: "_self",
        };

        // Note: For real environment, we'd need to handle verification after return.
        // For now, let's trigger the checkout.
        cashfree.checkout(checkoutOptions);

    } catch (e) {
        showToast('Checkout Failed: ' + e.message, 'error');
    }
};

window.accessContent = function (type, name, id) {
    console.log(`📂 Accessing Content | Requested Type: ${type} | Name: ${name} | ID: ${id}`);
    if (typeof accessDigitalContent === 'function') {
        accessDigitalContent(name, id, type); // Pass type
    } else {
        console.error("Secure Content System not loaded");
        alert("System update in progress. Please refresh.");
    }
};

// --- SECURE DIGITAL CONTENT SYSTEM ---

// Configuration
const CONTENT_CONFIG = {
    pdfWorkerSrc: 'js/pdfjs/pdf.worker.min.js',
    contentApi: `${API_BASE}/api/content`,
    progressApi: `${API_BASE}/api/progress`
};

// --- PDF READER IMPLEMENTATION (Vertical Scroll) ---
window.openEbookReader = async function (product) {
    const readerId = 'efv-reader-modal';
    if (document.getElementById(readerId)) return;

    // 1. Fetch saved progress
    let savedState = await fetchProgress(product._id);
    let lastLoadedPage = savedState?.lastPage || 1;
    let totalPages = 0;
    let pdfDoc = null;
    let scale = 1.5;

    // 2. Create Reader UI
    const readerHtml = `
        <div id="${readerId}" class="reader-overlay" oncontextmenu="return false;">
            <div class="reader-toolbar glass-panel">
                <div class="reader-title">${product.name}</div>
                <div class="reader-controls">
                    <span id="page-indicator">Scroll to Read</span>
                    <button class="btn-icon" id="close-reader" title="Close"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="reader-canvas-container" id="reader-container">
                <!-- Pages will be injected here -->
            </div>
            <div class="reader-loading">
                <div class="reader-spinner"></div>
                <p>Loading Secure Content...</p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', readerHtml);

    // SECURITY: Actively start protection before rendering begins
    if (window.efvSecurity) {
        window.efvSecurity.enable();
    }
    document.getElementById(readerId).classList.add('no-select');

    const container = document.getElementById('reader-container');
    const indicator = document.getElementById('page-indicator');
    const loading = document.querySelector('.reader-loading');

    // 3. Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = CONTENT_CONFIG.pdfWorkerSrc;

    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Please re-login");

        const effectiveId = product._id || product.id;
        let url = `${CONTENT_CONFIG.contentApi}/ebook/${effectiveId}?token=${token}&t=${Date.now()}`;

        const loadingTask = pdfjsLib.getDocument({
            url: `${url}&pdfjs_cache_buster=${Date.now()}`,
            httpHeaders: { 'Authorization': `Bearer ${token}` }
        });

        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        loading.style.display = 'none';

        // 4. Create Page Wrappers
        for (let i = 1; i <= totalPages; i++) {
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'pdf-page-wrapper';
            pageWrapper.dataset.pageNumber = i;
            pageWrapper.id = `page-${i}`;

            const canvas = document.createElement('canvas');
            pageWrapper.appendChild(canvas);
            container.appendChild(pageWrapper);
        }

        // 5. Intersection Observer for Lazy Rendering & Progress tracking
        const observerOptions = {
            root: container,
            threshold: [0.1, 0.5] // Track multiple points
        };

        const pageObserver = new IntersectionObserver((entries) => {
            // Find the page that is most visible
            const visiblePages = entries
                .filter(e => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

            if (visiblePages.length > 0) {
                const entry = visiblePages[0];
                const pageNum = parseInt(entry.target.dataset.pageNumber);

                renderPageToCanvas(pageNum);

                // Update indicator if high confidence
                if (entry.intersectionRatio > 0.4 || visiblePages.length === 1) {
                    indicator.textContent = `Page ${pageNum} of ${totalPages}`;

                    // Debounced sync to avoid spamming server
                    if (window._syncTimeout) clearTimeout(window._syncTimeout);
                    window._syncTimeout = setTimeout(() => {
                        const calculatedProgress = (pageNum / totalPages) * 100;
                        syncProgress(product._id, 'EBOOK', {
                            lastPage: pageNum,
                            totalPages: totalPages,
                            progress: calculatedProgress
                        });
                    }, 1000);
                }
            }
        }, observerOptions);

        // Observe all page wrappers
        document.querySelectorAll('.pdf-page-wrapper').forEach(wrapper => {
            pageObserver.observe(wrapper);
        });

        // 6. Resume to last page if requested (Custom Professional Modal)
        if (lastLoadedPage > 1) {
            const resumeModalHtml = `
            <div id="ebook-resume-overlay" class="resume-modal-overlay active">
                <div class="resume-modal">
                    <i class="fas fa-book-open"></i>
                    <h3>Continue Reading?</h3>
                    <p>You previously read up to <span style="color:white; font-weight:bold;">Page ${lastLoadedPage}</span>.<br>Continue from where you left off?</p>
                    <div class="resume-actions">
                        <button id="btn-ebook-resume" class="btn-resume-primary">
                            <i class="fas fa-bookmark"></i> Continue from Page ${lastLoadedPage}
                        </button>
                        <button id="btn-ebook-restart" class="btn-resume-secondary">
                            <i class="fas fa-redo"></i> Start from Beginning
                        </button>
                    </div>
                </div>
            </div>
        `;
            document.getElementById(readerId).insertAdjacentHTML('beforeend', resumeModalHtml);

            document.getElementById('btn-ebook-resume').addEventListener('click', () => {
                document.getElementById('ebook-resume-overlay').remove();
                setTimeout(() => {
                    const targetPage = document.getElementById(`page-${lastLoadedPage}`);
                    if (targetPage) targetPage.scrollIntoView();
                }, 500);
            });

            document.getElementById('btn-ebook-restart').addEventListener('click', () => {
                document.getElementById('ebook-resume-overlay').remove();
                container.scrollTop = 0;
                syncProgress(product._id, 'EBOOK', { lastPage: 1, totalPages: totalPages });
            });
        }

    } catch (error) {
        console.error("Reader Error:", error);
        alert("Failed to load PDF. Please ensure you are logged in.");
        document.getElementById(readerId).remove();
        return;
    }

    async function renderPageToCanvas(num) {
        const wrapper = document.getElementById(`page-${num}`);
        const canvas = wrapper.querySelector('canvas');
        if (wrapper.dataset.rendered === 'true') return;

        try {
            const page = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: scale });
            const ctx = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            wrapper.dataset.rendered = 'true';
        } catch (err) {
            console.error(`Page ${num} rendering failed`, err);
        }
    }

    // 7. Event Listeners
    document.getElementById('close-reader').addEventListener('click', () => {
        document.getElementById(readerId).remove();
        if (window.efvSecurity) window.efvSecurity.disable(); // Stop protection when closing
        // Refresh library tab to show new progress
        renderLibraryTab();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById(readerId)) {
            document.getElementById(readerId).remove();
        }
    });
};

// --- PREMIUM MODAL EXTRAS ---

// File Input Listeners for Previews
window.updateFilePreview = function (input) {
    const id = input.id;
    const previewId = {
        'admin-file-cover': 'admin-current-cover',
        'admin-file-gallery': 'admin-current-gallery',
        'admin-file-ebook': 'admin-current-ebook',
        'admin-file-audio': 'admin-current-audio'
    }[id];
    const preview = document.getElementById(previewId);
    if (!preview) return;

    if (input.files && input.files.length > 0) {
        const count = input.files.length;
        const names = Array.from(input.files).map(f => f.name).join(', ');
        preview.innerHTML = `<i class="fas fa-check-circle success-icon" style="color:#D4AF37;"></i> ${count} selected: ${names}`;
    } else {
        preview.innerHTML = '';
    }
};

// Attach listeners
['admin-file-cover', 'admin-file-gallery', 'admin-file-ebook', 'admin-file-audio'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => window.updateFilePreview(el));
});

// Drag & Drop Feedback
document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    ['dragleave', 'drop'].forEach(evt => {
        zone.addEventListener(evt, () => zone.classList.remove('drag-over'));
    });
});

// Particle Background Animation
window.initModalParticles = function () {
    const canvas = document.getElementById('modal-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.4;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 50; i++) particles.push(new Particle());

    function animate() {
        const modal = document.getElementById('admin-product-modal');
        if (!modal || !modal.classList.contains('active')) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
};

// Admin Product Modal Open/Close
window.openProductModal = function (productId = null) {
    const modal = document.getElementById('admin-product-modal');
    const form = document.getElementById('admin-product-form');
    const title = document.getElementById('admin-modal-title');
    const saveBtn = document.getElementById('admin-save-btn');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('admin-prod-id').value = '';
    document.getElementById('admin-current-cover').innerHTML = '';
    document.getElementById('admin-current-ebook').innerHTML = '';
    document.getElementById('admin-current-audio').innerHTML = '';
    document.getElementById('admin-file-cover').value = '';
    document.getElementById('admin-file-ebook').value = '';
    document.getElementById('admin-file-audio').value = '';

    // Reset file fields visibility
    toggleAdminFileFields('HARDCOVER'); // Default to physical fields

    if (productId) {
        title.textContent = 'Edit Product';
        saveBtn.textContent = 'Update Product';
        window.editProduct(productId); // Load product data
    } else {
        title.textContent = 'Add New Product';
        saveBtn.textContent = 'Add Product';
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
    window.initModalParticles(); // Start particle animation
};

// Edit Product Logic
window.editProduct = async function (productId) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const product = await res.json();

        if (!res.ok) throw new Error(product.message || 'Failed to fetch product');

        document.getElementById('admin-prod-id').value = product._id;
        document.getElementById('admin-prod-title').value = product.title;
        document.getElementById('admin-prod-author').value = product.author || '';
        document.getElementById('admin-prod-type').value = product.type;
        document.getElementById('admin-prod-lang').value = product.language || 'Hindi';
        document.getElementById('admin-prod-volume').value = product.volume || '';
        document.getElementById('admin-prod-price').value = product.price;
        document.getElementById('admin-prod-discount-price').value = product.discountPrice || '';
        document.getElementById('admin-prod-stock').value = product.stock || 0;
        document.getElementById('admin-prod-weight').value = product.weight || 0;
        document.getElementById('admin-prod-length').value = product.length || 0;
        document.getElementById('admin-prod-width').value = product.breadth || 0;
        document.getElementById('admin-prod-height').value = product.height || 0;
        document.getElementById('admin-prod-duration').value = product.duration || '';
        document.getElementById('admin-prod-desc').value = product.description || '';

        // Update current file indicators
        if (product.thumbnail) document.getElementById('admin-current-cover').innerHTML = `<i class="fas fa-file-image"></i> Current: ${product.thumbnail.split('/').pop()}`;
        if (product.filePath && product.type === 'EBOOK') document.getElementById('admin-current-ebook').innerHTML = `<i class="fas fa-file-pdf"></i> Current: ${product.filePath.split('/').pop()}`;
        if (product.filePath && product.type === 'AUDIOBOOK') document.getElementById('admin-current-audio').innerHTML = `<i class="fas fa-file-audio"></i> Current: ${product.filePath.split('/').pop()}`;

        // Toggle fields based on fetched type
        window.toggleAdminFileFields(product.type);

    } catch (error) {
        console.error("Error loading product for edit:", error);
        alert("Failed to load product details for editing.");
    }
};

window.closeProductModal = function () {
    const modal = document.getElementById('admin-product-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

// Toggle file fields based on product type
window.toggleAdminFileFields = function (type) {
    if (!type) {
        const typeEl = document.getElementById('admin-prod-type');
        type = typeEl ? typeEl.value : 'HARDCOVER';
    }
    const physicalFields = document.querySelectorAll('.admin-physical-field');
    const digitalFields = document.querySelectorAll('.admin-digital-field');
    const ebookField = document.getElementById('admin-field-ebook');
    const audioField = document.getElementById('admin-field-audio');
    const durationField = document.getElementById('admin-prod-duration-group'); // This one might still be missing, will check HTML

    physicalFields.forEach(el => el.style.display = (type === 'HARDCOVER' || type === 'PAPERBACK') ? 'block' : 'none');
    digitalFields.forEach(el => el.style.display = (type === 'EBOOK' || type === 'AUDIOBOOK') ? 'block' : 'none');

    if (ebookField) ebookField.style.display = (type === 'EBOOK') ? 'block' : 'none';
    if (audioField) audioField.style.display = (type === 'AUDIOBOOK') ? 'block' : 'none';
    if (durationField) durationField.style.display = (type === 'AUDIOBOOK') ? 'block' : 'none';
};

// Event listener for product type change
document.addEventListener('DOMContentLoaded', () => {
    const productTypeSelect = document.getElementById('admin-prod-type');
    if (productTypeSelect) {
        productTypeSelect.addEventListener('change', (e) => {
            window.toggleAdminFileFields(e.target.value);
        });
    }
});



// --- AUDIOBOOK PLAYER IMPLEMENTATION (Resume Support) ---
// ═══════════════════════════════════════════════════════════════
// EFV™ PREMIUM AUDIOBOOK EXPERIENCE — COMPLETE SYSTEM
// ═══════════════════════════════════════════════════════════════

// Library sub-tab filter
window.filterLibraryView = function (mode) {
    document.querySelectorAll('.library-sub-tab').forEach(b => b.classList.remove('active'));
    document.querySelector(`.library-sub-tab[data-library-tab="${mode}"]`)?.classList.add('active');

    const allGrid = document.getElementById('dashboard-library-list');
    const audioGrid = document.getElementById('dashboard-audiobooks-list');

    if (mode === 'all') {
        allGrid.style.display = ''; audioGrid.style.display = 'none';
        renderLibraryTab();
    } else if (mode === 'ebooks') {
        allGrid.style.display = ''; audioGrid.style.display = 'none';
        renderLibraryTab(null, 'ebook');
    } else if (mode === 'audiobooks') {
        allGrid.style.display = 'none'; audioGrid.style.display = '';
        renderAudiobooksGrid();
    }
};

// ─── AUDIOBOOK LIBRARY CARDS GRID ────────────────────────────
async function renderAudiobooksGrid() {
    const libKey = getUserKey('efv_digital_library');
    const library = JSON.parse(localStorage.getItem(libKey)) || [];
    const audiobooks = library.filter(i => (i.type || '').toLowerCase().includes('audio'));
    const container = document.getElementById('dashboard-audiobooks-list');
    const emptyState = document.getElementById('library-empty-state');

    if (audiobooks.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    const token = localStorage.getItem('authToken');

    const cards = await Promise.all(audiobooks.map(async (item) => {
        const prodId = item.productId || item.id || item._id;
        let totalChapters = 0, completedChapters = 0, remainingChapters = 0;
        let lastChapterIdx = 0, lastChapterTime = 0;

        // Fetch product for chapter info
        let productData = null;
        let itemPrice = 'Purchased';
        try {
            const pRes = await fetch(`${API_BASE}/api/products/${prodId}`);
            if (pRes.ok) productData = await pRes.json();
        } catch (e) { }

        if (productData) {
            totalChapters = (productData.chapters || []).filter(c => c.filePath).length || productData.totalChapters || 0;
            itemPrice = productData.discountPrice ? `₹${productData.discountPrice}` : (productData.price ? `₹${productData.price}` : 'Purchased');
        }

        // Fetch chapter-level progress
        let abProgress = null;
        try {
            const apRes = await fetch(`${API_BASE}/api/audiobook-progress/${prodId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (apRes.ok) abProgress = await apRes.json();
        } catch (e) { }

        if (abProgress && abProgress.chapters) {
            completedChapters = abProgress.totalCompletedChapters || abProgress.chapters.filter(c => c.completed).length;
            lastChapterIdx = abProgress.currentChapterIndex || 0;
            lastChapterTime = abProgress.currentChapterTime || 0;
        }
        remainingChapters = Math.max(0, totalChapters - completedChapters);
        const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

        // Thumbnail resolution
        let thumbUrl = item.thumbnail || 'img/vol1-cover.png';
        if (thumbUrl && !thumbUrl.startsWith('http') && !thumbUrl.startsWith('img/')) {
            thumbUrl = `${API_BASE}/${thumbUrl}`;
        }

        const hasProgress = lastChapterTime > 0 || completedChapters > 0;
        const continueLabel = hasProgress ? `<i class="fas fa-play"></i> Continue Listening` : `<i class="fas fa-headphones"></i> Start Listening`;

        return `
            <div class="audiobook-card fade-in">
                <div class="audiobook-card-inner">
                    <img src="${thumbUrl}" alt="${item.name || item.title}" class="audiobook-card-cover" onerror="this.src='img/vol1-cover.png'">
                    <div class="audiobook-card-info">
                        <h3 class="audiobook-card-title">${item.name || item.title}</h3>
                        ${item.language ? `<span style="display:inline-block; background:rgba(212,175,55,0.12); border:1px solid rgba(255,211,105,0.2); color:var(--gold-text); padding:2px 8px; border-radius:4px; font-size:0.65rem; font-weight:700; text-transform:uppercase; margin-bottom:6px; width:fit-content;">${item.language} Edition</span>` : ''}
                        <div class="audiobook-card-price" style="font-size: 0.9rem; color: var(--gold-text); font-weight: 700; margin-bottom: 8px;">${itemPrice}</div>
                        <div class="audiobook-card-stats">
                            <span class="audiobook-stat-pill"><i class="fas fa-list-ol"></i> ${totalChapters} Chapters</span>
                            <span class="audiobook-stat-pill"><i class="fas fa-check-circle"></i> ${completedChapters} Done</span>
                            <span class="audiobook-stat-pill"><i class="fas fa-hourglass-half"></i> ${remainingChapters} Left</span>
                        </div>
                        <div class="audiobook-card-progress">
                            <div class="audiobook-progress-bar-wrap">
                                <div class="audiobook-progress-bar-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <div class="audiobook-progress-text">
                                <span>${progressPercent}% Complete</span>
                                <span>${completedChapters}/${totalChapters}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="audiobook-card-actions">
                    <button class="btn-continue-listening" onclick="launchEFVPlayer('${prodId}', 0)">
                        ${continueLabel}
                    </button>
                    <button class="btn-chapters-view" onclick="openAudiobookDetail('${prodId}', true)">
                        <i class="fas fa-list"></i> Chapters
                    </button>
                </div>
            </div>
        `;
    }));

    container.innerHTML = cards.join('');
}

// ─── BOOK DETAIL SCREEN ──────────────────────────────────────
window.openAudiobookDetail = async function (productId, scrollToChapters = false) {
    const existing = document.getElementById('audiobook-detail-overlay');
    if (existing) existing.remove();

    const token = localStorage.getItem('authToken');
    let product = null;

    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}`);
        if (res.ok) product = await res.json();
        if (!product) throw new Error('Not found');
    } catch (e) {
        alert('Failed to load audiobook details.');
        return;
    }

    const chapters = (product.chapters || []).filter(c => c.filePath).sort((a, b) => a.chapterNumber - b.chapterNumber);
    const totalChapters = chapters.length;

    // Fetch progress
    let abProgress = null;
    try {
        const apRes = await fetch(`${API_BASE}/api/audiobook-progress/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (apRes.ok) abProgress = await apRes.json();
    } catch (e) { }

    const completedChapters = abProgress?.totalCompletedChapters || (abProgress?.chapters || []).filter(c => c.completed).length || 0;
    const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    // Thumbnail
    let thumbUrl = product.thumbnail || 'img/vol1-cover.png';
    if (thumbUrl && !thumbUrl.startsWith('http') && !thumbUrl.startsWith('img/')) {
        thumbUrl = `${API_BASE}/${thumbUrl}`;
    }

    // Chapter cards HTML
    const chapterCards = chapters.map((ch, idx) => {
        const chProgress = abProgress?.chapters?.find(c => c.chapterIndex === idx);
        const isCompleted = chProgress?.completed || false;
        const chDuration = ch.duration || '--:--';

        return `
            <div class="chapter-card ${isCompleted ? 'completed' : ''}" onclick="launchEFVPlayer('${productId}', ${idx})" id="chapter-card-${idx}">
                <div class="chapter-num">${idx + 1}</div>
                <div class="chapter-info">
                    <h4 class="chapter-title">${ch.title || ('Chapter ' + (idx + 1))}</h4>
                    <div class="chapter-duration"><i class="fas fa-clock"></i> ${chDuration}</div>
                </div>
                <button class="chapter-play-btn" onclick="event.stopPropagation(); launchEFVPlayer('${productId}', ${idx})">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
    }).join('');

    const overlayHTML = `
        <div id="audiobook-detail-overlay" class="audiobook-detail-overlay">
            <div class="ab-detail-header">
                <div class="ab-detail-header-title">
                    <i class="fas fa-headphones"></i> AUDIOBOOK
                </div>
                <button class="ab-detail-close" onclick="document.getElementById('audiobook-detail-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="ab-detail-body">
                <div class="ab-detail-hero">
                    <img src="${thumbUrl}" alt="${product.title}" class="ab-detail-cover" onerror="this.src='img/vol1-cover.png'">
                    <h2 class="ab-detail-title">${product.title}</h2>
                    <div class="ab-detail-meta">
                        <div class="ab-detail-meta-item"><i class="fas fa-list-ol"></i> <strong>${totalChapters}</strong> Chapters</div>
                        <div class="ab-detail-meta-item"><i class="fas fa-check-double"></i> <strong>${completedChapters}</strong> Completed</div>
                        ${product.duration ? `<div class="ab-detail-meta-item"><i class="fas fa-clock"></i> <strong>${product.duration}</strong></div>` : ''}
                    </div>

                    <div class="ab-detail-progress-wrap">
                        <div class="ab-detail-progress-label">
                            <span>Reading Progress</span>
                            <span>${progressPercent}%</span>
                        </div>
                        <div class="ab-detail-progress-track">
                            <div class="ab-detail-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>

                    <div class="ab-detail-actions">
                        <button class="btn-view-chapters" onclick="document.getElementById('chapters-section-anchor').scrollIntoView({behavior:'smooth'})">
                            <i class="fas fa-list"></i> View All Chapters
                        </button>
                    </div>
                </div>

                <div class="ab-chapters-section" id="chapters-section-anchor">
                    <div class="ab-chapters-heading">
                        <span>All Chapters (${totalChapters})</span>
                    </div>
                    <div class="ab-chapters-list">
                        ${chapterCards.length > 0 ? chapterCards : '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:30px;">No chapters uploaded yet.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHTML);

    if (scrollToChapters) {
        setTimeout(() => {
            document.getElementById('chapters-section-anchor')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
};

// ─── EFV PREMIUM AUDIO PLAYER ────────────────────────────────
window.launchEFVPlayer = async function (productId, chapterIndex = 0) {
    const existingPlayer = document.getElementById('efv-premium-player');
    if (existingPlayer) existingPlayer.remove();

    const token = localStorage.getItem('authToken');

    // Fetch product
    let product = null;
    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}`);
        if (res.ok) product = await res.json();
    } catch (e) { }
    if (!product) { alert('Failed to load audiobook.'); return; }

    const chapters = (product.chapters || []).filter(c => c.filePath).sort((a, b) => a.chapterNumber - b.chapterNumber);
    if (chapters.length === 0) { alert('No chapters available.'); return; }

    // Fetch chapter progress
    let abProgress = null;
    try {
        const apRes = await fetch(`${API_BASE}/api/audiobook-progress/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (apRes.ok) abProgress = await apRes.json();
    } catch (e) { }

    // Check resume for click on "Continue Listening" (chapterIndex 0 pass-through) or specific chapter
    let initialChapter = chapterIndex;
    let initialTime = 0;

    // Explicitly fetching the requested chapter's time if they clicked a chapter
    if (abProgress && abProgress.chapters) {
        const chProg = abProgress.chapters.find(c => c.chapterIndex === chapterIndex);
        if (chProg && chProg.currentTime > 1) {
            initialTime = chProg.currentTime;
        }
    }

    // Default "Continue Listening" passthrough override if chapterIndex 0 is passed but progress says they are on a later chapter
    if (chapterIndex === 0 && abProgress && abProgress.currentChapterIndex !== undefined) {
        if (abProgress.currentChapterIndex > 0 || (abProgress.currentChapterTime && abProgress.currentChapterTime > 1)) {
            const savedChIdx = abProgress.currentChapterIndex || 0;
            const savedTime = abProgress.currentChapterTime || 0;
            // Only override if we are truly hitting the Continue Listening default route 
            // AND we actually have significant progress saved.
            if (savedTime > 1 || savedChIdx > 0) {
                initialChapter = savedChIdx;
                initialTime = savedTime;
            }
        }
    }

    // Thumbnail
    let thumbUrl = product.thumbnail || 'img/vol1-cover.png';
    if (thumbUrl && !thumbUrl.startsWith('http') && !thumbUrl.startsWith('img/')) {
        thumbUrl = `${API_BASE}/${thumbUrl}`;
    }

    const currentChapter = chapters[initialChapter] || chapters[0];
    const chTitle = currentChapter.title || `Chapter ${initialChapter + 1}`;

    const playerHTML = `
        <div id="efv-premium-player" class="efv-audio-player-overlay" oncontextmenu="return false;">
            <div class="efv-player-toolbar">
                <div class="efv-player-toolbar-left">
                    <i class="fas fa-headphones"></i>
                    <span>EFV™ AUDIO PLAYER</span>
                </div>
                <button class="ab-detail-close" id="efv-player-close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="efv-player-body">
                <img src="${thumbUrl}" alt="${product.title}" class="efv-player-cover" id="efv-player-cover" onerror="this.src='img/vol1-cover.png'">

                <h2 class="efv-player-chapter-title" id="efv-player-ch-title">${chTitle}</h2>
                <p class="efv-player-book-title">${product.title}</p>

                <div class="efv-player-seek-container">
                    <div class="efv-player-time-row">
                        <span id="efv-time-current">0:00</span>
                        <span id="efv-time-total">0:00</span>
                    </div>
                    <input type="range" class="efv-seek-bar" id="efv-seek-bar" min="0" max="100" value="0" step="0.1">
                </div>

                <div class="efv-player-controls">
                    <button class="efv-ctrl-btn" id="efv-btn-prev" title="Previous Chapter"><i class="fas fa-step-backward"></i></button>
                    <button class="efv-ctrl-btn" title="Rewind 10s" id="efv-btn-rwd"><i class="fas fa-undo"></i></button>
                    <button class="efv-play-btn" id="efv-btn-play"><i class="fas fa-play" id="efv-play-icon"></i></button>
                    <button class="efv-ctrl-btn" title="Forward 10s" id="efv-btn-fwd"><i class="fas fa-redo"></i></button>
                    <button class="efv-ctrl-btn" id="efv-btn-next" title="Next Chapter"><i class="fas fa-step-forward"></i></button>
                </div>

                <div class="efv-speed-control">
                    <span class="efv-speed-label">Speed</span>
                    <div class="efv-speed-options">
                        <button class="efv-speed-btn active" data-speed="1">1x</button>
                        <button class="efv-speed-btn" data-speed="1.5">1.5x</button>
                        <button class="efv-speed-btn" data-speed="2">2x</button>
                    </div>
                </div>

                <div class="efv-player-chapter-indicator" id="efv-ch-indicator">
                    Chapter ${initialChapter + 1} of ${chapters.length}
                </div>
            </div>

            <!-- Resume Modal -->
            <div id="efv-resume-overlay" class="resume-modal-overlay" style="z-index:10003;">
                <div class="resume-modal">
                    <i class="fas fa-headphones"></i>
                    <h3>Continue Listening?</h3>
                    <p>You previously listened up to <span id="efv-resume-time" style="color:white; font-weight:bold;">0:00</span>.<br>Continue from where you left off?</p>
                    <div class="resume-actions">
                        <button id="efv-btn-resume" class="btn-resume-primary">
                            <i class="fas fa-play"></i> Continue from <span id="efv-resume-btn-time">0:00</span>
                        </button>
                        <button id="efv-btn-restart" class="btn-resume-secondary">
                            <i class="fas fa-redo"></i> Start from Beginning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', playerHTML);
    document.body.classList.add('modal-open');

    // SECURITY: Actively start protection
    if (window.efvSecurity) {
        window.efvSecurity.enable();
    }

    // --- Player State ---
    let currentChIdx = initialChapter;
    let audioEl = new Audio();
    audioEl.crossOrigin = 'anonymous';
    let isSeeking = false;
    let saveTimer = null;

    // Prevent context menu on audio
    audioEl.addEventListener('contextmenu', e => e.preventDefault());

    // DOM refs
    const playIcon = document.getElementById('efv-play-icon');
    const playBtn = document.getElementById('efv-btn-play');
    const seekBar = document.getElementById('efv-seek-bar');
    const timeCurrent = document.getElementById('efv-time-current');
    const timeTotal = document.getElementById('efv-time-total');
    const playerCover = document.getElementById('efv-player-cover');
    const chTitleEl = document.getElementById('efv-player-ch-title');
    const chIndicator = document.getElementById('efv-ch-indicator');
    const resumeOverlay = document.getElementById('efv-resume-overlay');

    // --- Load Chapter ---
    function loadChapter(idx, startTime = 0, autoPlay = true) {
        if (idx < 0 || idx >= chapters.length) return;
        currentChIdx = idx;

        const chapterSrc = `${CONTENT_CONFIG.contentApi}/chapter/${productId}/${idx}?token=${token}&t=${Date.now()}`;
        audioEl.src = chapterSrc;
        audioEl.load();

        const ch = chapters[idx];
        chTitleEl.textContent = ch.title || `Chapter ${idx + 1}`;
        chIndicator.textContent = `Chapter ${idx + 1} of ${chapters.length}`;

        // Update nav buttons
        document.getElementById('efv-btn-prev').disabled = idx === 0;
        document.getElementById('efv-btn-next').disabled = idx === chapters.length - 1;

        // Highlight in detail overlay if open
        document.querySelectorAll('.chapter-card').forEach(c => c.classList.remove('playing'));
        const activeCard = document.getElementById(`chapter-card-${idx}`);
        if (activeCard) activeCard.classList.add('playing');

        seekBar.value = 0;
        seekBar.style.background = 'rgba(255, 255, 255, 0.1)';
        timeCurrent.textContent = '0:00';
        timeTotal.textContent = '0:00';

        audioEl.addEventListener('loadedmetadata', function onMeta() {
            audioEl.removeEventListener('loadedmetadata', onMeta);
            timeTotal.textContent = formatTime(audioEl.duration);
            if (startTime > 0) audioEl.currentTime = startTime;
            if (autoPlay) audioEl.play().catch(() => { });
        });
    }

    // --- Save chapter progress ---
    function saveChapterProgress(forceComplete = false) {
        if (!audioEl.src || audioEl.currentTime < 0.5) return;

        const completed = forceComplete || (audioEl.duration > 0 && (audioEl.currentTime / audioEl.duration) > 0.95);

        const data = {
            chapterIndex: currentChIdx,
            currentTime: audioEl.currentTime,
            duration: audioEl.duration || 0,
            completed
        };

        fetch(`${API_BASE}/api/audiobook-progress/${productId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        }).catch(e => console.error('Save chapter progress error:', e));

        // Also update generic progress for dashboard cards
        const totalChapters = chapters.length;
        const overallProgress = totalChapters > 0 ? ((currentChIdx + (audioEl.currentTime / (audioEl.duration || 1))) / totalChapters) * 100 : 0;
        syncProgress(productId, 'AUDIOBOOK', {
            currentTime: audioEl.currentTime,
            totalDuration: audioEl.duration || 0,
            progress: Math.min(overallProgress, 100)
        });
    }

    // --- Event Listeners ---
    audioEl.addEventListener('timeupdate', () => {
        if (isSeeking) return;
        timeCurrent.textContent = formatTime(audioEl.currentTime);
        if (audioEl.duration) {
            const percentage = (audioEl.currentTime / audioEl.duration) * 100;
            seekBar.value = percentage;
            seekBar.style.background = `linear-gradient(to right, #FFD700 0%, #FFD700 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
        }
    });

    audioEl.addEventListener('play', () => {
        playIcon.className = 'fas fa-pause';
        playerCover.classList.add('is-playing');
        saveTimer = setInterval(() => saveChapterProgress(), 5000);
    });

    audioEl.addEventListener('pause', () => {
        playIcon.className = 'fas fa-play';
        playerCover.classList.remove('is-playing');
        if (saveTimer) clearInterval(saveTimer);
        saveChapterProgress();
    });

    // Save on tab switch / minimize
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === 'hidden' && audioEl) {
            saveChapterProgress();
        }
    });

    audioEl.addEventListener('ended', () => {
        saveChapterProgress(true);
        // Auto-advance to next chapter
        if (currentChIdx < chapters.length - 1) {
            loadChapter(currentChIdx + 1, 0, true);
        } else {
            playIcon.className = 'fas fa-play';
            playerCover.classList.remove('is-playing');
        }
    });

    // Seek bar interaction
    seekBar.addEventListener('input', () => {
        isSeeking = true;
        const seekTime = (seekBar.value / 100) * (audioEl.duration || 0);
        timeCurrent.textContent = formatTime(seekTime);
        const percentage = seekBar.value;
        seekBar.style.background = `linear-gradient(to right, #FFD700 0%, #FFD700 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    });

    seekBar.addEventListener('change', () => {
        const seekTime = (seekBar.value / 100) * (audioEl.duration || 0);
        audioEl.currentTime = seekTime;
        isSeeking = false;
    });

    // Play/Pause
    playBtn.addEventListener('click', () => {
        if (audioEl.paused) audioEl.play().catch(() => { });
        else audioEl.pause();
    });

    // Rewind/Forward 10s
    document.getElementById('efv-btn-rwd').addEventListener('click', () => {
        audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
    });
    document.getElementById('efv-btn-fwd').addEventListener('click', () => {
        audioEl.currentTime = Math.min(audioEl.duration || 0, audioEl.currentTime + 10);
    });

    // Prev/Next chapter
    document.getElementById('efv-btn-prev').addEventListener('click', () => {
        if (currentChIdx > 0) {
            saveChapterProgress();
            loadChapter(currentChIdx - 1, 0, true);
        }
    });
    document.getElementById('efv-btn-next').addEventListener('click', () => {
        if (currentChIdx < chapters.length - 1) {
            saveChapterProgress();
            loadChapter(currentChIdx + 1, 0, true);
        }
    });

    // Speed controls
    document.querySelectorAll('.efv-speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.efv-speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            audioEl.playbackRate = parseFloat(btn.dataset.speed);
        });
    });

    // Close player
    document.getElementById('efv-player-close-btn').addEventListener('click', () => {
        saveChapterProgress();
        if (saveTimer) clearInterval(saveTimer);
        audioEl.pause();
        audioEl.src = '';
        document.getElementById('efv-premium-player').remove();
        document.body.classList.remove('modal-open');

        // SECURITY: Stop active protection
        if (window.efvSecurity) window.efvSecurity.disable();
        // Refresh library and detail views
        renderLibraryTab();
        if (document.querySelector('.library-sub-tab[data-library-tab="audiobooks"].active')) {
            renderAudiobooksGrid();
        }
    });

    // Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape' && document.getElementById('efv-premium-player')) {
            document.getElementById('efv-player-close-btn').click();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Save on page unload via old robust method too
    window.addEventListener('beforeunload', () => saveChapterProgress());

    // --- Resume Modal Logic ---
    if (initialTime > 1) {
        document.getElementById('efv-resume-time').textContent = formatTime(initialTime);
        document.getElementById('efv-resume-btn-time').textContent = formatTime(initialTime);
        resumeOverlay.classList.add('active');

        document.getElementById('efv-btn-resume').addEventListener('click', () => {
            resumeOverlay.classList.remove('active');
            loadChapter(initialChapter, initialTime, true);
        });
        document.getElementById('efv-btn-restart').addEventListener('click', () => {
            resumeOverlay.classList.remove('active');
            loadChapter(initialChapter, 0, true);
        });
    } else {
        resumeOverlay.classList.remove('active');
        loadChapter(initialChapter, 0, true);
    }
};

// ─── LEGACY FALLBACK: playAudiobook (for non-chapter audiobooks) ──
window.playAudiobook = async function (product) {
    const bookId = product._id || product.id;
    const token = localStorage.getItem('authToken');

    // Try to detect chapter-based audiobook
    try {
        const res = await fetch(`${API_BASE}/api/products/${bookId}`);
        if (res.ok) {
            const fullProduct = await res.json();
            const hasChapters = (fullProduct.chapters || []).filter(c => c.filePath).length > 0;
            if (hasChapters) {
                // Use the premium chapter-based player
                openAudiobookDetail(bookId);
                return;
            }
        }
    } catch (e) { }

    // Fallback for legacy single-file audiobooks — minimal player
    const playerModalId = 'audio-player-modal';
    const resumeModalId = 'audio-resume-modal';
    if (document.getElementById(playerModalId)) document.getElementById(playerModalId).remove();

    let savedState = await fetchProgress(bookId);
    if (!savedState) {
        const local = localStorage.getItem(`audiobook_${bookId}_progress`);
        if (local) savedState = JSON.parse(local);
    }

    // Thumbnail
    let thumbUrl = product.thumbnail || getImageForProduct(product.name);
    if (thumbUrl && !thumbUrl.startsWith('http') && !thumbUrl.startsWith('img/')) {
        thumbUrl = `${API_BASE}/${thumbUrl}`;
    }

    const audioHtml = `
        <div id="${playerModalId}" class="efv-audio-player-overlay" oncontextmenu="return false;">
            <div class="efv-player-toolbar">
                <div class="efv-player-toolbar-left"><i class="fas fa-headphones"></i> <span>${product.name}</span></div>
                <button class="ab-detail-close" onclick="closeLegacyPlayer()"><i class="fas fa-times"></i></button>
            </div>
            <div class="efv-player-body">
                <img src="${thumbUrl}" class="efv-player-cover" onerror="this.src='img/vol1-cover.png'">
                <h2 class="efv-player-chapter-title">${product.name}</h2>
                <div class="efv-player-seek-container">
                    <div class="efv-player-time-row">
                        <span id="legacy-time-cur">0:00</span>
                        <span id="legacy-time-total">0:00</span>
                    </div>
                    <input type="range" class="efv-seek-bar" id="legacy-seek" min="0" max="100" value="0" step="0.1">
                </div>
                <div class="efv-player-controls">
                    <button class="efv-ctrl-btn" id="legacy-rwd"><i class="fas fa-undo"></i></button>
                    <button class="efv-play-btn" id="legacy-play"><i class="fas fa-play" id="legacy-play-icon"></i></button>
                    <button class="efv-ctrl-btn" id="legacy-fwd"><i class="fas fa-redo"></i></button>
                </div>
                <div class="efv-speed-control">
                    <span class="efv-speed-label">Speed</span>
                    <div class="efv-speed-options">
                        <button class="efv-speed-btn legacy-speed active" data-speed="1">1x</button>
                        <button class="efv-speed-btn legacy-speed" data-speed="1.5">1.5x</button>
                        <button class="efv-speed-btn legacy-speed" data-speed="2">2x</button>
                    </div>
                </div>
            </div>
            <div id="${resumeModalId}" class="resume-modal-overlay" style="z-index:10003;">
                <div class="resume-modal">
                    <i class="fas fa-headphones"></i>
                    <h3>Continue Listening?</h3>
                    <p>You previously listened up to <span id="legacy-resume-time" style="color:white; font-weight:bold;">0:00</span>.<br>Continue from where you left off?</p>
                    <div class="resume-actions">
                        <button id="legacy-btn-resume" class="btn-resume-primary"><i class="fas fa-play"></i> Continue from <span id="legacy-resume-btn-time">0:00</span></button>
                        <button id="legacy-btn-restart" class="btn-resume-secondary"><i class="fas fa-redo"></i> Start from Beginning</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', audioHtml);
    document.body.classList.add('modal-open');

    const audio = new Audio(`${CONTENT_CONFIG.contentApi}/audio/${bookId}?token=${token || ''}&t=${Date.now()}`);
    const playIcon = document.getElementById('legacy-play-icon');
    const seek = document.getElementById('legacy-seek');
    let legacySaveInt = null;
    let legacySeeking = false;

    const saveLegacyProgress = () => {
        if (audio.currentTime < 1) return;
        const pd = { currentTime: audio.currentTime, totalDuration: audio.duration || 0, progress: (audio.currentTime / (audio.duration || 1)) * 100 };
        if (pd.progress > 95) { syncProgress(bookId, 'AUDIOBOOK', { currentTime: 0, progress: 0 }); localStorage.removeItem(`audiobook_${bookId}_progress`); return; }
        localStorage.setItem(`audiobook_${bookId}_progress`, JSON.stringify(pd));
        if (token) syncProgress(bookId, 'AUDIOBOOK', pd);
    };

    audio.addEventListener('loadedmetadata', () => {
        document.getElementById('legacy-time-total').textContent = formatTime(audio.duration);
        if (savedState && savedState.currentTime > 1 && (savedState.currentTime / audio.duration) < 0.95) {
            document.getElementById('legacy-resume-time').textContent = formatTime(savedState.currentTime);
            document.getElementById('legacy-resume-btn-time').textContent = formatTime(savedState.currentTime);
            document.getElementById(resumeModalId).classList.add('active');
        } else { audio.play().catch(() => { }); }
    });
    audio.addEventListener('timeupdate', () => { if (!legacySeeking) { document.getElementById('legacy-time-cur').textContent = formatTime(audio.currentTime); seek.value = (audio.currentTime / (audio.duration || 1)) * 100; } });
    audio.addEventListener('play', () => { playIcon.className = 'fas fa-pause'; legacySaveInt = setInterval(saveLegacyProgress, 5000); });
    audio.addEventListener('pause', () => { playIcon.className = 'fas fa-play'; if (legacySaveInt) clearInterval(legacySaveInt); saveLegacyProgress(); });

    document.getElementById('legacy-play').addEventListener('click', () => { audio.paused ? audio.play().catch(() => { }) : audio.pause(); });
    document.getElementById('legacy-rwd').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
    document.getElementById('legacy-fwd').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
    seek.addEventListener('input', () => { legacySeeking = true; document.getElementById('legacy-time-cur').textContent = formatTime((seek.value / 100) * (audio.duration || 0)); });
    seek.addEventListener('change', () => { audio.currentTime = (seek.value / 100) * (audio.duration || 0); legacySeeking = false; });
    document.querySelectorAll('.legacy-speed').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('.legacy-speed').forEach(x => x.classList.remove('active')); b.classList.add('active'); audio.playbackRate = parseFloat(b.dataset.speed); }));

    document.getElementById('legacy-btn-resume')?.addEventListener('click', () => { audio.currentTime = savedState.currentTime; document.getElementById(resumeModalId).classList.remove('active'); audio.play(); });
    document.getElementById('legacy-btn-restart')?.addEventListener('click', () => { audio.currentTime = 0; document.getElementById(resumeModalId).classList.remove('active'); localStorage.removeItem(`audiobook_${bookId}_progress`); audio.play(); });

    window.closeLegacyPlayer = function () {
        saveLegacyProgress();
        if (legacySaveInt) clearInterval(legacySaveInt);
        audio.pause(); audio.src = '';
        document.getElementById(playerModalId)?.remove();
        document.body.classList.remove('modal-open');
        renderLibraryTab();
    };

    window.addEventListener('beforeunload', saveLegacyProgress);
};

// --- API HELPERS ---
async function fetchProgress(productId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        // Add timestamp to prevent caching
        const res = await fetch(`${CONTENT_CONFIG.progressApi}/${productId}?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        return json.found ? json.data : null;
    } catch (e) {
        console.error("Progress fetch error", e);
        return null;
    }
}

async function syncProgress(productId, type, data) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        await fetch(`${CONTENT_CONFIG.progressApi}/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type, ...data })
        });
    } catch (e) {
        console.error("Progress sync error", e);
    }
}

// FORMAT HELPER
function formatTime(seconds) {
    if (!seconds) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

// MAIN ENTRY POINT
window.accessDigitalContent = function (name, id, type) {
    console.log(`🚀 Dispatching Content Request | Name: ${name} | ID: ${id} | Type: ${type}`);

    // Determine type from parameter or fallback
    const resolvedType = (type || (name.toLowerCase().includes('audio') ? 'Audiobook' : 'E-Book')).toLowerCase();

    // Normalize type string to match player expectations
    const isAudio = resolvedType.includes('audio');

    if (!id) {
        console.error("❌ Cannot access content: Missing Product ID");
        alert("Content data is outdated. Please click 'Sync Library' button above.");
        return;
    }

    const product = {
        _id: id,
        name: name,
        id: id,
        type: isAudio ? 'AUDIOBOOK' : 'EBOOK'
    };

    console.log(`✅ Final Product Resolved:`, product);

    if (isAudio) {
        playAudiobook(product);
    } else {
        openEbookReader(product);
    }
};

// Helper for images
function getImageForProduct(name) {
    if (name.includes('VOL 1')) return 'img/vol1-cover.png';
    if (name.includes('VOL 2')) return 'img/vol 2.png';
    return 'img/vol1-cover.png';
}


// --- ADMIN PORTAL LOGIC ---

// --- NEW ADMIN MANAGEMENT FUNCTIONS ---
let allAdminProducts = [];



window.loadAdminOrdersFull = async function () {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Loading orders...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await res.json();

        tbody.innerHTML = '';
        orders.reverse().forEach(o => {
            const date = new Date(o.createdAt).toLocaleDateString();
            const items = o.items.map(i => `${i.quantity}x ${i.title}`).join(', ');
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                <td style="padding: 12px; font-family: monospace;">#${o._id.slice(-6)}</td>
                <td style="padding: 12px;">${date}</td>
                <td style="padding: 12px;">${o.customer.name}<br><small style="opacity:0.6;">${o.customer.phone || 'N/A'}</small></td>
                <td style="padding: 12px;"><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${items}</div></td>
                <td style="padding: 12px; font-weight:bold;">₹${o.totalAmount}</td>
                <td style="padding: 12px;"><span class="badge ${o.paymentStatus === 'Paid' ? 'green' : 'gold'}">${o.paymentStatus}</span></td>
                <td style="padding: 12px;">
                    <select onchange="updateOrderStatus('${o._id}', this.value)" style="background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,211,105,0.3); padding: 4px; border-radius: 4px; font-size: 0.8rem;">
                        ${['Pending', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Failed'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </td>
                <td style="padding: 12px;">
                    <button class="btn btn-outline small" onclick="alert('Order Details:\\n\\nAddress: ${o.customer.address}\\nCourier: Pending\\nApayID: ${o.razorpayPaymentId || 'N/A'}')">View</button>
                    <button class="btn-icon" style="color: #ff4d4d; margin-left:10px;"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
};

window.filterAdminProducts = function () {
    const searchEl = document.getElementById('admin-product-search');
    const typeEl = document.getElementById('admin-product-filter-type');
    const stockEl = document.getElementById('admin-product-filter-stock');

    if (!searchEl || !typeEl || !stockEl) return;

    const searchTerm = searchEl.value.toLowerCase();
    const typeFilter = typeEl.value;
    const stockFilter = stockEl.value;

    let filtered = allAdminProducts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm) || (p.author && p.author.toLowerCase().includes(searchTerm));

        let matchesType = true;
        if (typeFilter === 'physical') {
            matchesType = ['HARDCOVER', 'PAPERBACK'].includes(p.type);
        } else if (typeFilter !== 'all') {
            matchesType = p.type === typeFilter;
        }

        let matchesStock = true;
        if (stockFilter === 'instock') {
            matchesStock = (p.stock || 0) > 0;
        } else if (stockFilter === 'outofstock') {
            matchesStock = (p.stock || 0) <= 0;
        }

        return matchesSearch && matchesType && matchesStock;
    });

    // --- SERIES SORTING LOGIC ---
    const typeOrder = { 'HARDCOVER': 1, 'PAPERBACK': 2, 'AUDIOBOOK': 3, 'EBOOK': 4 };
    const langOrder = { 'Hindi': 1, 'English': 2 };

    filtered.sort((a, b) => {
        // Helper to get volume
        const getVol = (p) => {
            if (p.volume) return parseInt(p.volume);
            const match = (p.title || '').match(/VOL\s*(\d+)/i);
            return match ? parseInt(match[1]) : 99;
        };

        // 1. Volume Sort (Numerical)
        const volA = getVol(a);
        const volB = getVol(b);
        if (volA !== volB) return volA - volB;

        // 2. Language Sort (Hindi first)
        const langA = langOrder[a.language] || 3;
        const langB = langOrder[b.language] || 3;
        if (langA !== langB) return langA - langB;

        // 3. Format Type Sort (HC -> PB -> Audio -> Ebook)
        const orderA = typeOrder[a.type] || 99;
        const orderB = typeOrder[b.type] || 99;
        return orderA - orderB;
    });

    window.renderAdminProducts(filtered);
};

window.renderAdminProducts = function (products) {
    const tbody = document.getElementById('admin-product-table-body-full');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; opacity:0.5;">No products found matching filters.</td></tr>';
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        // Dynamic Thumbnail Resolver
        let thumbUrl = 'img/placeholder.png';
        if (p.thumbnail) {
            if (p.thumbnail.startsWith('http')) {
                thumbUrl = p.thumbnail;
            } else if (p.thumbnail.startsWith('img/')) {
                // Shared frontend images
                thumbUrl = p.thumbnail;
            } else {
                // Backend uploads
                thumbUrl = `${API_BASE}/${p.thumbnail}`;
            }
        }

        tr.innerHTML = `
            <td style="padding: 12px;"><img src="${thumbUrl}" style="width: 45px; height: 65px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);"></td>
            <td style="padding: 12px;">
                <div style="font-weight: 600; color: white;">${p.title}</div>
                <div style="font-size: 0.8rem; opacity: 0.6; margin-top: 2px;">${p.author || 'EFV Author'}</div>
            </td>
            <td style="padding: 12px;"><span class="badge" style="background: rgba(255,255,255,0.1); color: var(--gold-text); font-size: 0.75rem;">${p.type}</span></td>
            <td style="padding: 12px;"><strong>₹${p.price}</strong>${p.discountPrice ? `<br><small style="text-decoration: line-through; opacity: 0.5;">₹${p.discountPrice}</small>` : ''}</td>
            <td style="padding: 12px;">
                ${(p.type === 'EBOOK' || p.type === 'AUDIOBOOK') ?
                (p.filePath ?
                    `<div style="display:flex; flex-direction:column; gap:4px;">
                            <span style="color: #2ecc71; font-size: 0.75rem;"><i class="fas fa-check-circle"></i> OK</span>
                            <button onclick="window.openProductModal('${p._id}')" style="background:none; border:none; color:var(--gold-text); font-size:0.7rem; cursor:pointer; padding:0; text-align:left; text-decoration:underline;">Update File</button>
                        </div>` :
                    `<div style="display:flex; flex-direction:column; gap:4px;">
                            <span style="color: #ff4d4d; font-size: 0.75rem;"><i class="fas fa-exclamation-triangle"></i> Missing</span>
                            <button onclick="window.openProductModal('${p._id}')" class="btn btn-gold small" style="padding: 2px 8px; font-size: 0.65rem; width:auto;">Upload Now</button>
                        </div>`)
                : '<span style="opacity: 0.3; font-size: 0.75rem;">N/A (Physical)</span>'}
            </td>
            <td style="padding: 12px;">
                <span style="color: ${(p.stock || 0) <= 0 ? '#ff4d4d' : 'inherit'}">
                    ${p.stock || 0}
                </span>
                <br><small style="opacity:0.5;">qty</small>
            </td>
            <td style="padding: 12px;">
                <div style="display: flex; gap: 5px;">
                    <button onclick="window.openProductModal('${p._id}')" class="btn-icon" style="color: var(--gold-text);" title="Edit Product"><i class="fas fa-edit"></i></button>
                    <button onclick="window.deleteProduct('${p._id}')" class="btn-icon" style="color: #ff4d4d;" title="Delete Product"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.loadAdminCustomers = async function () {
    const tbody = document.getElementById('admin-customers-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Fetching customers...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();

        tbody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                <td style="padding: 12px;">${u.name}</td>
                <td style="padding: 12px;">${u.email}</td>
                <td style="padding: 12px;">${u.phone || 'N/A'}</td>
                <td style="padding: 12px;">-</td>
                <td style="padding: 12px;">-</td>
                <td style="padding: 12px;"><button class="btn btn-outline small">Profile</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
};

window.loadAdminPayments = async function () {
    const tbody = document.getElementById('admin-payments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Fetching payments...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/payments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const payments = await res.json();

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No payment records found yet.</td></tr>';
            return;
        }

        tbody.innerHTML = payments.map(p => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-family: monospace;">${p.paymentId || 'N/A'}</td>
                <td style="padding: 12px; font-family: monospace;">#${p.orderId || 'N/A'}</td>
                <td style="padding: 12px;">₹${p.amount}</td>
                <td style="padding: 12px;">${p.method || 'Razorpay'}</td>
                <td style="padding: 12px;"><span class="badge ${p.status === 'Paid' ? 'green' : 'gold'}">${p.status}</span></td>
                <td style="padding: 12px;">${new Date(p.date || p.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color: #ff4d4d;">Error loading payments.</td></tr>';
    }
};

window.loadAdminShipments = async function () {
    const tbody = document.getElementById('admin-shipments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Fetching shipments...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const shipments = await res.json();

        if (shipments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No active shipments. Ready for Shiprocket integration.</td></tr>';
            return;
        }

        tbody.innerHTML = shipments.map(s => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-family: monospace;">#${s.orderId}</td>
                <td style="padding: 12px;">${s.courierName || 'Auto-Select'}</td>
                <td style="padding: 12px; font-family: monospace;">${s.awbNumber || 'Pending'}</td>
                <td style="padding: 12px;"><span class="badge ${s.shippingStatus === 'Delivered' ? 'green' : 'gold'}">${s.shippingStatus}</span></td>
                <td style="padding: 12px;"><button class="btn btn-outline small" onclick="alert('Print functionality coming soon')">Print</button></td>
                <td style="padding: 12px;">${s.trackingLink ? `<a href="${s.trackingLink}" target="_blank" style="color:var(--gold-text);">Track</a>` : 'N/A'}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color: #ff4d4d;">Error loading shipments.</td></tr>';
    }
};

window.loadAdminCoupons = async function () {
    const tbody = document.getElementById('admin-coupons-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Fetching coupons...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/coupons`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coupons = await res.json();

        if (coupons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No coupons created yet.</td></tr>';
            return;
        }

        tbody.innerHTML = coupons.map(c => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-weight: bold; color: var(--gold-text);">${c.code}</td>
                <td style="padding: 12px;">${c.type}</td>
                <td style="padding: 12px;">${c.type === 'Percentage' ? c.value + '%' : '₹' + c.value}</td>
                <td style="padding: 12px;">${c.usedCount} / ${c.usageLimit}</td>
                <td style="padding: 12px;">${c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never'}</td>
                <td style="padding: 12px;"><span class="badge ${c.isActive ? 'green' : 'red'}">${c.isActive ? 'Active' : 'Expired'}</span></td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color: #ff4d4d;">Error loading coupons.</td></tr>';
    }
};

window.loadAdminReports = function () {
    console.log("Analytics view loaded with dummy charts.");
};

window.updateOrderStatus = async function (id, status) {
    const note = prompt(`Updating order ${id} to ${status}. Add a note?`, `Status updated to ${status}`);
    if (note === null) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, note })
        });

        if (res.ok) {
            if (document.getElementById('admin-orders').classList.contains('active')) loadAdminOrdersFull();
            updateAdminStats();
        } else alert('Failed to update status');
    } catch (e) {
        console.error(e);
        alert('Server error');
    }
};

// Handle Product Form Submission
if (document.getElementById('admin-product-form')) {
    document.getElementById('admin-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        // Fix: Select button by ID because it is outside the form in the new design
        const btn = document.getElementById('admin-save-btn');
        if (!btn) return console.error("Save button not found");
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
        btn.disabled = true;

        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();

            const cover = document.getElementById('admin-file-cover').files[0];
            const ebook = document.getElementById('admin-file-ebook').files[0];
            const audio = document.getElementById('admin-file-audio').files[0];

            if (cover) formData.append('cover', cover);
            if (ebook) formData.append('ebook', ebook);
            if (audio) formData.append('audio', audio);

            let uploadData = {};
            if (cover || ebook || audio) {
                const uploadRes = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const result = await uploadRes.json();
                if (!uploadRes.ok) {
                    throw new Error(result.message || 'File upload failed');
                }
                if (result.paths) uploadData = result.paths;
            }

            const productId = document.getElementById('admin-prod-id').value;
            const isEdit = !!productId;

            const productData = {
                title: document.getElementById('admin-prod-title').value,
                author: document.getElementById('admin-prod-author').value,
                type: document.getElementById('admin-prod-type').value,
                language: document.getElementById('admin-prod-lang').value || 'Hindi',
                volume: document.getElementById('admin-prod-volume').value || '',
                price: Number(document.getElementById('admin-prod-price').value),
                discountPrice: Number(document.getElementById('admin-prod-discount-price').value) || null,
                stock: Number(document.getElementById('admin-prod-stock').value) || 0,
                weight: Number(document.getElementById('admin-prod-weight').value) || 0,
                length: Number(document.getElementById('admin-prod-length').value) || 0,
                breadth: Number(document.getElementById('admin-prod-width').value) || 0,
                height: Number(document.getElementById('admin-prod-height').value) || 0,
                duration: document.getElementById('admin-prod-duration').value || '',
                description: document.getElementById('admin-prod-desc').value,
                category: 'Digital'
            };

            if (uploadData.coverPath) productData.thumbnail = uploadData.coverPath;

            // Fixed: Only assign filePath based on the actual selected product type
            if (productData.type === 'EBOOK' && uploadData.ebookPath) {
                productData.filePath = uploadData.ebookPath;
            } else if (productData.type === 'AUDIOBOOK' && uploadData.audioPath) {
                productData.filePath = uploadData.audioPath;
            }

            const url = isEdit ? `${API_BASE}/api/products/${productId}` : `${API_BASE}/api/products`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            if (res.ok) {
                closeProductModal();
                loadAdminProductsFull(); // Refresh full list
                updateAdminStats(); // Refresh dashboard stats
                if (typeof syncLibraryWithBackend === 'function') syncLibraryWithBackend();
            } else {
                const err = await res.json();
                alert(err.message || 'Error saving product');
            }
        } catch (err) {
            console.error(err);
            alert('Error: ' + err.message);
        } finally {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    });
}

// --- MISSING DASHBOARD FUNCTIONS ---

window.viewOrderDetail = async function (id, mode = 'details') {
    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;

    // Mode-based UI Reset (matches new compact HTML)
    const topBarTitle = modal.querySelector('.reader-title');
    const trackingPanel = document.getElementById('modal-tracking-panel');
    const itemsPanel = document.getElementById('modal-order-items')?.closest('.glass-panel');
    const paymentAddressRow = itemsPanel?.nextElementSibling; // The 2-col grid: payment + address

    if (mode === 'track') {
        // Track mode: Show tracking, hide items & payment/address sidebar
        if (topBarTitle) topBarTitle.innerHTML = `<i class="fas fa-truck-moving gold-text"></i> LIVE TRACKING <span id="modal-order-id" style="color: rgba(255,211,105,0.8); margin-left: 10px; font-size: 0.75rem;"></span>`;
        if (trackingPanel) trackingPanel.style.display = 'block';
        if (itemsPanel) itemsPanel.style.display = 'none';
        if (paymentAddressRow) paymentAddressRow.style.display = 'none';
    } else {
        // Details mode: Hide tracking, show items & payment/address
        if (topBarTitle) topBarTitle.innerHTML = `<i class="fas fa-box-open gold-text"></i> ORDER DETAILS <span id="modal-order-id" style="color: rgba(255,211,105,0.8); margin-left: 10px; font-size: 0.75rem;"></span>`;
        if (trackingPanel) trackingPanel.style.display = 'none';
        if (itemsPanel) itemsPanel.style.display = 'block';
        if (paymentAddressRow) paymentAddressRow.style.display = 'grid';
    }

    try {
        const res = await fetch(`${API_BASE}/api/orders/track/${id}`);
        const order = await res.json();
        if (!res.ok) throw new Error(order.message);

        const orderIdEl = document.getElementById('modal-order-id');
        if (orderIdEl) orderIdEl.textContent = `#${order.orderId}`;
        const dateEl = document.getElementById('modal-order-date');
        if (dateEl) dateEl.textContent = `Placed on: ${new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`;

        const subtotalEl = document.getElementById('modal-subtotal');
        const totalEl = document.getElementById('modal-total');
        if (subtotalEl) subtotalEl.textContent = `₹${order.totalAmount}`;
        if (totalEl) totalEl.textContent = `₹${order.totalAmount}`;

        const methodEl = document.getElementById('modal-payment-method');
        const statusPayEl = document.getElementById('modal-payment-status');
        if (methodEl) methodEl.textContent = order.paymentMethod || 'Razorpay';
        if (statusPayEl) {
            statusPayEl.textContent = order.paymentStatus || 'Paid';
            statusPayEl.style.color = (order.paymentStatus === 'Paid') ? '#4CAF50' : '#ff4d4d';
        }

        // Items
        const itemsContainer = document.getElementById('modal-order-items');
        itemsContainer.innerHTML = order.items.map(item => `
            <div style="display:flex; gap:15px; align-items:center; background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                <div style="flex:1;">
                    <h4 style="margin:0; font-size:0.95rem; color:white;">${item.title}</h4>
                    <p style="margin:5px 0 0; font-size:0.8rem; opacity:0.6;">${item.type} • Qty: ${item.quantity}</p>
                </div>
                <div style="text-align:right;">
                    <span class="gold-text" style="font-weight:700;">₹${item.price}</span>
                </div>
            </div>
        `).join('');

        // Address Helper
        const getDisplayAddress = (a) => {
            if (!a) return 'No address provided';
            if (typeof a.address === 'string') return a.address;
            if (typeof a.address === 'object' && a.address !== null) {
                const addrObj = a.address;
                const parts = [addrObj.house, addrObj.area, addrObj.street, addrObj.landmark];
                return parts.filter(Boolean).join(', ');
            }
            return 'No address provided';
        };

        // Address
        const addr = order.customer;
        const addrContainer = document.getElementById('modal-shipping-address');
        if (addrContainer) {
            addrContainer.innerHTML = `
                <strong style="color:white;">${addr.name}</strong><br>
                ${getDisplayAddress(addr)}<br>
                ${addr.city || addr.address?.city || 'Unknown'}, ${addr.zip || addr.address?.pincode || '000000'}<br>
                <span style="opacity:0.6;"><i class="fas fa-phone-alt" style="font-size:0.7rem;"></i> ${addr.phone}</span>
            `;
        }

        // Timeline V2
        const timeline = document.getElementById('modal-order-timeline');
        if (timeline) {
            const steps = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
            const icons = ['cog', 'box-open', 'shipping-fast', 'motorcycle', 'check-double'];

            // Map status to these steps
            let currentIdx = steps.indexOf(order.status);
            if (currentIdx === -1 && order.status === 'Paid') currentIdx = 0; // Paid maps to Processing start

            timeline.innerHTML = steps.map((s, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                const hist = order.timeline ? order.timeline.find(t => t.status === s) : null;
                const timeStr = hist ? new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return `
                    <div class="timeline-step-v2 ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                        <div class="step-icon-v2">
                            <i class="fas fa-${icons[idx]}"></i>
                        </div>
                        <span class="step-label-v2">${s}</span>
                        ${hist ? `<span class="step-time-v2">${timeStr}</span>` : ''}
                    </div>
                `;
            }).join('');

            // Add AWB display + Refresh + full-page track link if AWB is present
            const awb = order.awbNumber || order.awb || order.shipmentId;
            const awbPanel = document.createElement('div');
            awbPanel.id = 'awb-info-panel';
            if (awb && awb.length > 5) {
                awbPanel.innerHTML = `
                    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <span style="font-size: 0.7rem; opacity: 0.5; display: block; margin-bottom: 4px; letter-spacing: 1.5px; text-transform: uppercase;">AWB Number</span>
                            <span style="font-weight: 700; color: white; font-family: monospace; letter-spacing: 1px;">${awb}</span>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-outline small" onclick="refreshTrackingData('${awb}')" id="refresh-track-btn" style="border-radius: 8px;">
                                <i class="fas fa-sync-alt" style="margin-right: 6px;"></i> Refresh Live
                            </button>
                            <a href="tracking.html?id=${order.orderId}" target="_blank" class="btn btn-gold small" style="border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                                <i class="fas fa-satellite-dish"></i> Full Tracking Page
                            </a>
                        </div>
                    </div>
                    <div id="live-tracking-updates" style="margin-top: 15px;"></div>
                `;
            } else {
                awbPanel.innerHTML = `
                    <div style="margin-top: 20px; padding: 20px; background: rgba(212,175,55,0.04); border: 1px dashed rgba(212,175,55,0.15); border-radius: 12px; text-align: center;">
                        <i class="fas fa-box-open" style="color: rgba(212,175,55,0.3); font-size: 1.5rem; margin-bottom: 10px; display: block;"></i>
                        <p style="font-size: 0.85rem; opacity: 0.6; margin: 0;">Shipment not yet dispatched. Tracking will appear here once the package is picked up.</p>
                    </div>
                `;
            }
            timeline.insertAdjacentElement('afterend', awbPanel);
        }

        modal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // If in track mode, scroll to timeline and auto-refresh
        if (mode === 'track') {
            setTimeout(() => {
                const refreshBtn = document.getElementById('refresh-track-btn');
                if (refreshBtn) refreshBtn.click();
            }, 300);
        }
    } catch (e) {
        console.error("Error loading order:", e);
        showToast("Error loading order details", "error");
    }
}

window.closeOrderDetailModal = () => {
    document.getElementById('order-detail-modal').style.display = 'none';
    document.body.classList.remove('modal-open');
};

// --- TRACKING & INVOICE HELPERS ---
window.downloadInvoice = async function (orderId) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders/track/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const order = await res.json();
        if (!res.ok) throw new Error(order.message);

        // Robust jsPDF Constructor Access
        let jsPDFConstructor;
        if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFConstructor = window.jspdf.jsPDF;
        } else if (window.jsPDF) {
            jsPDFConstructor = window.jsPDF;
        } else {
            throw new Error("PDF Library (jsPDF) not loaded. Please refresh.");
        }

        const doc = new jsPDFConstructor();

        // --- PDF Design & Branding ---
        const primaryColor = [212, 175, 55]; // EFV Gold
        const darkColor = [20, 20, 20];
        const textColor = [60, 60, 60];

        // Header Background
        doc.setFillColor(...darkColor);
        doc.rect(0, 0, 210, 45, 'F');

        // Logo / Title
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.text("EFV™", 20, 25);

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("OFFICIAL TAX INVOICE", 20, 35);

        // Order Info Box
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(`Invoice No: INV-${order.orderId.split('-').pop()}`, 150, 20);
        doc.text(`Order ID: #${order.orderId}`, 150, 27);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`, 150, 34);

        // Merchant Details (Left)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("SOLD BY:", 20, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("EFV™ - Educational Future Vision", 20, 67);
        doc.text("Madhya Pradesh, India", 20, 72);
        doc.text("GSTIN: 23EFVPA0000Z1Z1", 20, 77); // Placeholder GST
        doc.text("Support: admin@uwo24.com", 20, 82);

        // Bill To Details (Right)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("BILL TO:", 120, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(order.customer.name || 'Valued Customer', 120, 67);

        // Handle address extraction safely
        let displayAddr = 'Digital Purchase';
        const addr = order.customer.address;
        if (addr) {
            if (typeof addr === 'string') displayAddr = addr;
            else if (typeof addr === 'object') {
                displayAddr = [addr.house, addr.area, addr.street, addr.landmark].filter(Boolean).join(', ');
            }
        }
        doc.text(displayAddr, 120, 72, { maxWidth: 75 });
        doc.text(`${order.customer.city || ''} ${order.customer.zip || ''}`, 120, 87);
        doc.text(`Contact: ${order.customer.phone || 'N/A'}`, 120, 92);

        // --- Table Section ---
        const tableY = 105;
        doc.setFillColor(245, 245, 245);
        doc.rect(20, tableY, 170, 10, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("ITEM DESCRIPTION", 25, tableY + 6.5);
        doc.text("TYPE", 100, tableY + 6.5);
        doc.text("QTY", 130, tableY + 6.5);
        doc.text("PRICE", 150, tableY + 6.5);
        doc.text("TOTAL", 175, tableY + 6.5);

        // Items logic
        doc.setFont("helvetica", "normal");
        let currentY = tableY + 18;
        order.items.forEach((item, index) => {
            // Zebra striping
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(20, currentY - 6, 170, 10, 'F');
            }

            doc.text(item.title, 25, currentY, { maxWidth: 70 });
            doc.text(item.type, 100, currentY);
            doc.text(item.quantity.toString(), 132, currentY);
            doc.text(`INR ${item.price}`, 150, currentY);
            doc.text(`INR ${item.price * item.quantity}`, 175, currentY);
            currentY += 10;
        });

        // Totals Section
        const totalBoxY = currentY + 10;
        doc.setDrawColor(230, 230, 230);
        doc.line(120, totalBoxY, 190, totalBoxY);

        currentY = totalBoxY + 8;
        doc.setFontSize(10);
        doc.text("Subtotal:", 130, currentY);
        doc.text(`INR ${(order.totalAmount / 1.18).toFixed(2)}`, 175, currentY);

        currentY += 8;
        doc.text("Tax (GST 18%):", 130, currentY);
        doc.text(`INR ${(order.totalAmount - (order.totalAmount / 1.18)).toFixed(2)}`, 175, currentY);

        currentY += 12;
        doc.setFillColor(...darkColor);
        doc.rect(125, currentY - 7, 65, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("GRAND TOTAL:", 130, currentY);
        doc.text(`INR ${order.totalAmount}`, 173, currentY);

        // Footer & Terms
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("Terms & Conditions:", 20, 260);
        doc.text("1. This is a computer-generated invoice and requires no signature.", 20, 265);
        doc.text("2. Digital products (E-books/Audiobooks) are non-refundable once accessed.", 20, 270);

        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("THANK YOU FOR YOUR TRUST IN EFV™", 105, 280, { align: "center" });

        doc.save(`EFV_Invoice_${order.orderId}.pdf`);
        showToast("Invoice downloaded successfully", "success");
    } catch (e) {
        console.error(e);
        showToast(e.message || "Failed to generate invoice", "error");
    }
};

window.refreshTrackingData = async function (awb) {
    const btn = document.getElementById('refresh-track-btn');
    const logs = document.getElementById('live-tracking-updates');
    if (!btn || !logs) return;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
    btn.disabled = true;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments/track/${awb}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.status && data.data) {
            const tracking = data.data;
            // Get history — NimbusPost may use various field names
            const history = tracking.history || tracking.tracking_events || tracking.events || [];

            if (history.length > 0) {
                const sorted = [...history].reverse(); // Newest first
                logs.innerHTML = `
                    <div style="background: rgba(255,211,105,0.04); border-radius: 12px; padding: 18px; border: 1px solid rgba(255,211,105,0.12); margin-top: 4px;">
                        <p style="margin: 0 0 14px; font-size: 0.72rem; font-weight: 800; color: var(--gold-text); text-transform: uppercase; letter-spacing: 2px;">NimbusPost Live Updates</p>
                        ${sorted.slice(0, 5).map((h, i) => {
                    const evStatus = h.status || h.event_description || h.activity || 'Update';
                    const evLoc = h.location || h.city || h.hub || '';
                    const evTime = h.event_time || h.timestamp || h.date || h.datetime;
                    const timeStr = evTime ? new Date(evTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                    return `
                                <div style="display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                                    <div style="flex-shrink: 0; margin-top: 4px;">
                                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${i === 0 ? 'var(--gold-text)' : 'rgba(255,255,255,0.15)'}; box-shadow: ${i === 0 ? '0 0 8px rgba(212,175,55,0.5)' : 'none'};"></div>
                                    </div>
                                    <div style="flex: 1;">
                                        <span style="display: block; font-size: 0.88rem; font-weight: 600; color: ${i === 0 ? 'var(--gold-text)' : 'rgba(255,255,255,0.85)'}; margin-bottom: 2px;">${evStatus}</span>
                                        ${evLoc ? `<span style="font-size: 0.78rem; opacity: 0.55;"><i class="fas fa-map-marker-alt" style="font-size: 0.65rem; margin-right: 4px;"></i>${evLoc}</span>` : ''}
                                        ${timeStr ? `<span style="display: block; font-size: 0.72rem; opacity: 0.35; margin-top: 2px;">${timeStr}</span>` : ''}
                                    </div>
                                </div>
                            `;
                }).join('')}
                    </div>
                `;
                showToast('Live tracking updated', 'success');
            } else {
                logs.innerHTML = `<div style="padding: 20px; text-align: center; opacity: 0.5; font-size: 0.85rem;"><i class="fas fa-clock" style="margin-right: 8px;"></i>Carrier updates will appear once the package is picked up.</div>`;
                showToast('Shipment registered. Awaiting pickup.', 'info');
            }
        } else {
            logs.innerHTML = `<div style="padding: 20px; text-align: center; opacity: 0.5; font-size: 0.85rem;"><i class="fas fa-satellite-dish" style="margin-right: 8px;"></i>${data.message || 'Tracking info not available yet. Check back soon.'}</div>`;
            showToast(data.message || 'Tracking info not available yet', 'info');
        }
    } catch (e) {
        console.error('refreshTrackingData error:', e);
        logs.innerHTML = `<div style="padding: 20px; text-align: center; color: #ff4d4d; font-size: 0.85rem;"><i class="fas fa-wifi" style="margin-right: 8px;"></i>Connection error. Please try again.</div>`;
        showToast('Error connecting to shipping server', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

// Address Management
window.openAddressModal = function (id = null) {
    const modal = document.getElementById('address-modal');
    const form = document.getElementById('address-form');
    const title = document.getElementById('address-modal-title');

    if (!modal || !form) return;

    form.reset();
    const addrIdEl = document.getElementById('address-id');
    if (addrIdEl) addrIdEl.value = id || '';

    if (id && window.currentUserProfile && window.currentUserProfile.savedAddresses) {
        title.textContent = 'EDIT ADDRESS';
        const addr = window.currentUserProfile.savedAddresses.find(a => (a._id || a.id) === id);
        if (addr) {
            document.getElementById('addr-name').value = addr.fullName || '';
            document.getElementById('addr-phone').value = addr.phone || '';
            document.getElementById('addr-pincode').value = addr.pincode || '';
            document.getElementById('addr-state').value = addr.state || '';
            document.getElementById('addr-city').value = addr.city || '';
            document.getElementById('addr-house').value = addr.house || '';
            document.getElementById('addr-area').value = addr.area || '';
            document.getElementById('addr-landmark').value = addr.landmark || '';
            document.getElementById('addr-default').checked = !!addr.isDefault;

            const typeRadio = document.querySelector(`input[name="addr-type"][value="${addr.type || 'Home'}"]`);
            if (typeRadio) typeRadio.checked = true;
        }
    } else {
        title.textContent = 'ADD NEW ADDRESS';
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
};

window.closeAddressModal = () => {
    const modal = document.getElementById('address-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

if (document.getElementById('address-form')) {
    document.getElementById('address-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const id = document.getElementById('address-id').value;
        const data = {
            fullName: document.getElementById('addr-name').value,
            phone: document.getElementById('addr-phone').value,
            pincode: document.getElementById('addr-pincode').value,
            state: document.getElementById('addr-state').value,
            city: document.getElementById('addr-city').value,
            house: document.getElementById('addr-house').value,
            area: document.getElementById('addr-area').value,
            landmark: document.getElementById('addr-landmark').value,
            type: document.querySelector('input[name="addr-type"]:checked').value,
            isDefault: document.getElementById('addr-default').checked,
            fullAddress: `${document.getElementById('addr-house').value}, ${document.getElementById('addr-area').value}`
        };

        const url = id ? `${API_BASE}/api/users/address/${id}` : `${API_BASE}/api/users/address`;
        const method = id ? 'PUT' : 'POST';

        const savedRes = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const savedAddresses = await savedRes.json();
        closeAddressModal();
        await fetchProfileData();

        // CHECKOUT FLOW INTEGRATION
        const checkoutOverlay = document.getElementById('checkout-overlay');
        if (checkoutOverlay && checkoutOverlay.style.display === 'flex') {
            // If new address added, select it
            if (!id && savedAddresses.length > 0) {
                const newAddr = savedAddresses.find(a => a.fullName === data.fullName && a.phone === data.phone);
                if (newAddr) window.checkoutState.selectedAddressId = newAddr._id || newAddr.id;
            }
            renderCheckoutAddresses();
            // Automatically continue to summary if an address is now selected
            if (window.checkoutState.selectedAddressId) {
                continueToSummary();
            }
        }
    });
}

window.deleteAddress = async function (id) {
    if (!confirm("Are you sure?")) return;
    const token = localStorage.getItem('authToken');
    await fetch(`${API_BASE}/api/users/address/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchProfileData();
}

function renderActiveShipments() {
    const token = localStorage.getItem('authToken');
    const container = document.getElementById('active-shipment-widget');
    if (!container) return;

    fetch(`${API_BASE}/api/orders/my-orders`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(orders => {
            const active = orders.filter(o => ['Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.status));
            if (active.length === 0) {
                container.innerHTML = '<p class="fade-text">No active shipments to track.</p>';
            } else {
                container.innerHTML = active.slice(0, 1).map(o => `
                    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 15px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <span style="font-weight:700; color:var(--gold-text);">${o.orderId}</span>
                            <span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span>
                        </div>
                        <div class="shipment-mini-track" style="display:flex; gap:5px; margin-bottom:10px;">
                            <div style="flex:1; height:4px; border-radius:10px; background:var(--gold-text);"></div>
                            <div style="flex:1; height:4px; border-radius:10px; background:rgba(255,255,255,0.1);"></div>
                            <div style="flex:1; height:4px; border-radius:10px; background:rgba(255,255,255,0.1);"></div>
                        </div>
                        <p style="margin:0; font-size:0.8rem; opacity:0.6;">Current: ${o.status}</p>
                    </div>
                `).join('');
            }
        }).catch(e => console.error(e));
}

function renderNewestAddition() {
    const libKey = getUserKey('efv_digital_library');
    const library = JSON.parse(localStorage.getItem(libKey)) || [];
    const container = document.getElementById('newest-addition-content');
    if (!container) return;

    if (library.length === 0) {
        container.innerHTML = '<p class="fade-text">Empty library.</p>';
        return;
    }

    const newest = library[library.length - 1];
    container.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center;">
            <img src="${newest.thumbnail}" style="width:50px; height:70px; object-fit:cover; border-radius:4px; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
            <div style="flex:1;">
                <h4 style="margin:0; font-size:1rem;">${newest.name || newest.title}</h4>
                <p style="margin:2px 0; font-size:0.8rem; opacity:0.5;">${newest.type}</p>
                <button class="btn btn-gold small" style="margin-top:5px; height:30px;" onclick="accessContent('${newest.type}', '${(newest.name || newest.title).replace(/'/g, "\\'")}', '${newest.productId || newest.id}')">Access</button>
            </div>
        </div>
    `;
}

// Security Settings logic
if (document.getElementById('security-settings-form')) {
    // This is optional if user added it in HTML. Let's add it to Account Settings tab.
}

// Profile Save
if (document.getElementById('profile-form-v2')) {
    document.getElementById('profile-form-v2').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const data = {
            name: document.getElementById('settings-name-v2').value,
            phone: document.getElementById('settings-phone-v2').value
        };
        const res = await fetch(`${API_BASE}/api/users/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            showToast("Profile updated successfully", "success");
            fetchProfileData();
        } else {
            showToast("Update failed", "error");
        }
    });
}

// --- ACTIVITY CENTER HELPERS (NEW) ---
window.loadRecommendations = async function () {
    const container = document.getElementById('recommended-grid');
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        const products = await res.json();
        const recommended = products.slice(0, 6); // Mock logic
        container.innerHTML = recommended.map(p => renderMiniProductCard(p)).join('');
    } catch (e) { }
};

window.loadRecentlyViewed = function () {
    const container = document.getElementById('recently-viewed-grid');
    if (!container) return;
    const viewed = JSON.parse(localStorage.getItem('recently_viewed')) || [];
    if (viewed.length === 0) {
        container.innerHTML = '<p class="fade-text" style="padding: 20px;">No recently viewed items.</p>';
        return;
    }
    container.innerHTML = viewed.map(p => renderMiniProductCard(p)).join('');
};

function renderMiniProductCard(p) {
    return `
        <div class="mini-product-card glass-panel" onclick="location.href='marketplace.html?id=${p._id || p.id}'">
            <img src="${p.thumbnail || 'img/vol1-cover.png'}" alt="${p.title}">
            <div class="mini-card-info">
                <h4>${p.title}</h4>
                <p class="gold-text">₹${p.price}</p>
            </div>
        </div>
    `;
}

// --- TOAST SYSTEM (NEW) ---
window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'toast-container';
        document.body.appendChild(div);
    }

    const toast = document.createElement('div');
    toast.className = `efv-toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    const containerEl = document.getElementById('toast-container');
    if (containerEl) containerEl.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// --- CART REDESIGN RENDERING (NEW) ---
window.renderCartTab = function () {
    const cartKey = getUserKey('efv_cart');
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const list = document.getElementById('dashboard-cart-list');
    const emptyState = document.getElementById('cart-empty-state');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-grand-total');
    const countText = document.getElementById('cart-item-count-text');

    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (countText) countText.textContent = '0 items in your cart';
        return;
    }

    emptyState.classList.add('hidden');
    if (countText) countText.textContent = `${cart.length} items in your cart`;

    let subtotal = 0;
    list.innerHTML = cart.map(item => {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity) || 1;
        subtotal += (price * qty);

        return `
            <div class="cart-item-card" style="
                background: linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(15,12,8,0.98) 100%);
                border: 1px solid rgba(255, 211, 105, 0.15);
                border-radius: 16px;
                padding: 18px 20px;
                display: flex;
                gap: 20px;
                align-items: center;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            " onmouseenter="this.style.borderColor='rgba(255,211,105,0.4)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 30px rgba(0,0,0,0.5)'" onmouseleave="this.style.borderColor='rgba(255,211,105,0.15)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.4)'">
                
                <!-- Subtle glow accent -->
                <div style="position:absolute; top:0; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent, rgba(255,211,105,0.3), transparent);"></div>

                <div style="position: relative; flex-shrink: 0;">
                    <img src="${item.thumbnail || 'img/vol1-cover.png'}" class="cart-cover-img"
                        style="width: 75px; height: 105px; object-fit: cover; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.5); border: 1px solid rgba(255,211,105,0.2);"
                        onerror="this.src='img/vol1-cover.png'">
                </div>

                <!-- Info -->
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <h4 class="cart-item-title" style="margin: 0; font-size: 1rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${item.name || item.title}
                        </h4>
                    </div>
                    <p style="margin: 0 0 12px; font-size: 0.78rem; color: rgba(255,255,255,0.4); letter-spacing: 0.3px;">
                        <i class="fas fa-tag" style="color: rgba(255,211,105,0.5); margin-right: 4px;"></i>${item.type || 'Standard Edition'}
                        ${item.language ? `&nbsp;•&nbsp;<i class="fas fa-globe" style="color: rgba(255,211,105,0.5); margin-right: 4px;"></i>${item.language}` : ''}
                    </p>

                    <!-- Qty + Price Row -->
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <!-- Qty Selector -->
                        <div class="cart-qty-ctrl" style="
                            display: flex !important; align-items: center !important; gap: 0 !important;
                            flex-direction: row !important; flex-wrap: nowrap !important;
                            background: rgba(255,255,255,0.05);
                            border: 1px solid rgba(255,255,255,0.1);
                            border-radius: 8px;
                            overflow: hidden;
                            min-width: 100px;
                        ">
                            <button onclick="updateCartQty('${item.id}', -1)" style="
                                background: transparent; border: none; color: rgba(255,255,255,0.7);
                                width: 32px; height: 32px; cursor: pointer; font-size: 1rem;
                                display: flex; align-items: center; justify-content: center;
                                transition: all 0.2s;
                            " onmouseenter="this.style.background='rgba(255,211,105,0.1)'; this.style.color='#FFD369'" onmouseleave="this.style.background='transparent'; this.style.color='rgba(255,255,255,0.7)'">
                                <i class="fas fa-minus" style="font-size: 0.65rem;"></i>
                            </button>
                            <span style="
                                min-width: 32px; text-align: center; font-weight: 700;
                                font-size: 0.95rem; color: white; background: rgba(255,211,105,0.08);
                                height: 32px; line-height: 32px; border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08);
                            ">${qty}</span>
                            <button onclick="updateCartQty('${item.id}', 1)" style="
                                background: transparent; border: none; color: rgba(255,255,255,0.7);
                                width: 32px; height: 32px; cursor: pointer; font-size: 1rem;
                                display: flex; align-items: center; justify-content: center;
                                transition: all 0.2s;
                            " onmouseenter="this.style.background='rgba(255,211,105,0.1)'; this.style.color='#FFD369'" onmouseleave="this.style.background='transparent'; this.style.color='rgba(255,255,255,0.7)'">
                                <i class="fas fa-plus" style="font-size: 0.65rem;"></i>
                            </button>
                        </div>

                        <!-- Price -->
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 1.15rem; font-weight: 800; background: linear-gradient(135deg, #FFD369, #FDB931); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                ₹${(price * qty).toFixed(2)}
                            </span>
                            ${qty > 1 ? `<span style="font-size: 0.72rem; color: rgba(255,255,255,0.35);">₹${price.toFixed(2)} each</span>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Remove Button -->
                <button onclick="removeFromCart('${item.id}')" style="
                    flex-shrink: 0;
                    background: rgba(255, 77, 77, 0.1);
                    border: 1px solid rgba(255, 77, 77, 0.2);
                    color: #ff4d4d;
                    width: 36px; height: 36px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                    font-size: 0.85rem;
                " onmouseenter="this.style.background='rgba(255,77,77,0.25)'; this.style.transform='scale(1.1)'" onmouseleave="this.style.background='rgba(255,77,77,0.1)'; this.style.transform='scale(1)'">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }).join('');

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₹${subtotal.toFixed(2)}`; // Simplified for now
};

window.updateCartQty = function (id, delta) {
    const cartKey = getUserKey('efv_cart');
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const idx = cart.findIndex(i => i.id === id);
    if (idx !== -1) {
        cart[idx].quantity = Math.max(1, (cart[idx].quantity || 1) + delta);
        localStorage.setItem(cartKey, JSON.stringify(cart));
        renderCartTab();
    }
};

window.removeFromCart = function (id) {
    const cartKey = getUserKey('efv_cart');
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem(cartKey, JSON.stringify(cart));
    renderCartTab();
    showToast('Item removed from cart', 'info');
};

window.loadBillingHistory = function () {
    const container = document.getElementById('billing-history-list');
    if (!container) return;
    // Mock for now
    container.innerHTML = '<p class="fade-text">No invoices found. They appear after successful payments.</p>';
};

// --- WISHLIST LOGIC ---
window.renderWishlistTab = function () {
    const container = document.getElementById('wishlist-items-grid');
    if (!container) return;
    const wishlistKey = getUserKey('efv_wishlist');
    const wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    if (wishlist.length === 0) {
        container.innerHTML = '<p class="fade-text" style="grid-column: 1/-1; padding: 40px; text-align: center;">Your wishlist is empty.</p>';
        return;
    }
    container.innerHTML = wishlist.map(p => `
        <div class="glass-panel" style="padding: 15px; display: flex; gap: 15px; align-items: center;">
            <img src="${p.thumbnail}" style="width: 50px; height: 70px; border-radius: 4px; object-fit: cover;">
            <div style="flex:1;">
                <h4 style="margin:0;">${p.title}</h4>
                <p style="margin:2px 0; color:var(--gold-text); font-weight:700;">₹${p.price}</p>
            </div>
            <button class="btn btn-outline small" onclick="removeFromWishlist('${p.id}')">Remove</button>
        </div>
    `).join('');
};

window.removeFromWishlist = function (id) {
    const wishlistKey = getUserKey('efv_wishlist');
    let wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    wishlist = wishlist.filter(i => i.id !== id);
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    renderWishlistTab();
    showToast('Removed from wishlist', 'info');
};

function getStatusClass(status) {
    if (!status) return 'status-pending';
    const s = status.toLowerCase().replace(/\s/g, '-');
    switch (s) {
        case 'delivered':
        case 'completed': return 'status-delivered';
        case 'shipped': return 'status-shipped';
        case 'processing':
        case 'packed': return 'status-processing';
        case 'cancelled':
        case 'failed':
        case 'payment-failed': return 'status-cancelled';
        case 'paid': return 'status-shipped';
        default: return 'status-pending';
    }
}

// 3.1 Settings Internals (NEW)
function initializeSettingsTabs() {
    const sTabs = document.querySelectorAll('.settings-tab-btn[data-settings-tab]'); // Targeted to customer tabs
    const sPanes = document.querySelectorAll('#settings .settings-pane');
    sTabs.forEach(t => {
        t.addEventListener('click', () => {
            sTabs.forEach(btn => btn.classList.remove('active'));
            sPanes.forEach(pane => pane.style.display = 'none');

            t.classList.add('active');
            const target = t.getAttribute('data-settings-tab');
            document.getElementById(target).style.display = 'block';

            if (target === 'addresses-tab') renderSavedAddresses();
            if (target === 'payments-tab') loadBillingHistory();
        });
    });
}

function initializeNotificationFilters() {
    const nTabs = document.querySelectorAll('.settings-tab-btn[data-notif-filter]');
    nTabs.forEach(t => {
        t.addEventListener('click', () => {
            nTabs.forEach(btn => btn.classList.remove('active'));
            t.classList.add('active');
            const filter = t.getAttribute('data-notif-filter');
            renderNotificationsTab(filter);
        });
    });
}

function initializeAdminSettings() {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user) return;

    // 1. Fill Data
    if (document.getElementById('adm-name')) document.getElementById('adm-name').value = user.name;
    if (document.getElementById('adm-email')) document.getElementById('adm-email').value = user.email;
    if (document.getElementById('admin-full-name')) document.getElementById('admin-full-name').textContent = user.name;
    if (document.getElementById('adm-last-login')) {
        document.getElementById('adm-last-login').value = new Date().toLocaleString();
    }

    // 2. Sub-tab Switching
    const aTabs = document.querySelectorAll('.settings-tab-btn[data-admin-tab]');
    const aPanes = document.querySelectorAll('#admin-settings .settings-pane');

    aTabs.forEach(t => {
        // Remove existing listeners by cloning if necessary, but here we just ensure we don't double bind
        const newT = t.cloneNode(true);
        t.parentNode.replaceChild(newT, t);

        newT.addEventListener('click', () => {
            aTabs.forEach(btn => btn.classList.remove('active')); // Note: we need to re-query for active class removal
            document.querySelectorAll('.settings-tab-btn[data-admin-tab]').forEach(btn => btn.classList.remove('active'));
            aPanes.forEach(pane => pane.style.display = 'none');

            newT.classList.add('active');
            const targetId = newT.getAttribute('data-admin-tab');
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.style.display = 'block';
        });
    });

    // Toggle switches logic
    document.querySelectorAll('.toggle-switch').forEach(sw => {
        sw.onclick = () => sw.classList.toggle('active');
    });
}
window.initializeAdminSettings = initializeAdminSettings; // Make it global
