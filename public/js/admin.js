// Integrated with global security.js
console.log("📂 admin.js: Loading Version 1.2 (Active)...");

const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';
let allAdminProducts = [];

// User Data Isolation Helpers
function getUserKey(baseKey) {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user || !user.email) return baseKey;
    // Clean email to use as key part (remove special chars)
    const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${baseKey}_${cleanEmail}`;
}


// --- ADMIN MODAL SYSTEM (Consolidated) ---
window.openProductModal = function (productId = null) {
    const modal = document.getElementById('admin-product-modal');
    const form = document.getElementById('admin-product-form');
    const title = document.getElementById('admin-modal-title');
    const saveBtn = document.getElementById('admin-save-btn');

    if (!modal || !form) return;

    form.reset();
    const prodIdInput = document.getElementById('admin-prod-id');
    if (prodIdInput) prodIdInput.value = '';

    document.getElementById('admin-current-cover').innerHTML = '';
    document.getElementById('admin-current-ebook').innerHTML = '';

    const chaptersContainer = document.getElementById('admin-chapters-container');
    if (chaptersContainer) chaptersContainer.innerHTML = '';
    const totalChaptersInput = document.getElementById('admin-prod-total-chapters');
    if (totalChaptersInput) totalChaptersInput.value = '';

    window._currentEditingProduct = null;

    // Reset file inputs
    const files = ['admin-file-cover', 'admin-file-ebook', 'admin-file-audio'];
    files.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = '';
    });

    toggleAdminFileFields('HARDCOVER');

    if (productId) {
        if (title) title.textContent = 'Edit Product';
        if (saveBtn) saveBtn.textContent = 'Update Product';
        window.editProduct(productId);
    } else {
        if (title) title.textContent = 'Add New Product';
        if (saveBtn) saveBtn.textContent = 'Add Product';
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
    initModalParticles('modal-particles-canvas', 'admin-product-modal');
};

window.editProduct = async function (productId) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const product = await res.json();
        if (!res.ok) throw new Error(product.message || 'Failed to fetch');

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

        if (product.thumbnail) document.getElementById('admin-current-cover').innerHTML = `<i class="fas fa-file-image"></i> Current: ${product.thumbnail.split('/').pop()}`;
        if (product.filePath && product.type === 'EBOOK') document.getElementById('admin-current-ebook').innerHTML = `<i class="fas fa-file-pdf"></i> Current: ${product.filePath.split('/').pop()}`;

        // Load Chapters if Audiobook
        if (product.type === 'AUDIOBOOK') {
            document.getElementById('admin-prod-total-chapters').value = product.totalChapters || (product.chapters ? product.chapters.length : 0);
            const container = document.getElementById('admin-chapters-container');
            if (container) {
                container.innerHTML = '';
                if (product.chapters && product.chapters.length > 0) {
                    product.chapters.forEach((ch, idx) => {
                        container.appendChild(window.createChapterCard(idx, ch));
                    });
                }
            }
        }

        window._currentEditingProduct = product;
        window.toggleAdminFileFields(product.type);
    } catch (e) {
        console.error(e);
        alert("Error loading product");
    }
};

window.closeProductModal = function () {
    const modal = document.getElementById('admin-product-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

window.toggleAdminFileFields = function (type) {
    if (!type) {
        const sel = document.getElementById('admin-prod-type');
        type = sel ? sel.value : 'HARDCOVER';
    }
    const physical = document.querySelectorAll('.admin-physical-field');
    const digital = document.querySelectorAll('.admin-digital-field');
    const ebook = document.getElementById('admin-field-ebook');
    const audio = document.getElementById('admin-field-audio');
    const duration = document.getElementById('admin-prod-duration-group');

    physical.forEach(el => el.style.display = (['HARDCOVER', 'PAPERBACK'].includes(type)) ? 'block' : 'none');
    digital.forEach(el => el.style.display = (['EBOOK', 'AUDIOBOOK'].includes(type)) ? 'block' : 'none');
    if (ebook) ebook.style.display = (type === 'EBOOK') ? 'block' : 'none';
    if (audio) audio.style.display = (type === 'AUDIOBOOK') ? 'block' : 'none';
    if (duration) duration.style.display = (type === 'AUDIOBOOK') ? 'block' : 'none';
};

// --- AUDIOBOOK CHAPTER HELPERS ---
window.generateChapterCards = function () {
    const totalInput = document.getElementById('admin-prod-total-chapters');
    const total = parseInt(totalInput.value);
    if (!total || total < 1) {
        showToast("Please enter a valid number of chapters", "error");
        return;
    }

    if (total > 100) {
        showToast("Maximum 100 chapters allowed", "error");
        return;
    }

    const container = document.getElementById('admin-chapters-container');
    if (!container) return;

    // Preserve existing data if possible
    const existingData = [];
    container.querySelectorAll('.chapter-card').forEach(card => {
        const idx = card.dataset.index;
        existingData[idx] = {
            title: document.getElementById(`chapter-title-${idx}`).value,
            // We can't easily preserve file inputs, but we can preserve the 'Current' label
            currentFile: document.getElementById(`chapter-current-${idx}`).innerHTML
        };
    });

    container.innerHTML = '';
    for (let i = 0; i < total; i++) {
        container.appendChild(window.createChapterCard(i, existingData[i]));
    }
    showToast(`Generated ${total} chapter slots`, "success");
};

window.createChapterCard = function (index, data = null) {
    const div = document.createElement('div');
    div.className = 'chapter-card glass-panel fade-in';
    div.dataset.index = index;
    div.style.padding = '15px';
    div.style.border = '1px solid rgba(255,255,255,0.05)';
    div.style.borderRadius = '12px';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.style.transition = '0.3s';

    const title = data ? (data.title || (data.chapterNumber ? data.title : '')) : '';
    const currentFileHtml = data ? (data.currentFile || (data.filePath ? `<i class="fas fa-link"></i> ${data.filePath.split('/').pop()}` : '')) : '';

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,211,105,0.1); padding-bottom:8px;">
            <span style="font-weight:700; color:var(--gold-text); font-size: 0.75rem; letter-spacing:1px;">CHAPTER ${index + 1}</span>
            <span class="chapter-status" id="chapter-status-${index}" style="font-size: 0.65rem; opacity: 0.6; color: ${currentFileHtml ? '#2ecc71' : 'inherit'}">
                ${currentFileHtml ? '✓ Uploaded' : 'Waiting...'}
            </span>
        </div>
        <div class="p-form-group" style="margin-bottom:12px;">
            <input type="text" id="chapter-title-${index}" class="p-input" value="${title}" placeholder=" " style="font-size:0.85rem; height:35px;">
            <label class="p-label" style="font-size:0.7rem;">Chapter Title</label>
        </div>
        <div class="chapter-file-area" style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
            <input type="file" id="chapter-audio-${index}" accept="audio/*" onchange="window.updateChapterFileStatus(${index})" 
                style="width:100%; font-size:0.7rem; color:rgba(255,255,255,0.4); cursor:pointer;">
            <div id="chapter-current-${index}" style="font-size: 0.65rem; color: var(--gold-text); margin-top: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${currentFileHtml}
            </div>
        </div>
    `;

    // Add hover effect
    div.onmouseenter = () => div.style.borderColor = 'rgba(212,175,55,0.3)';
    div.onmouseleave = () => div.style.borderColor = 'rgba(255,255,255,0.05)';

    return div;
};

window.updateChapterFileStatus = function (index) {
    const input = document.getElementById(`chapter-audio-${index}`);
    const status = document.getElementById(`chapter-status-${index}`);
    if (input && input.files.length > 0) {
        status.textContent = '✓ Ready';
        status.style.color = '#2ecc71';
        status.style.opacity = '1';
    }
};

window.handleBulkChapterUpload = function (input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    // Sort files numerically if they have numbers in name
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const container = document.getElementById('admin-chapters-container');
    let cards = container.querySelectorAll('.chapter-card');

    // Auto-expand chapters if needed
    const totalInput = document.getElementById('admin-prod-total-chapters');
    if (cards.length < files.length) {
        totalInput.value = files.length;
        window.generateChapterCards();
        cards = container.querySelectorAll('.chapter-card');
    }

    files.forEach((file, i) => {
        if (cards[i]) {
            const fileInput = document.getElementById(`chapter-audio-${i}`);
            if (fileInput) {
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                window.updateChapterFileStatus(i);
            }
        }
    });

    showToast(`Assigned ${files.length} files to chapters`, "success");
};


window.deleteProduct = async function (id) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            window.loadAdminProductsFull();
            window.updateAdminStats();
        } else alert('Delete failed');
    } catch (e) {
        console.error(e);
    }
};

window.updateAdminStats = async function () {
    try {
        const token = localStorage.getItem('authToken');

        const [productsRes, ordersRes, usersRes] = await Promise.all([
            fetch(`${API_BASE}/api/products`),
            fetch(`${API_BASE}/api/orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({}))
        ]);

        const productsJson = await productsRes.json();
        const ordersJson = ordersRes.ok ? await ordersRes.json() : [];

        const products = Array.isArray(productsJson) ? productsJson : [];
        const orders = Array.isArray(ordersJson) ? ordersJson : [];
        let users = [];
        if (usersRes && usersRes.ok) {
            const usersJson = await usersRes.json().catch(() => []);
            users = Array.isArray(usersJson) ? usersJson : [];
        }

        const revenue = orders.reduce((sum, o) => {
            if (!o || ['Failed', 'Cancelled', 'Returned'].includes(o.status)) return sum;
            return sum + (Number(o.totalAmount) || 0);
        }, 0);

        const totalProdEl = document.getElementById('admin-stat-total-products');
        const totalOrderEl = document.getElementById('admin-stat-total-orders');
        const revenueEl = document.getElementById('admin-stat-revenue');
        const usersEl = document.getElementById('admin-stat-users');

        if (totalProdEl) totalProdEl.textContent = products.length;
        if (totalOrderEl) totalOrderEl.textContent = orders.length;
        if (revenueEl) revenueEl.textContent = '₹' + revenue.toLocaleString();
        if (usersEl) usersEl.textContent = users.length || '--';

    } catch (e) {
        console.error("Admin Stats Update Error:", e);
    }
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
    // Destroy "decrypted buffers" (clear canvases)
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check - Redirect if not logged in
    const user = JSON.parse(localStorage.getItem('efv_user'));

    if (!user) {
        window.location.href = 'marketplace.html';
        return;
    }

    // Role-Based Page Protection
    const isProfilePage = window.location.pathname.includes('profile.html');
    const isAdminPage = window.location.pathname.includes('admin-dashboard.html');
    const isAdmin = user && (user.role === 'admin' || (user.email && user.email.toLowerCase() === 'admin@uwo24.com'));
    if (isAdminPage && !isAdmin) {
        console.warn("Security: Unauthorized admin access attempt.");
        window.location.href = 'profile.html';
        return;
    }

    // 2. If Admin tries to access Customer Profile -> Bounce to Admin Dashboard
    if (isProfilePage && isAdmin) {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    // --- ADMIN HELPERS ---
    window.openAddProductModal = () => window.openProductModal(null);

    window.deleteOrder = async function (id) {
        if (!confirm('Permanently delete this order record?')) return;
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_BASE}/api/orders/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Order deleted', 'info');
                loadAdminOrdersFull();
                updateAdminStats();
            } else {
                alert('Failed to delete order');
            }
        } catch (e) { console.error(e); }
    };

    // Mobile Hamburger Toggle
    const dashHamb = document.getElementById('dashboard-hamburger');
    const sideNav = document.querySelector('.sidebar-nav');
    if (dashHamb && sideNav) {
        // Clear existing to avoid double binding
        const newDashHamb = dashHamb.cloneNode(true);
        dashHamb.parentNode.replaceChild(newDashHamb, dashHamb);

        newDashHamb.addEventListener('click', (e) => {
            e.stopPropagation();
            newDashHamb.classList.toggle('active');
            sideNav.classList.toggle('active');
        });

        // Close menu when clicking a nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                newDashHamb.classList.remove('active');
                sideNav.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sideNav.contains(e.target) && !newDashHamb.contains(e.target)) {
                newDashHamb.classList.remove('active');
                sideNav.classList.remove('active');
            }
        });
    }

    // Global switchTab Helper
    window.switchTab = function (tabId, subTab = null) {
        const user = JSON.parse(localStorage.getItem('efv_user'));
        const isAdmin = user && (user.role === 'admin' || (user.email && user.email.toLowerCase() === 'admin@uwo24.com'));
        let effectiveTabId = tabId;

        // Map 'dashboard' to 'admin' for admins on this page
        if (tabId === 'dashboard' && isAdmin) effectiveTabId = 'admin';

        // Redirect Admin to Admin Settings
        if (tabId === 'settings' && isAdmin) effectiveTabId = 'admin-settings';

        // Security: Bounce Non-Admins from Admin Sections
        if ((effectiveTabId === 'admin-settings' || effectiveTabId.startsWith('admin-')) && !isAdmin) {
            console.warn("Unauthorized access attempt blocked.");
            window.location.href = 'profile.html';
            return;
        }

        // Try to click the ACTUAL nav button if it exists (using original tabId for lookup)
        const tabBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if (tabBtn) {
            tabBtn.click();
        } else {
            // Deactivate all tabs and sections first
            document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const section = document.getElementById(effectiveTabId);
            if (section) section.classList.add('active');
            if (effectiveTabId === 'admin-settings') initializeAdminSettings();
        }

        if (subTab) {
            setTimeout(() => {
                const subTabBtn = document.querySelector(`.settings-tab-btn[data-admin-tab="${subTab}"], .settings-tab-btn[data-settings-tab="${subTab}"]`);
                if (subTabBtn) subTabBtn.click();
            }, 150);
        }
    };

    // 2. Initialize Dashboard
    initializeDashboard(user);

    // 3. Tab Logic
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

            // Refresh specific data on tab switch
            if (targetId === 'dashboard') updateDashboardOverview();
            if (targetId === 'admin') updateAdminStats();
            if (targetId === 'library') syncLibraryWithBackend();
            if (targetId === 'notifications') renderNotificationsTab();
            if (targetId === 'admin-orders') loadAdminOrdersFull();
            if (targetId === 'admin-products') loadAdminProductsFull();
            if (targetId === 'admin-payments') loadAdminPayments();
            if (targetId === 'admin-shipments') loadAdminShipments();
            if (targetId === 'admin-coupons') loadAdminCoupons();
            if (targetId === 'admin-customers') loadAdminCustomers();
            if (targetId === 'admin-support') loadAdminSupport();
            if (targetId === 'admin-contacts') loadAdminContacts();

            // ROLE BASED SETTINGS REDIRECTION
            if (targetId === 'settings') {
                const isAdmin = user && (user.role === 'admin' || user.email.toLowerCase() === 'admin@uwo24.com');
                if (isAdmin) {
                    // Force admin to the control center
                    sections.forEach(s => s.classList.remove('active'));
                    const adminSettingsSection = document.getElementById('admin-settings');
                    if (adminSettingsSection) adminSettingsSection.classList.add('active');
                    initializeAdminSettings();
                } else {
                    initializeSettingsTabs();
                }
            }

            // Security Rule: Prevent customers from accessing admin-settings directly
            if (targetId === 'admin-settings') {
                const isAdmin = user && (user.role === 'admin' || user.email.toLowerCase() === 'admin@uwo24.com');
                if (!isAdmin) {
                    window.location.href = 'profile.html'; // Bounce back
                } else {
                    initializeAdminSettings();
                }
            }
        });
    });

    // 3.1 Settings Internals
    const initializeSettingsTabs = () => {
        const sTabs = document.querySelectorAll('.settings-tab-btn[data-settings-tab]');
        const sPanes = document.querySelectorAll('#settings .settings-pane');
        sTabs.forEach(t => {
            t.addEventListener('click', () => {
                sTabs.forEach(btn => btn.classList.remove('active'));
                sPanes.forEach(pane => pane.style.display = 'none');
                t.classList.add('active');
                const target = t.getAttribute('data-settings-tab');
                const targetPane = document.getElementById(target);
                if (targetPane) targetPane.style.display = 'block';
                if (target === 'addresses-tab') renderSavedAddresses();
                if (target === 'payments-tab') loadBillingHistory();
            });
        });
    };
    window.initializeSettingsTabs = initializeSettingsTabs; // Make it global

    const initializeAdminSettings = () => {
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
            t.addEventListener('click', () => {
                aTabs.forEach(btn => btn.classList.remove('active'));
                aPanes.forEach(pane => pane.style.display = 'none');
                t.classList.add('active');
                const targetId = t.getAttribute('data-admin-tab');
                const targetPane = document.getElementById(targetId);
                if (targetPane) targetPane.style.display = 'block';
            });
        });

        // Toggle switches logic
        document.querySelectorAll('.toggle-switch').forEach(sw => {
            sw.onclick = () => sw.classList.toggle('active');
        });

        // 3. Update Admin Identity Listener
        const updateBtn = document.getElementById('update-admin-btn');
        if (updateBtn) {
            updateBtn.onclick = async () => {
                const name = document.getElementById('adm-name').value;
                const token = localStorage.getItem('authToken');

                if (!name.trim()) {
                    showToast("Name cannot be empty", "error");
                    return;
                }

                updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                updateBtn.disabled = true;

                try {
                    const res = await fetch(`${API_BASE}/api/users/profile`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ name })
                    });

                    if (res.ok) {
                        // Update local storage user object
                        const user = JSON.parse(localStorage.getItem('efv_user'));
                        user.name = name;
                        localStorage.setItem('efv_user', JSON.stringify(user));

                        // Update UI
                        if (document.getElementById('admin-full-name')) {
                            document.getElementById('admin-full-name').textContent = name;
                        }
                        if (document.getElementById('sidebar-user-name')) {
                            document.getElementById('sidebar-user-name').textContent = name;
                        }

                        showToast("Admin identity updated successfully", "success");
                    } else {
                        const err = await res.json();
                        showToast(err.message || "Failed to update", "error");
                    }
                } catch (e) {
                    console.error(e);
                    showToast("Server error", "error");
                } finally {
                    updateBtn.innerHTML = 'Update Admin Identity';
                    updateBtn.disabled = false;
                }
            };
        }
    };
    window.initializeAdminSettings = initializeAdminSettings; // Make it global

    // 3.2 Order Filters
    document.querySelectorAll('[data-order-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-order-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderOrdersTab(btn.getAttribute('data-order-filter'));
        });
    });

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

    // 5. Initial Render
    if (typeof renderCartTab === 'function') renderCartTab();
    if (typeof renderOrdersTab === 'function') renderOrdersTab();
    if (typeof renderLibraryTab === 'function') renderLibraryTab();
    if (typeof updateStats === 'function') updateStats();
    if (typeof updateAuthNavbar === 'function') updateAuthNavbar();

    // Check for query param to open specific tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const subTabParam = urlParams.get('subtab'); // Added subtab param
    if (tabParam) {
        window.switchTab(tabParam, subTabParam);
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
            }
        });
    }
});

window.loadAdminSupport = async function () {
    const tableBody = document.getElementById('admin-support-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading support inquiries...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/support/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();

        if (!res.ok) throw new Error(messages.message || 'Failed to fetch');

        if (!Array.isArray(messages)) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; opacity: 0.5;">No support message data available.</td></tr>';
            return;
        }

        if (messages.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; opacity: 0.5;">No support messages found.</td></tr>';
            return;
        }

        // Sort by newest first
        messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Store messages globally for easy access
        window.adminSupportMessages = messages;

        tableBody.innerHTML = messages.map(msg => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-size: 0.85rem; opacity: 0.7;">${new Date(msg.createdAt).toLocaleDateString()}</td>
                <td style="padding: 12px;">
                    <div style="font-weight: 600;">${msg.name}</div>
                    <div style="font-size: 0.8rem; opacity: 0.6;">${msg.email}</div>
                </td>
                <td style="padding: 12px;">${msg.subject}</td>
                <td style="padding: 12px; max-width: 300px;">
                    <button class="btn btn-outline small" onclick="openSupportView('${msg._id}')" style="padding: 5px 12px; font-size: 0.75rem; border-radius: 20px;">
                        <i class="fas fa-eye"></i> VIEW MESSAGE
                    </button>
                </td>
                <td style="padding: 12px;">
                    <span class="status-badge ${msg.status.toLowerCase().replace(' ', '-')}">${msg.status}</span>
                </td>
                <td style="padding: 12px; display: flex; gap: 8px; align-items: center;">
                    <button class="btn btn-gold small" onclick="openSupportReply('${msg._id}')" style="padding: 6px 15px; font-size: 0.75rem; border-radius: 20px; font-weight: 700;">
                        REPLY
                    </button>
                    <select class="status-select-gold" onchange="updateSupportStatus('${msg._id}', this.value)">
                        <option value="Open" ${msg.status === 'Open' ? 'selected' : ''}>Open</option>
                        <option value="In Progress" ${msg.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${msg.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                        <option value="Closed" ${msg.status === 'Closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--error);">Error loading messages.</td></tr>';
    }
};

window.loadAdminContacts = async function () {
    const tableBody = document.getElementById('admin-contacts-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading contact messages...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/support/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();

        if (!res.ok) throw new Error(messages.message || 'Failed to fetch');

        // Filter for contact form submissions only
        const contactMessages = messages.filter(msg =>
            msg.subject === 'Contact Form Submission'
        );

        if (contactMessages.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; opacity: 0.5;">No contact form messages found.</td></tr>';
            return;
        }

        // Sort by newest first
        contactMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Store globally for opening details/reply
        window.adminSupportMessages = messages;

        tableBody.innerHTML = contactMessages.map(msg => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-size: 0.85rem; opacity: 0.7;">
                    ${new Date(msg.createdAt).toLocaleDateString()}<br>
                    <span style="font-size: 0.75rem; opacity: 0.5;">${new Date(msg.createdAt).toLocaleTimeString()}</span>
                </td>
                <td style="padding: 12px;">
                    <div style="font-weight: 600;">${msg.name}</div>
                </td>
                <td style="padding: 12px; color: var(--gold-text);">${msg.email}</td>
                <td style="padding: 12px; max-width: 300px;">
                    <div style="font-size: 0.85rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${msg.message}
                    </div>
                    <button class="btn btn-outline small" onclick="openSupportView('${msg._id}')" style="margin-top: 5px; padding: 2px 8px; font-size: 0.7rem; height: auto;">
                        <i class="fas fa-expand-alt"></i> READ FULL
                    </button>
                </td>
                <td style="padding: 12px;">
                    <span class="status-badge ${msg.status.toLowerCase().replace(' ', '-')}">${msg.status}</span>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--error);">Error loading contact messages.</td></tr>';
    }
};

window.openSupportView = function (id) {
    if (!window.adminSupportMessages) return;
    const msg = window.adminSupportMessages.find(m => m._id === id);
    if (!msg) return;

    document.getElementById('view-msg-id').value = msg._id;
    document.getElementById('view-user-name').textContent = msg.name;
    document.getElementById('view-user-email').textContent = msg.email;
    document.getElementById('view-subject').textContent = msg.subject;
    document.getElementById('view-date').textContent = new Date(msg.createdAt).toLocaleString();
    document.getElementById('view-message-content').textContent = msg.message;

    const replySection = document.getElementById('view-reply-section');
    const replyContent = document.getElementById('view-reply-content');
    const replyBtn = document.getElementById('view-reply-btn');

    if (msg.reply) {
        replySection.style.display = 'block';
        replyContent.textContent = msg.reply;
        replyBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Reply';
    } else {
        replySection.style.display = 'none';
        replyBtn.innerHTML = '<i class="fas fa-reply"></i> Reply Now';
    }

    const modal = document.getElementById('support-view-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
};

window.closeSupportViewModal = function () {
    const modal = document.getElementById('support-view-modal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 400);
};

window.openSupportReply = function (id) {
    if (!window.adminSupportMessages) return;
    const msg = window.adminSupportMessages.find(m => m._id === id);
    if (!msg) return;

    document.getElementById('reply-message-id').value = msg._id;
    document.getElementById('reply-user-name').textContent = msg.name;
    document.getElementById('reply-user-email').textContent = msg.email;
    document.getElementById('reply-subject').textContent = msg.subject;
    document.getElementById('reply-original-message').textContent = msg.message;
    document.getElementById('reply-content').value = msg.reply || '';

    const modal = document.getElementById('support-reply-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
};

window.closeSupportReplyModal = function () {
    const modal = document.getElementById('support-reply-modal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 400);
};

// Initialize Admin Support listeners
function initializeSupportListeners() {
    const replyForm = document.getElementById('support-reply-form');
    if (replyForm) {
        console.log("✅ Support Reply Form found, adding listener...");
        // Remove existing listener to avoid double submission
        const newForm = replyForm.cloneNode(true);
        replyForm.parentNode.replaceChild(newForm, replyForm);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('reply-message-id').value;
            const reply = document.getElementById('reply-content').value;
            const token = localStorage.getItem('authToken');

            console.log(`🚀 Sending reply for message: ${id}`);
            const btn = newForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/api/support/messages/${id}/reply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ reply })
                });

                if (res.ok) {
                    console.log("✅ Reply sent successfully!");
                    if (typeof showToast === 'function') showToast("Reply sent and ticket resolved!", "success");
                    else alert("Reply sent and ticket resolved!");
                    closeSupportReplyModal();
                    loadAdminSupport();
                } else {
                    const err = await res.json();
                    console.error("❌ Reply failed:", err);
                    alert(err.message || "Failed to send reply");
                }
            } catch (err) {
                console.error("❌ Connection error:", err);
                alert("Connection error: " + err.message);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    } else {
        console.warn("⚠️ Support Reply Form NOT found!");
    }
}

// Call initialization when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupportListeners);
} else {
    initializeSupportListeners();
}

window.updateSupportStatus = async function (id, newStatus) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/support/messages/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            if (typeof showToast === 'function') showToast("Status updated successfully", "success");
            window.loadAdminSupport();
        } else {
            alert("Failed to update status");
        }
    } catch (e) {
        console.error(e);
        alert("Server error");
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
        const partnersBtn = document.getElementById('sidebar-partners-btn');
        if (partnersBtn) partnersBtn.classList.remove('hidden');


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
        const res = await fetch(`${API_BASE}/api/users/profile`, {
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
    // Branch based on page context to avoid erroring on missing elements
    if (document.getElementById('admin-stat-total-orders')) {
        updateAdminStats(); // Use the existing admin stat puller
        // Add any other admin-specific init here if needed
        return;
    }

    const profile = window.currentUserProfile;
    if (!profile) return;

    // ... (rest of existing user dashboard logic) ...

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

function getStatusClass(status) {
    if (['Delivered', 'Completed', 'Processing'].includes(status)) return 'green-badge';
    if (['Shipped', 'Paid'].includes(status)) return 'gold-badge';
    if (['Cancelled', 'Failed', 'Payment Failed'].includes(status)) return 'red-badge';
    if (['Awaiting Payment'].includes(status)) return 'gold-badge';
    return '';
}

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

            renderLibraryTab(localLibrary);
            updateStats();
        }
    } catch (error) { console.error('Library sync error:', error); }
}


// --- TAB RENDERING: NOTIFICATIONS ---
function renderNotificationsTab() {
    const profile = window.currentUserProfile;
    const container = document.getElementById('notifications-list');
    const emptyState = document.getElementById('notifications-empty-state');
    const badge = document.getElementById('unread-notifications-count');

    if (!profile || !profile.notifications || profile.notifications.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        badge.classList.add('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    const unreadCount = profile.notifications.filter(n => !n.isRead).length;
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    container.innerHTML = profile.notifications.map(note => {
        const icon = getNotificationIcon(note.type);
        return `
            <div class="notification-item ${note.isRead ? '' : 'unread'}" onclick="markNotificationRead('${note._id}')">
                <div class="notification-icon ${note.type.toLowerCase()}">${icon}</div>
                <div class="notification-body">
                    <h5>${note.title}</h5>
                    <p>${note.message}</p>
                    <span class="notification-time">${new Date(note.createdAt).toLocaleString()}</span>
                </div>
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

    container.innerHTML = profile.savedAddresses.map(addr => `
        <div class="address-card glass-panel ${addr.isDefault ? 'default' : ''}">
            <h5 style="color:var(--gold-text); margin-bottom:10px;">${addr.label || 'Address'} ${addr.isDefault ? '<span class="default-badge">Default</span>' : ''}</h5>
            <p class="address-text">
                <strong>${addr.fullName}</strong><br>
                ${addr.fullAddress}<br>
                ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                Phone: ${addr.phone}
            </p>
            <div class="address-actions" style="margin-top:15px; display:flex; gap:10px;">
                <button class="btn btn-outline small" onclick="openAddressModal('${addr._id || addr.id}')">Edit</button>
                <button class="btn btn-danger small" style="background:rgba(255,0,0,0.1); border-color:rgba(255,0,0,0.2); color:#ff6b6b;" onclick="deleteAddress('${addr._id || addr.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
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
            const date = new Date(order.createdAt).toLocaleDateString();
            const itemsList = order.items.map(p => p.title || p.name).join(', ');
            const statusClass = `status-${order.status.toLowerCase()}`;

            return `
                <div class="glass-panel" style="padding: 25px; border-radius: 15px; margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div>
                            <span style="font-size: 0.8rem; opacity: 0.5;">Order ID</span>
                            <h3 style="margin: 0; font-family: 'Cinzel'; color: var(--gold-text);">#${order.orderId}</h3>
                            <p style="margin: 5px 0 0; font-size: 0.85rem; opacity: 0.6;">Placed on ${date}</p>
                        </div>
                        <div style="text-align: right;">
                            <span class="status-badge ${statusClass}">${order.status}</span>
                            <h3 style="margin: 10px 0 0; color: var(--gold-text);">₹${order.totalAmount}</h3>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 20px; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                        <div style="flex: 1;">
                            <p style="margin: 0; font-size: 0.9rem; font-weight: 600;">${itemsList}</p>
                            <p style="margin: 5px 0 0; font-size: 0.8rem; opacity: 0.6;">${order.items.length} Items</p>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-outline small" onclick="viewOrderDetail('${order._id}')">Details</button>
                            ${order.status === 'Delivered' ? `<button class="btn btn-gold small">Invoice</button>` : ''}
                        </div>
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
function renderLibraryTab(directData = null) {
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
                    <img src="${item.thumbnail}" alt="${item.name}" class="card-image">
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
    try {
        if (token) {
            const res = await fetch(`${API_BASE}/api/library/my-library/${prodId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                console.log('✅ Item permanently removed from library backend');
            } else {
                const errData = await res.json().catch(() => ({}));
                console.warn('Backend delete failed:', errData.message);
            }
        }
    } catch (e) {
        console.warn('Backend delete error:', e);
    }

    const libKey = getUserKey('efv_digital_library');
    let library = JSON.parse(localStorage.getItem(libKey)) || [];
    library = library.filter(item => {
        const id = (item.productId || item.id || item._id || '').toString();
        return id !== prodId.toString();
    });
    localStorage.setItem(libKey, JSON.stringify(library));
    renderLibraryTab();
    if (typeof updateStats === 'function') updateStats();
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

async function initiateDashboardCheckout(items, isSingleItemMode, cartIndexToRemove) {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    // Basic Razorpay options since we don't have the full backend integration setup in this file
    // Ideally we call the same backend endpoints

    try {
        // Create Order
        const rzpRes = await fetch(`${API_BASE}/api/orders/razorpay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: totalAmount })
        });
        const rzpOrderData = await rzpRes.json();

        if (!rzpRes.ok) throw new Error(rzpOrderData.message || 'Payment init failed');

        const options = {
            key: 'rzp_live_SBFlInxBiRfOGd',
            amount: rzpOrderData.amount,
            currency: rzpOrderData.currency,
            name: 'EFV Dashboard Checkout',
            description: 'Order from Dashboard',
            order_id: rzpOrderData.id,
            prefill: { name: user.name, email: user.email },
            theme: { color: '#FFD369' },
            handler: async function (response) {
                // Verification (Simulated for UI flow speed, or call backend)
                // Assuming success for UX demo flow

                // 1. Move to Orders
                const historyKey = getUserKey('efv_purchase_history');
                let history = JSON.parse(localStorage.getItem(historyKey)) || [];

                items.forEach(item => {
                    // Check if exists? Orders are usually unique transactions, but we stack qty
                    history.push({
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        date: new Date().toLocaleDateString()
                    });
                });
                localStorage.setItem(historyKey, JSON.stringify(history));

                // 2. Add to Library if Digital
                const libKey = getUserKey('efv_digital_library');
                let library = JSON.parse(localStorage.getItem(libKey)) || [];

                items.forEach(item => {
                    const isAudio = item.name.toLowerCase().includes('audiobook');
                    const isEbook = item.name.toLowerCase().includes('e-book') || item.name.toLowerCase().includes('ebook');

                    if (isAudio || isEbook) {
                        // Check duplicates
                        const key = `${item.name}_${item.language || ''}`.toLowerCase();
                        if (!library.some(l => `${l.name}_${l.language || ''}`.toLowerCase() === key)) {
                            library.push({
                                id: item.id || Date.now(), // Fallback ID
                                name: item.name,
                                language: item.language || '',
                                subtitle: item.subtitle || '',
                                type: isAudio ? 'Audiobook' : 'E-Book',
                                date: new Date().toLocaleDateString()
                            });
                        }
                    }
                });
                localStorage.setItem(libKey, JSON.stringify(library));

                // 3. Remove from Cart
                if (isSingleItemMode && cartIndexToRemove !== undefined) {
                    removeFromCart(cartIndexToRemove);
                }

                // 4. Update UI
                alert('Payment Successful! Item moved to Orders/Library.');
                renderCartTab();
                renderOrdersTab();
                renderLibraryTab();
                updateStats();

                // Switch to Orders Tab
                document.querySelector('.nav-item[data-tab="orders"]').click();
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (e) {
        alert('Payment Initialization Failed: ' + e.message);
    }
}

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
    if (window.efvSecurity) {
        window.efvSecurity.isTampered = false;
        window.efvSecurity.enable(); // Actively start protection
        window.efvSecurity.applyWatermark(document.getElementById(readerId));
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

// --- AUDIOBOOK PLAYER IMPLEMENTATION (Resume Support) ---
window.playAudiobook = async function (product) {
    const bookId = product._id || product.id;
    const playerModalId = 'audio-player-modal';
    const resumeModalId = 'audio-resume-modal';

    // Remove existing players
    if (document.getElementById(playerModalId)) document.getElementById(playerModalId).remove();

    const token = localStorage.getItem('authToken');

    // 1. Fetch saved progress (API or LocalStorage)
    let savedState = await fetchProgress(bookId);
    if (!savedState) {
        const local = localStorage.getItem(`audiobook_${bookId}_progress`);
        if (local) savedState = JSON.parse(local);
    }

    // 2. Main Player UI
    const audioHtml = `
        <div id="${playerModalId}" class="reader-overlay">
            <div class="reader-toolbar glass-panel">
                <div class="reader-title"><i class="fas fa-headphones"></i> ${product.name}</div>
                <button class="btn-icon" onclick="closeAudioPlayer()" title="Close"><i class="fas fa-times"></i></button>
            </div>
            
            <div class="reader-canvas-container" style="justify-content: center; align-items: center;">
                <div class="dashboard-card" style="max-width: 400px; padding: 40px; text-align: center; background: rgba(255,255,255,0.02);">
                    <img src="${getImageForProduct(product.name)}" style="width: 200px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 30px;">
                    <h2 style="color: var(--gold-text); margin-bottom: 20px;">${product.name}</h2>
                    
                    <div id="audio-progress-info" style="margin-bottom: 20px; font-size: 0.9rem; opacity: 0.8;">
                        <div class="reader-spinner" id="audio-loader" style="width: 30px; height: 30px;"></div>
                        <p id="audio-status-text">Synchronizing Stream...</p>
                    </div>

                    <audio id="efv-audio-player" 
                        src="${CONTENT_CONFIG.contentApi}/audio/${bookId}?token=${token || ''}&t=${Date.now()}"
                        style="width: 100%; filter: invert(1) hue-rotate(180deg);" 
                        controls controlsList="nodownload">
                    </audio>

                    <p style="margin-top: 30px; font-size: 0.8rem; opacity: 0.4;">
                        <i class="fas fa-lock"></i> Encrypted Content Stream
                    </p>
                </div>
            </div>

            <!-- Professional Resume Modal overlay -->
            <div id="${resumeModalId}" class="resume-modal-overlay">
                <div class="resume-modal">
                    <i class="fas fa-headphones"></i>
                    <h3>Continue Listening?</h3>
                    <p>You previously listened up to <span id="resume-time-display" style="color:white; font-weight:bold;">0:00</span>.<br>Continue from where you left off?</p>
                    <div class="resume-actions">
                        <button id="btn-audio-resume" class="btn-resume-primary">
                            <i class="fas fa-play"></i> Continue from <span id="resume-btn-time">0:00</span>
                        </button>
                        <button id="btn-audio-restart" class="btn-resume-secondary">
                            <i class="fas fa-redo"></i> Start from Beginning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', audioHtml);
    if (window.efvSecurity) {
        window.efvSecurity.isTampered = false;
        window.efvSecurity.enable(); // Actively start protection
        window.efvSecurity.applyWatermark(document.getElementById(playerModalId));
    }
    document.getElementById(playerModalId).classList.add('no-select');
    document.body.classList.add('modal-open');

    const audio = document.getElementById('efv-audio-player');
    const statusText = document.getElementById('audio-status-text');
    const loader = document.getElementById('audio-loader');
    const resumeOverlay = document.getElementById(resumeModalId);

    let saveInterval = null;

    // 3. Save Logic helper
    const saveProgress = () => {
        if (audio.currentTime < 1) return;

        const progressData = {
            currentTime: audio.currentTime,
            totalDuration: audio.duration || 0,
            progress: (audio.currentTime / (audio.duration || 1)) * 100
        };

        console.log(`💾 Progress Saving | ${formatTime(audio.currentTime)} | ${progressData.progress.toFixed(1)}%`);

        // Clear if finished (> 95%)
        if (progressData.progress > 95) {
            console.log("🏁 Audiobook finished, resetting progress.");
            if (token) syncProgress(bookId, 'AUDIOBOOK', { currentTime: 0, progress: 0 });
            localStorage.removeItem(`audiobook_${bookId}_progress`);
            return;
        }

        // Save to Local
        localStorage.setItem(`audiobook_${bookId}_progress`, JSON.stringify(progressData));

        // Save to Backend if logged in
        if (token) {
            syncProgress(bookId, 'AUDIOBOOK', progressData);
        }
    };

    // 4. Initialization & Meta
    audio.addEventListener('loadedmetadata', () => {
        loader.style.display = 'none';
        statusText.textContent = "Ready: " + formatTime(audio.duration);

        console.log("🔍 Syncing saved progress:", savedState);

        // Check if worth resuming (>1s and <95%)
        if (savedState && savedState.currentTime > 1) {
            const hasFinished = (savedState.currentTime / audio.duration) > 0.95;
            if (!hasFinished) {
                console.log(`🎯 Found resume point at ${formatTime(savedState.currentTime)}`);
                document.getElementById('resume-time-display').textContent = formatTime(savedState.currentTime);
                document.getElementById('resume-btn-time').textContent = formatTime(savedState.currentTime);
                resumeOverlay.classList.add('active');
            } else {
                audio.play().catch(() => { });
            }
        } else {
            audio.play().catch(() => { });
        }
    });

    // 5. Playback Listeners
    audio.addEventListener('play', () => {
        saveInterval = setInterval(saveProgress, 5000);
    });

    audio.addEventListener('pause', () => {
        if (saveInterval) clearInterval(saveInterval);
        saveProgress();
    });

    // 6. Resume Modal Actions
    document.getElementById('btn-audio-resume').addEventListener('click', () => {
        audio.currentTime = savedState.currentTime;
        resumeOverlay.classList.remove('active');
        audio.play();
    });

    document.getElementById('btn-audio-restart').addEventListener('click', () => {
        audio.currentTime = 0;
        resumeOverlay.classList.remove('active');
        localStorage.removeItem(`audiobook_${bookId}_progress`);
        audio.play();
    });

    window.closeAudioPlayer = function () {
        saveProgress();
        if (saveInterval) clearInterval(saveInterval);
        document.getElementById(playerModalId).remove();
        document.body.classList.remove('modal-open');
        if (window.efvSecurity) window.efvSecurity.disable(); // Stop protection when closing
        // Refresh library tab to show new progress
        renderLibraryTab();
    };

    // Global save on close
    window.addEventListener('beforeunload', saveProgress);
    window.addEventListener('pagehide', saveProgress);
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


let allAdminOrders = [];

window.loadAdminOrdersFull = async function () {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allAdminOrders = await res.json();
        window.filterAdminOrders(); // Initial render
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color:var(--error);">Failed to load orders.</td></tr>';
    }
};

window.filterAdminOrders = function () {
    const tbody = document.getElementById('admin-orders-table-body');
    const searchInput = document.getElementById('admin-order-search');
    const typeEl = document.getElementById('admin-order-filter-type');
    if (!tbody) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const typeFilter = typeEl ? typeEl.value : 'all';

    if (!Array.isArray(allAdminOrders)) {
        console.warn("allAdminOrders is not an array:", allAdminOrders);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px; opacity:0.5;">No orders data available.</td></tr>';
        return;
    }

    const filtered = allAdminOrders.filter(o => {
        if (!o) return false;
        const id = String(o.orderId || o._id || '').toLowerCase();
        const name = (o.customer && o.customer.name || '').toLowerCase();
        const phone = (o.customer && o.customer.phone || '').toLowerCase();

        const matchesSearch = id.includes(searchTerm) || name.includes(searchTerm) || phone.includes(searchTerm);

        let matchesType = true;
        if (typeFilter !== 'all' && o.items) {
            matchesType = o.items.some(item => {
                if (typeFilter === 'physical') {
                    return ['HARDCOVER', 'PAPERBACK'].includes(item.type);
                }
                return item.type === typeFilter;
            });
        }

        return matchesSearch && matchesType;
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px; opacity:0.5;">No orders found matching your search.</td></tr>';
        return;
    }

    filtered.forEach(o => {
        const date = new Date(o.createdAt).toLocaleDateString();
        const items = o.items.map(i => `${i.quantity}x ${i.title}`).join(', ');
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        tr.innerHTML = `
            <td style="padding: 12px; font-family: monospace;">#${(o.orderId || o._id.slice(-8))}</td>
            <td style="padding: 12px;">${date}</td>
            <td style="padding: 12px;">
                <div style="font-weight:600; color:var(--gold-text);">${o.customer.name || 'N/A'}</div>
                <div style="font-size:0.75rem; opacity:0.7;">${o.customer.email || 'N/A'}</div>
                <div style="font-size:0.7rem; opacity:0.5;">ID: ${o.userId || 'N/A'}</div>
            </td>
            <td style="padding: 12px;">
                <div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.85rem;" title="${items}">
                    ${items}
                </div>
            </td>
            <td style="padding: 12px; font-weight:bold;">₹${o.totalAmount}</td>
            <td style="padding: 12px;"><span class="badge ${o.paymentStatus === 'Paid' ? 'green' : 'gold'}">${o.paymentStatus}</span></td>
            <td style="padding: 12px;">
                <select onchange="updateOrderStatus('${o._id}', this.value)" style="background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,211,105,0.3); padding: 4px; border-radius: 4px; font-size: 0.8rem;">
                    ${['Pending', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Failed'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </td>
            <td style="padding: 12px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="btn btn-outline small" onclick="viewAdminOrderDetail('${o._id}')">View</button>
                    ${(!o.shipmentId && o.items.some(i => ['HARDCOVER', 'PAPERBACK'].includes(i.type))) ?
                `<button class="btn btn-gold tiny" onclick="window.createNimbusShipment('${o._id}')" id="ship-btn-${o._id}" style="font-size: 0.65rem; padding: 4px 8px;"><i class="fas fa-truck"></i> Ship</button>` :
                (o.shipmentId ? `<span style="color:#2ecc71; font-size:0.75rem;"><i class="fas fa-check"></i> Shipped</span>` : '')
            }
                    <button class="btn-icon" style="color: #ff4d4d;" onclick="window.deleteOrder('${o._id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.filterAdminProducts = function () {
    const searchEl = document.getElementById('admin-product-search');
    const typeEl = document.getElementById('admin-product-filter-type');
    const stockEl = document.getElementById('admin-product-filter-stock');

    if (!searchEl || !typeEl || !stockEl) return;

    const searchTerm = searchEl.value.toLowerCase();
    const typeFilter = typeEl.value;
    const stockFilter = stockEl.value;

    if (!Array.isArray(allAdminProducts)) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; opacity:0.5;">No products data available.</td></tr>';
        return;
    }

    let filtered = allAdminProducts.filter(p => {
        if (!p) return false;
        const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm) || (p.author && p.author.toLowerCase().includes(searchTerm));

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
        const [usersRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/api/orders`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const users = await usersRes.json();
        const orders = await ordersRes.json();

        tbody.innerHTML = '';
        if (!Array.isArray(users)) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; opacity:0.5;">No users found.</td></tr>';
            return;
        }

        users.forEach(u => {
            if (!u || !u.email) return;
            const userOrders = Array.isArray(orders) ? orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === u.email.toLowerCase()) : [];
            const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                <td style="padding: 12px;">${u.name}</td>
                <td style="padding: 12px;">${u.email}</td>
                <td style="padding: 12px;">${u.phone || 'N/A'}</td>
                <td style="padding: 12px; text-align:center;">${userOrders.length}</td>
                <td style="padding: 12px; font-weight:bold; color:var(--gold-text);">₹${totalSpent.toLocaleString()}</td>
                <td style="padding: 12px;"><button class="btn btn-outline small" onclick="alert('User profile details coming soon!')">View</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Load Customers Error:", e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color:#ff4d4d;">Failed to load customers.</td></tr>';
    }
};

window.loadAdminPayments = async function () {
    const tbody = document.getElementById('admin-payments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Loading payments...</td></tr>';
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/payments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const payments = await res.json();

        if (!Array.isArray(payments)) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No payment data available.</td></tr>';
            return;
        }

        tbody.innerHTML = payments.length ? '' : '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No payment records found.</td></tr>';
        payments.forEach(p => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                        <td style="padding: 12px; font-family: monospace; font-size: 0.8rem;">${p.paymentId || 'N/A'}</td>
                        <td style="padding: 12px; font-family: monospace;">#${p.orderId ? p.orderId.slice(-6) : 'N/A'}</td>
                        <td style="padding: 12px; font-weight: bold;">₹${p.amount}</td>
                        <td style="padding: 12px;">${p.method || 'Razorpay'}</td>
                        <td style="padding: 12px;"><span class="badge ${p.status === 'Paid' ? 'green' : 'gold'}">${p.status}</span></td>
                        <td style="padding: 12px;">${new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                    `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#ff6b6b;">Error loading payments.</td></tr>';
    }
};

window.loadAdminShipments = async function () {
    const tbody = document.getElementById('admin-shipments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading shipments...</td></tr>';
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const shipments = await res.json();

        if (!Array.isArray(shipments)) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No shipment data available.</td></tr>';
            return;
        }

        tbody.innerHTML = shipments.length ? '' : '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No active shipments.</td></tr>';
        shipments.forEach(s => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                        <td style="padding: 12px; font-family: monospace;">#${s.orderId ? s.orderId.slice(-6) : 'N/A'}</td>
                        <td style="padding: 12px;">${s.courierName || 'Pending'}</td>
                        <td style="padding: 12px;">
                            <div style="font-weight:600;">${s.awbNumber || 'Generating...'}</div>
                            ${s.awbNumber ? `<button onclick="window.trackNimbusShipment('${s.awbNumber}')" class="btn btn-outline tiny" style="margin-top:5px; font-size:0.65rem; padding:2px 8px;">LIVE TRK</button>` : ''}
                        </td>
                        <td style="padding: 12px;"><span class="badge ${s.shippingStatus === 'Delivered' ? 'green' : 'gold'}">${s.shippingStatus}</span></td>
                        <td style="padding: 12px;">${s.labelUrl ? `<a href="${s.labelUrl}" target="_blank" class="btn btn-outline small">View Label</a>` : '<span style="opacity:0.3;">N/A</span>'}</td>
                        <td style="padding: 12px;">${s.trackingLink ? `<a href="${s.trackingLink}" target="_blank" class="btn btn-outline small">Track Page</a>` : '<span style="opacity:0.3;">N/A</span>'}</td>
                    `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#ff6b6b;">Error loading shipments.</td></tr>';
    }
};

window.trackNimbusShipment = async function (awb) {
    if (!awb) return;
    showToast("Fetching live tracking...", "info");
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments/track/${awb}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.status && result.data) {
            const latest = result.data.history ? result.data.history[0] : null;
            const status = result.data.status_name || result.data.status || "Unknown";
            const location = result.data.location || "";
            alert(`Live Status: ${status}\nLocation: ${location}\nLast Updated: ${latest ? latest.event_time : 'N/A'}`);
        } else {
            alert(result.message || "Tracking info not available yet.");
        }
    } catch (e) {
        console.error(e);
        showToast("Tracking failed", "error");
    }
};

// function removed and merged below

window.loadAdminCoupons = async function () {
    const tbody = document.getElementById('admin-coupons-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Loading coupons...</td></tr>';
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/coupons`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coupons = await res.json();
        tbody.innerHTML = coupons.length ? '' : '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No coupons created yet.</td></tr>';
        coupons.forEach(c => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            const expiry = c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never';
            tr.innerHTML = `
                        <td style="padding: 12px; font-weight: bold; color: var(--gold-text);">${c.code}</td>
                        <td style="padding: 12px;">${c.type}</td>
                        <td style="padding: 12px;">${c.type === 'Percentage' ? c.value + '%' : '₹' + c.value}</td>
                        <td style="padding: 12px;">${c.usedCount} / ${c.usageLimit}</td>
                        <td style="padding: 12px;">${expiry}</td>
                        <td style="padding: 12px;"><span class="badge ${c.isActive ? 'green' : 'red'}">${c.isActive ? 'Active' : 'Disabled'}</span></td>
                        <td style="padding: 12px;">
                            <button class="btn-icon" style="color: #ff4d4d;" onclick="window.deleteCoupon('${c._id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#ff6b6b;">Error loading coupons.</td></tr>';
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


// --- MISSING DASHBOARD FUNCTIONS ---
// Handle Product Form Submission
const productForm = document.getElementById('admin-product-form');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
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
            const productType = document.getElementById('admin-prod-type').value;

            if (cover) formData.append('cover', cover);
            if (ebook) formData.append('ebook', ebook);

            // Handle Chapter Uploads
            if (productType === 'AUDIOBOOK') {
                const chapterCards = document.querySelectorAll('.chapter-card');
                chapterCards.forEach(card => {
                    const index = card.dataset.index;
                    const fileInput = document.getElementById(`chapter-audio-${index}`);
                    if (fileInput && fileInput.files[0]) {
                        formData.append(`chapter_${index}`, fileInput.files[0]);
                    }
                });
            } else {
                const audio = document.getElementById('admin-file-audio') ? document.getElementById('admin-file-audio').files[0] : null;
                if (audio) formData.append('audio', audio);
            }

            let uploadData = {};
            // Check if any files are selected (including chapters)
            let hasFiles = !!(cover || ebook);
            if (productType === 'AUDIOBOOK') {
                const chapterFiles = document.querySelectorAll('.chapter-card input[type="file"]');
                for (let input of chapterFiles) {
                    if (input.files.length > 0) {
                        hasFiles = true;
                        break;
                    }
                }
            } else {
                const audioInput = document.getElementById('admin-file-audio');
                if (audioInput && audioInput.files.length > 0) hasFiles = true;
            }

            if (hasFiles) {
                const uploadRes = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const version = uploadRes.headers.get('X-Upload-Version');
                console.log('📡 Server Upload Version:', version || 'OLD');

                const result = await uploadRes.json();
                if (!uploadRes.ok) {
                    if (version !== '2.1') {
                        throw new Error(`Outdated Server (Version: ${version || 'OLD'}). Please restart your backend terminal!`);
                    }
                    throw new Error(result.message || 'File upload failed');
                }
                if (result.paths) uploadData = result.paths;
            }

            const productId = document.getElementById('admin-prod-id').value;
            const isEdit = !!productId;

            const getVal = (id) => document.getElementById(id)?.value || '';
            const getNum = (id) => Number(document.getElementById(id)?.value) || 0;

            const productData = {
                title: getVal('admin-prod-title'),
                author: getVal('admin-prod-author'),
                type: getVal('admin-prod-type'),
                language: getVal('admin-prod-lang') || 'Hindi',
                volume: getVal('admin-prod-volume'),
                price: getNum('admin-prod-price'),
                discountPrice: getNum('admin-prod-discount-price') || null,
                stock: getNum('admin-prod-stock'),
                weight: getNum('admin-prod-weight'),
                length: getNum('admin-prod-length'),
                breadth: getNum('admin-prod-width'),
                height: getNum('admin-prod-height'),
                duration: getVal('admin-prod-duration'),
                description: getVal('admin-prod-desc'),
                category: 'Digital'
            };

            if (uploadData.coverPath) productData.thumbnail = uploadData.coverPath;

            if (productData.type === 'EBOOK' && uploadData.ebookPath) {
                productData.filePath = uploadData.ebookPath;
            } else if (productData.type === 'AUDIOBOOK') {
                productData.totalChapters = Number(document.getElementById('admin-prod-total-chapters').value) || 0;

                // Collect chapter metadata
                const chapterCards = document.querySelectorAll('.chapter-card');
                const chapters = [];
                chapterCards.forEach(card => {
                    const index = card.dataset.index;
                    const title = document.getElementById(`chapter-title-${index}`).value || `Chapter ${Number(index) + 1}`;

                    // If we have a new upload path from the server
                    let filePath = '';
                    if (uploadData.chapterPaths && uploadData.chapterPaths[index]) {
                        filePath = uploadData.chapterPaths[index];
                    } else if (window._currentEditingProduct && window._currentEditingProduct.chapters && window._currentEditingProduct.chapters[index]) {
                        // Persist old path if not replaced
                        filePath = window._currentEditingProduct.chapters[index].filePath;
                    }

                    chapters.push({
                        chapterNumber: Number(index) + 1,
                        title: title,
                        filePath: filePath
                    });
                });
                productData.chapters = chapters;

                // For backward compatibility or single file view if needed
                if (chapters.length > 0 && chapters[0].filePath) {
                    productData.filePath = chapters[0].filePath;
                }
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
                loadAdminProductsFull();
                updateAdminStats();
                showToast(isEdit ? 'Product updated' : 'Product added', 'success');
            } else {
                const err = await res.json();
                alert(err.message || 'Error saving product');
            }
        } catch (e) {
            console.error(e);
            alert('Error: ' + e.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

window.viewAdminOrderDetail = async function (id) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const order = await res.json();
        if (!res.ok) return alert("Order not found");

        // Use the existing order details modal structure if it exists
        const detailContent = `
                    <div style="padding: 20px;">
                        <h3 style="color:var(--gold-text); margin-bottom:15px;">Order #${order._id.slice(-6)}</h3>
                        <p><strong>Customer:</strong> ${order.customer.name}</p>
                        <p><strong>Email:</strong> ${order.customer.email}</p>
                        <p><strong>Phone:</strong> ${order.customer.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${order.customer.address}, ${order.customer.city} - ${order.customer.zip}</p>
                        <hr style="opacity:0.1; margin:15px 0;">
                        <h4 style="margin-bottom:10px;">Items</h4>
                        <div style="font-family:monospace; font-size:0.9rem;">
                            ${order.items.map(i => `<div>${i.quantity}x ${i.title} (₹${i.price})</div>`).join('')}
                        </div>
                        <hr style="opacity:0.1; margin:15px 0;">
                        <div style="display:flex; justify-content:space-between; font-weight:bold;">
                            <span>Total Amount:</span>
                            <span>₹${order.totalAmount}</span>
                        </div>
                    </div>
                `;

        // For now, we'll use a simple alert or a dedicated modal if available
        // Checking if 'order-detail-modal' exists
        const modal = document.getElementById('order-detail-modal');
        if (!modal) return;

        document.getElementById('modal-order-id').textContent = `#${order._id.slice(-6)}`;
        document.getElementById('modal-order-date').textContent = `Placed on: ${new Date(order.createdAt).toLocaleDateString()}`;
        document.getElementById('modal-subtotal').textContent = `₹${order.totalAmount}`;
        document.getElementById('modal-total').textContent = `₹${order.totalAmount}`;
        document.getElementById('modal-payment-method').textContent = order.paymentMethod || 'Razorpay';
        document.getElementById('modal-payment-status').textContent = order.paymentStatus;

        // Items
        const itemsContainer = document.getElementById('modal-order-items');
        if (itemsContainer) {
            itemsContainer.innerHTML = order.items.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
                    <div>
                        <h4 style="margin:0; font-size:0.95rem;">${item.title}</h4>
                        <p style="margin:0; font-size:0.8rem; opacity:0.6;">${item.type} (x${item.quantity})</p>
                    </div>
                    <span class="gold-text" style="font-weight:bold;">₹${item.price}</span>
                </div>
            `).join('');
        }

        // Address
        const addr = order.customer || {};
        const addrContainer = document.getElementById('modal-shipping-address');
        if (addrContainer) {
            let addressHtml = addr.name || 'Anonymous';

            if (typeof addr.address === 'object' && addr.address !== null) {
                const a = addr.address;
                addressHtml += `<br>${a.street || a.house || ''}<br>${a.city || ''} ${a.zip || a.pincode || ''}`;
            } else {
                addressHtml += `<br>${addr.address || 'N/A'}`;
            }

            addressHtml += `<br>Phone: ${addr.phone || order.phone || 'N/A'}`;
            addrContainer.innerHTML = addressHtml;
        }

        // Timeline
        const timeline = document.getElementById('modal-order-timeline');
        if (timeline) {
            const stepsList = ['Pending', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
            const currentIdx = stepsList.indexOf(order.status);
            timeline.innerHTML = stepsList.map((s, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                const hist = order.history ? order.history.find(t => t.status === s) : null;
                return `
                    <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                        <div class="step-dot"></div>
                        <h5>${s}</h5>
                        <p style="font-size:0.7rem; opacity:0.6;">${hist ? new Date(hist.timestamp).toLocaleString() : (isCompleted ? 'Completed' : 'Upcoming')}</p>
                    </div>
                `;
            }).join('');
        }

        modal.style.display = 'flex';
        modal.classList.add('active');

        // Add Create Shipment button if physical and not shipped
        const isPhysical = order.items.some(i => ['HARDCOVER', 'PAPERBACK'].includes(i.type));
        const canShip = isPhysical && !['Shipped', 'Delivered', 'Cancelled'].includes(order.status);

        const actionsContainer = document.querySelector('.detail-right');
        if (actionsContainer) {
            // Remove existing shipment btn if any
            const existingBtn = document.getElementById('btn-create-shipment');
            if (existingBtn) existingBtn.remove();

            if (canShip) {
                const shipBtn = document.createElement('button');
                shipBtn.id = 'btn-create-shipment';
                shipBtn.className = 'btn btn-gold full-width';
                shipBtn.style.marginTop = '15px';
                shipBtn.innerHTML = '<i class="fas fa-shipping-fast"></i> CREATE NIMBUS SHIPMENT';
                shipBtn.onclick = () => window.createNimbusShipment(order._id);
                actionsContainer.appendChild(shipBtn);
            }
        }

    } catch (e) {
        console.error("Error loading order:", e);
        showToast("Error loading order details", "error");
    }
};

window.createNimbusShipment = async function (orderId) {
    if (!confirm("Are you sure you want to create a NimbusPost shipment for this order?")) return;

    // Try to find the button - can be in the table or in the modal
    const btn = document.getElementById(`ship-btn-${orderId}`) || document.getElementById('btn-create-shipment');
    const originalText = btn ? btn.innerHTML : 'Ship';

    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        btn.disabled = true;
    }

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId })
        });

        const result = await res.json();
        if (res.ok) {
            showToast("✅ Shipment created successfully!", "success");
            // Refresh details if modal is open
            if (typeof window.viewAdminOrderDetail === 'function') window.viewAdminOrderDetail(orderId);
            // Refresh tables
            if (document.getElementById('admin-orders').classList.contains('active')) window.loadAdminOrdersFull();
            if (document.getElementById('admin-shipments').classList.contains('active')) window.loadAdminShipments();
        } else {
            alert(result.message || "Failed to create shipment");
        }
    } catch (e) {
        console.error(e);
        alert("Error creating shipment: " + e.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};

window.syncShipment = async function (id, btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
    btn.disabled = true;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments/sync/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (res.ok) {
            showToast('✅ Status Synced!', 'success');
            if (typeof window.loadAdminOrdersFull === 'function') window.loadAdminOrdersFull();
            if (typeof window.loadAdminShipments === 'function') window.loadAdminShipments();
        } else {
            showToast(result.message || 'Sync failed', 'error');
        }
    } catch (e) {
        console.error(e);
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.viewOrderDetail = window.viewAdminOrderDetail;

window.closeOrderDetailModal = () => {
    document.getElementById('order-detail-modal').style.display = 'none';
};

// Address Management
window.openAddressModal = function (id = null) {
    const modal = document.getElementById('address-modal');
    const form = document.getElementById('address-form');
    const title = document.getElementById('address-modal-title');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('address-id').value = id || '';

    if (id) {
        title.textContent = 'Edit Address';
        const addr = window.currentUserProfile.savedAddresses.find(a => a._id === id);
        if (addr) {
            document.getElementById('addr-name').value = addr.fullName || '';
            document.getElementById('addr-phone').value = addr.phone || '';
            document.getElementById('addr-pincode').value = addr.pincode || '';
            document.getElementById('addr-state').value = addr.state || '';
            document.getElementById('addr-city').value = addr.city || '';
            document.getElementById('addr-full').value = addr.fullAddress || '';
            document.getElementById('addr-landmark').value = addr.landmark || '';
            document.getElementById('addr-default').checked = !!addr.isDefault;
        }
    } else {
        title.textContent = 'Add New Address';
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
            fullAddress: document.getElementById('addr-full').value,
            landmark: document.getElementById('addr-landmark').value,
            isDefault: document.getElementById('addr-default').checked,
            label: 'Saved' // Or add another field
        };

        const url = id ? `${API_BASE}/api/users/address/${id}` : `${API_BASE}/api/users/address`;
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        closeAddressModal();
        fetchProfileData();
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
            <img src="${p.thumbnail}" alt="${p.title}">
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
            <div class="glass-panel" style="padding: 15px; display: flex; gap: 20px; align-items: center;">
                <img src="${item.thumbnail}" style="width: 70px; height: 100px; object-fit: cover; border-radius: 8px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0;">${item.name || item.title}</h4>
                    <p style="margin: 5px 0; opacity: 0.6; font-size: 0.85rem;">Format: ${item.type}</p>
                    <div style="display: flex; align-items: center; gap: 15px; margin-top: 10px;">
                        <div class="qty-selector">
                            <button onclick="updateCartQty('${item.id}', -1)">-</button>
                            <span>${qty}</span>
                            <button onclick="updateCartQty('${item.id}', 1)">+</button>
                        </div>
                        <h4 style="margin: 0; color: var(--gold-text);">₹${(price * qty).toFixed(2)}</h4>
                    </div>
                </div>
                <button class="btn-icon" style="color: #ff4d4d;" onclick="removeFromCart('${item.id}')">
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
    switch (status.toLowerCase()) {
        case 'delivered': return 'status-delivered';
        case 'shipped': return 'status-shipped';
        case 'processing': return 'status-processing';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
}

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

// --- COUPON MANAGEMENT ---
window.openCouponModal = function () {
    const modal = document.getElementById('admin-coupon-modal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        initModalParticles('coupon-particles-canvas', 'admin-coupon-modal');
    }
};

window.closeCouponModal = function () {
    const modal = document.getElementById('admin-coupon-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
};

window.deleteCoupon = async function (id) {
    if (!confirm('Permanently delete this coupon?')) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/coupons/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            showToast('Coupon deleted', 'info');
            if (typeof window.loadAdminCoupons === 'function') window.loadAdminCoupons();
        } else {
            const err = await res.json();
            alert('Failed to delete coupon: ' + (err.message || 'Unknown error'));
        }
    } catch (e) { console.error(e); }
};

const couponForm = document.getElementById('admin-coupon-form');
if (couponForm) {
    couponForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const data = {
            code: document.getElementById('coupon-code').value.toUpperCase(),
            type: document.getElementById('coupon-type').value,
            value: parseFloat(document.getElementById('coupon-value').value),
            minOrder: parseFloat(document.getElementById('coupon-min-order').value) || 0,
            usageLimit: parseInt(document.getElementById('coupon-limit').value) || 100,
            expiryDate: document.getElementById('coupon-expiry').value || null
        };

        try {
            const res = await fetch(`${API_BASE}/api/coupons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showToast('Coupon created!', 'success');
                closeCouponModal();
                loadAdminCoupons();
                couponForm.reset();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to create coupon');
            }
        } catch (e) { console.error(e); }
    });
}

// Particle Background Animation (Refactored to be generic)
window.initModalParticles = function (canvasId = 'modal-particles-canvas', modalId = 'admin-product-modal') {
    const canvas = document.getElementById(canvasId);
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
        const modal = document.getElementById(modalId);
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
// --- CORE UI HELPERS ---
