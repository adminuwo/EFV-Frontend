const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';

let appliedCoupon = null;
let checkoutSubtotal = 0;
let isDigitalOrder = false;
let selectedPaymentMode = 'Online'; // Global state

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Prefill user data if available
    document.getElementById('ship-email').value = user.email || '';
    document.getElementById('ship-name').value = user.name || '';

    // User-specific cart key (matches cart.js getUserKey logic)
    function getUserCartKey() {
        if (!user || !user.email) return 'efv_cart';
        const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `efv_cart_${cleanEmail}`;
    }

    let checkoutItems = [];
    const directCheckout = JSON.parse(localStorage.getItem('directCheckout'));
    // Read from user-specific cart key, fall back to generic cart
    const cart = JSON.parse(localStorage.getItem(getUserCartKey()))
        || JSON.parse(localStorage.getItem('efv_cart'))
        || [];

    if (directCheckout) {
        checkoutItems = Array.isArray(directCheckout) ? directCheckout : [directCheckout];
    } else {
        checkoutItems = cart;
    }

    // Detect Digital Order
    isDigitalOrder = checkoutItems.some(item => {
        const type = (item.type || '').toUpperCase();
        const id = (item.productId || item.id || '').toLowerCase();
        return type === 'EBOOK' || type === 'AUDIOBOOK' || type.includes('DIGITAL') || id.includes('ebook') || id.includes('audio');
    });

    if (checkoutItems.length === 0) {
        alert('No items to checkout.');
        window.location.href = 'marketplace.html';
        return;
    }

    // Calculate initial subtotal for coupon validation
    checkoutSubtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    renderSummary(checkoutItems);
    setupPlaceOrder(checkoutItems, user);
    setupPincodeCheck(checkoutItems);
    setupCouponHandlers();

    // AUTO-APPLY COUPON ONLY IF IN URL (Marketing Links)
    if (urlCoupon) {
        document.getElementById('coupon-input').value = urlCoupon;
        applyCoupon(urlCoupon, checkoutSubtotal);
    } else {
        // If not in URL, check if a coupon was ALREADY applied in this session
        const savedCoupon = localStorage.getItem('efv_applied_coupon');
        if (savedCoupon) {
            document.getElementById('coupon-input').value = savedCoupon;
            applyCoupon(savedCoupon, checkoutSubtotal);
        }
    }

    setupPaymentModeHandlers(checkoutItems);
    toggleAddressFields(checkoutItems);
});

function toggleAddressFields(items) {
    const hasPhysical = items.some(item => {
        const type = (item.type || '').toUpperCase();
        const cat = (item.category || '').toLowerCase();
        const id = (item.productId || item.id || '').toLowerCase();
        if (type === 'HARDCOVER' || type === 'PAPERBACK' || type === 'PHYSICAL' || cat === 'physical') return true;
        const digs = ['ebook', 'audio', 'digital'];
        if (!digs.some(d => id.includes(d)) && (id.includes('vol') || id.includes('book'))) return true;
        return false;
    });

    const isDigitalOnly = !hasPhysical;
    const addressFields = ['ship-address', 'ship-area', 'ship-city', 'ship-state', 'ship-pincode', 'ship-country'];

    addressFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const parent = el.closest('.form-group') || el.parentElement;
            if (parent) parent.style.display = isDigitalOnly ? 'none' : 'block';
            if (isDigitalOnly) el.removeAttribute('required');
            else el.setAttribute('required', '');
        }
    });

    const pinStatus = document.getElementById('serviceability-status');
    if (pinStatus) pinStatus.style.display = isDigitalOnly ? 'none' : 'block';

    // Header toggle
    const h3s = Array.from(document.querySelectorAll('h3, h2'));
    const addrHeader = h3s.find(h => h.textContent.includes("SHIPPING DETAILS") || h.textContent.includes("CUSTOMER DETAILS"));
    if (addrHeader) addrHeader.textContent = isDigitalOnly ? "CUSTOMER DETAILS" : "SHIPPING DETAILS";
}

// --- NEW SHIPPING & COD LOGIC ---
const EKART_RATES = {
    'A': 34.22,
    'B': 42.48, // Within State (Madhya Pradesh)
    'C': 49.56, // Metro
    'D': 59.00, // Rest of India (Default)
    'E': 67.26  // NE & J&K
};

const COD_CHARGES = {
    BASE: 36.58,
    PERCENTAGE: 0.0224 // 2.24%
};

function getZoneFromPincode(pincode) {
    if (!pincode || pincode.length !== 6) return null;

    const prefix3 = pincode.substring(0, 3);
    const prefix2 = pincode.substring(0, 2);

    // 1. Same City Check (Jabalpur - Origin)
    if (prefix3 === '482') return 'A';

    // 2. Metro check (Mumbai, Delhi, Chennai, Kolkata, Bangalore, Hyderabad)
    const metros = ['11', '40', '60', '70', '56', '50'];
    if (metros.includes(prefix2)) return 'C';

    // 3. Local state check (Madhya Pradesh prefixes: 45-48)
    const localPrefixes = ['45', '46', '47', '48'];
    if (localPrefixes.includes(prefix2)) return 'B';

    // 4. NE & J&K check
    const remotePrefixes = ['79', '18', '19'];
    if (remotePrefixes.includes(prefix2)) return 'E';

    // 5. Rest of India
    return 'D';
}

function calculateShipping(items = []) {
    // Only charge shipping if there's at least one physical item
    const hasPhysical = items.some(item => {
        const type = (item.type || '').toUpperCase();
        const category = (item.category || '').toLowerCase();
        const id = (item.id || '').toLowerCase();

        // Check 1: Explicit Type/Category
        if (type === 'HARDCOVER' || type === 'PAPERBACK' || type === 'PHYSICAL' || category === 'physical') return true;

        // Check 2: Fallback for older cart items via ID (if it doesn't contain digital indicators)
        const isDigitalId = id.includes('audio') || id.includes('ebook') || id.includes('digital');
        if (!isDigitalId && (id.includes('hard') || id.includes('paper') || id.includes('vol'))) return true;

        return false;
    });

    if (!hasPhysical) return 0;

    const pin = document.getElementById('ship-pincode').value;
    const zone = getZoneFromPincode(pin);
    if (!zone) return 0;

    const rate = EKART_RATES[zone] || EKART_RATES['D']; // Default to 'D' if zone logic fails
    return rate;
}

function calculateCOD(subtotal, mode) {
    const activeMode = mode || selectedPaymentMode;
    if (activeMode !== 'COD') return 0;
    
    const charge = COD_CHARGES.BASE + (subtotal * COD_CHARGES.PERCENTAGE);
    return Math.round(charge * 100) / 100;
}

function setupPaymentModeHandlers(items = []) {
    const optionCod = document.getElementById('option-cod');

    const hasDigital = isDigitalOrder || items.some(item => {
        const type = (item.type || '').toUpperCase();
        return type === 'EBOOK' || type === 'AUDIOBOOK';
    });

    if (hasDigital) {
        if (optionCod) optionCod.style.display = 'none';
        selectedPaymentMode = 'Online';
        const onlineRadio = document.getElementById('radio-online');
        if (onlineRadio) onlineRadio.checked = true;
    } else {
        if (optionCod) optionCod.style.display = 'flex';
    }

    const updateUIState = (mode) => {
        selectedPaymentMode = mode;
        document.querySelectorAll('.payment-option').forEach(opt => {
            const radio = opt.querySelector('input');
            if (radio) {
                if (radio.value === mode) {
                    opt.classList.add('active');
                    radio.checked = true;
                } else {
                    opt.classList.remove('active');
                }
            }
        });
        renderSummary(null, true);
    };

    // Attach click to parent cards
    document.querySelectorAll('.payment-option').forEach(card => {
        card.addEventListener('click', function(e) {
            const radio = this.querySelector('input');
            if (radio) {
                updateUIState(radio.value);
            }
        });
    });

    // Handle direct radio changes
    document.querySelectorAll('input[name="payment-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) updateUIState(e.target.value);
        });
    });

    // Initialize
    const checked = document.querySelector('input[name="payment-mode"]:checked');
    if (checked) updateUIState(checked.value);
}

function setupCouponHandlers() {
    const applyBtn = document.getElementById('apply-coupon-btn');
    const input = document.getElementById('coupon-input');

    applyBtn.addEventListener('click', () => {
        const code = input.value.trim();
        if (!code) return;
        applyCoupon(code, checkoutSubtotal);
    });
}

async function applyCoupon(code, amount) {
    const status = document.getElementById('coupon-status');
    const applyBtn = document.getElementById('apply-coupon-btn');

    status.style.display = 'block';
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    status.style.color = 'white';
    applyBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/coupons/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, amount })
        });

        const data = await res.json();

        if (res.ok) {
            appliedCoupon = data;
            localStorage.setItem('efv_applied_coupon', data.code);
            status.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fas fa-check-circle"></i> Coupon <strong>${data.code}</strong> applied!</span>
                    <button onclick="removeCoupon()" style="background: transparent; border: none; color: #ff4757; cursor: pointer; font-size: 0.75rem; text-decoration: underline; font-weight: 700;">REMOVE</button>
                </div>
            `;
            status.style.color = '#2ed573';
            renderSummary(null, true);
        } else {
            appliedCoupon = null;
            localStorage.removeItem('efv_applied_coupon');
            status.innerHTML = `<i class="fas fa-times-circle"></i> ${data.message || 'Invalid coupon'}`;
            status.style.color = '#ff4757';
            renderSummary(null, true);
        }
    } catch (error) {
        status.innerHTML = 'Verification failed. Try again.';
        status.style.color = '#ff4757';
    } finally {
        applyBtn.disabled = false;
    }
}

window.removeCoupon = function() {
    appliedCoupon = null;
    localStorage.removeItem('efv_applied_coupon');
    const input = document.getElementById('coupon-input');
    const status = document.getElementById('coupon-status');
    if (input) input.value = '';
    if (status) {
        status.innerHTML = 'Coupon removed';
        status.style.color = 'rgba(255,255,255,0.5)';
        setTimeout(() => { if (!appliedCoupon) status.style.display = 'none'; }, 2000);
    }
    renderSummary(null, true);
};

let isServiceable = true; // Default to true for now, will be updated by check

function setupPincodeCheck(items) {
    const pinInput = document.getElementById('ship-pincode');
    const statusDiv = document.getElementById('serviceability-status');
    const statusText = statusDiv.querySelector('.status-text');
    const placeOrderBtn = document.getElementById('place-order-btn');

    pinInput.addEventListener('input', async (e) => {
        const pincode = e.target.value.trim();

        // 🟢 DIGTAL SKIPPING:
        const hasPhysical = items.some(item => {
            const type = (item.type || '').toUpperCase();
            const id = (item.productId || item.id || '').toLowerCase();
            return ['HARDCOVER', 'PAPERBACK', 'PHYSICAL'].includes(type) || (!['ebook', 'audio', 'digital'].some(d => id.includes(d)) && (id.includes('vol') || id.includes('book')));
        });

        if (!hasPhysical) {
            isServiceable = true;
            return;
        }

        // Only trigger check if pincode is 6 digits
        if (pincode.length === 6 && /^\d+$/.test(pincode)) {
            // Calculate total weight (default 0.5kg/500g if missing)
            const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0.5) * item.quantity, 0);
            const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            statusDiv.className = 'serviceability-info checking';
            statusText.textContent = 'Checking delivery with Nimbus...';
            isServiceable = false;

            try {
                const response = await fetch(`${API_BASE}/api/nimbus/check-delivery`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pickup_pincode: "482001", // Or your warehouse pincode
                        delivery_pincode: pincode,
                        weight: totalWeight,
                        order_amount: totalAmount
                    })
                });

                const result = await response.json();

                if (result.status === true) {
                    statusDiv.className = 'serviceability-info success';
                    statusText.textContent = 'Great! Delivery available for your area.';
                    isServiceable = true;
                    placeOrderBtn.disabled = false;
                } else {
                    statusDiv.className = 'serviceability-info error';
                    statusText.textContent = result.message || 'Sorry, shipping not available for this pincode.';
                    isServiceable = false;
                    placeOrderBtn.disabled = true;
                }
            } catch (error) {
                console.error('Serviceability check failed:', error);
                statusDiv.className = 'serviceability-info success'; // Fallback to allow order if API fails
                statusText.textContent = 'Network error. We will verify delivery manually.';
                isServiceable = true;
                placeOrderBtn.disabled = false;
            }

            // RE-CALCULATE SHIPPING WHEN PINCODE IS VALIDATED
            renderSummary(null, true);
        } else {
            statusDiv.className = 'serviceability-info'; // Reverts to display:none via CSS
        }
    });

    // Also check if pre-filled pincode (e.g. from saved address) exists
    if (pinInput.value.length === 6) {
        pinInput.dispatchEvent(new Event('input'));
    }
}

let currentCheckoutItems = [];

function renderSummary(items, isRefresh = false) {
    if (items) currentCheckoutItems = items;
    const list = document.getElementById('checkout-items-list');
    let subtotal = 0;

    list.innerHTML = currentCheckoutItems.map(item => {
        subtotal += item.price * item.quantity;
        const imgPath = item.thumbnail || (CONFIG.BASE_PATH + 'assets/images/vol1-cover.png');
        return `
            <div class="checkout-item">
                <img src="${imgPath}" alt="${item.name}" class="checkout-item-img" onerror="this.src='${CONFIG.BASE_PATH}assets/images/vol1-cover.png'">
                <div class="checkout-item-info">
                    <div class="checkout-item-title">${item.name}</div>
                    <div class="checkout-item-meta">${item.subtitle || ''} | Qty: ${item.quantity}</div>
                    <div class="checkout-item-price">₹${item.price}</div>
                </div>
                <div style="font-weight: 700; align-self: center;">₹${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    }).join('');

    const checkedRadio = document.querySelector('input[name="payment-mode"]:checked');
    const currentMode = checkedRadio ? checkedRadio.value : selectedPaymentMode;

    const shippingCharge = calculateShipping(currentCheckoutItems);
    const codCharge = calculateCOD(subtotal, currentMode);

    // UI elements
    const codRow = document.getElementById('cod-charge-row');
    const codDisplay = document.getElementById('summary-cod');
    const placeBtn = document.getElementById('place-order-btn');

    // Update displays
    document.getElementById('summary-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = `₹${shippingCharge.toFixed(2)}`;
    
    if (codRow) {
        codRow.style.display = 'flex'; 
        if (codDisplay) {
            codDisplay.textContent = `₹${codCharge.toFixed(2)}`;
            codDisplay.style.color = (currentMode === 'COD') ? '#FFD369' : 'rgba(255,255,255,0.3)';
            codDisplay.style.opacity = (currentMode === 'COD') ? '1' : '0.5';
        }
        
        if (currentMode === 'COD') {
            if (placeBtn) placeBtn.innerHTML = 'PLACE ORDER <i class="fas fa-arrow-right"></i>';
        } else {
            if (placeBtn) placeBtn.innerHTML = 'PAY NOW <i class="fas fa-arrow-right"></i>';
        }
    }

    // Handle Discount
    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'Percentage') {
            discount = (subtotal * appliedCoupon.value) / 100;
        } else {
            discount = appliedCoupon.value;
        }
    }

    const total = Math.max(0, subtotal - discount + shippingCharge + codCharge);

    // Add/Update discount row if applicable
    let summaryBox = document.querySelector('.checkout-summary');
    let existingDiscountRow = document.getElementById('summary-discount-row');

    if (discount > 0) {
        if (!existingDiscountRow) {
            const row = document.createElement('div');
            row.className = 'checkout-total-row';
            row.id = 'summary-discount-row';
            row.style.color = '#2ed573';
            row.innerHTML = `<span>Discount (${appliedCoupon.code})</span> <span id="summary-discount">-₹${discount.toFixed(2)}</span>`;
            summaryBox.insertBefore(row, document.querySelector('.grand-total'));
        } else {
            existingDiscountRow.innerHTML = `<span>Discount (${appliedCoupon.code})</span> <span id="summary-discount">-₹${discount.toFixed(2)}</span>`;
        }
    } else if (existingDiscountRow) {
        existingDiscountRow.remove();
    }

    document.getElementById('summary-total').textContent = `₹${total.toFixed(2)}`;
}

function showToast(msg) {
    const toast = document.getElementById('checkout-toast');
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
}

function setupPlaceOrder(items, user) {
    const btn = document.getElementById('place-order-btn');
    const form = document.getElementById('shipping-form');

    btn.addEventListener('click', async () => {
        // 1. Validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const phone = document.getElementById('ship-phone').value;
        const pincode = document.getElementById('ship-pincode').value;

        if (phone.length !== 10 || !/^\d+$/.test(phone)) {
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }

        // Check if shipping is needed
        const hasPhysical = items.some(item => {
            const type = (item.type || '').toUpperCase();
            const id = (item.productId || item.id || '').toLowerCase();
            return ['HARDCOVER', 'PAPERBACK', 'PHYSICAL'].includes(type) || (!['ebook', 'audio', 'digital'].some(d => id.includes(d)) && (id.includes('vol') || id.includes('book')));
        });

        if (hasPhysical) {
            if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
                alert('Please enter a valid 6-digit pincode.');
                return;
            }

            if (!isServiceable) {
                alert('Your location is currently not serviceable. Please choose another address.');
                return;
            }
        }

        const address = {
            name: document.getElementById('ship-name').value,
            phone: phone,
            email: document.getElementById('ship-email').value,
            street: hasPhysical ? document.getElementById('ship-address').value : 'Digital Delivery',
            area: hasPhysical ? document.getElementById('ship-area').value : 'N/A',
            city: hasPhysical ? document.getElementById('ship-city').value : 'Digital',
            state: hasPhysical ? document.getElementById('ship-state').value : 'Digital',
            pincode: hasPhysical ? pincode : '000000',
            country: hasPhysical ? document.getElementById('ship-country').value : 'India'
        };

        localStorage.setItem('shippingAddress', JSON.stringify(address));

        // Calculate Totals using dynamic logic
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = calculateShipping(items);
        const checkedRadio = document.querySelector('input[name="payment-mode"]:checked');
        const mode = checkedRadio ? checkedRadio.value : 'Online';
        const cod = calculateCOD(subtotal, mode);
        let discount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.type === 'Percentage') {
                discount = (subtotal * appliedCoupon.value) / 100;
            } else {
                discount = appliedCoupon.value;
            }
        }

        const isCOD = mode === 'COD';

        if (isCOD && isDigitalOrder) {
            alert('Digital items (E-book/Audiobook) cannot be purchased via COD. Please select Online Payment.');
            // Force reset UI
            const optionCod = document.getElementById('option-cod');
            if (optionCod) optionCod.style.display = 'none';
            document.querySelector('input[name="payment-mode"][value="Online"]').checked = true;
            return;
        }

        const finalAmount = Math.max(0, subtotal - discount + shipping + cod);
        const orderId = 'EFV-' + Date.now() + Math.floor(Math.random() * 1000);

        const orderData = {
            orderId: orderId,
            userEmail: user.email,
            products: items,
            totalAmount: Math.round(finalAmount),
            discountAmount: Math.round(discount),
            shippingCharge: shipping,
            codCharge: cod,
            paymentMethod: isCOD ? 'COD' : 'Online',
            shippingAddress: address,
            paymentStatus: isCOD ? 'Pending' : 'Pending',
            orderStatus: isCOD ? 'Processing' : 'Awaiting Payment',
            orderDate: new Date().toISOString()
        };

        // Save to localStorage "orders"
        let allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        allOrders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(allOrders));

        if (isCOD) {
            showToast('COD Order Received! Redirecting...');
            // CALL DIRECT COD ORDER API
            await placeCODOrder(orderData, appliedCoupon ? appliedCoupon.code : null);
        } else {
            showToast('Initializing Payment...');
            await initRazorpay(orderData, appliedCoupon ? appliedCoupon.code : null);
        }
    });
}



async function placeCODOrder(orderData, couponCode) {
    const btn = document.getElementById('place-order-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PLACING COD ORDER...';

    try {
        const response = await fetch(`${API_BASE}/api/orders/cod`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                orderId: orderData.orderId,
                customer: orderData.shippingAddress,
                items: orderData.products.map(i => ({ productId: i.id || i.productId, quantity: i.quantity })),
                totalAmount: orderData.totalAmount,
                shippingCharge: orderData.shippingCharge,
                codCharge: orderData.codCharge,
                couponCode: couponCode
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'COD Placement Failed');

        if (!localStorage.getItem('directCheckout')) {
            localStorage.removeItem('efv_cart');
        }
        localStorage.removeItem('directCheckout');

        showToast('✅ Order Placed Successfully!');
        setTimeout(() => {
                        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html?tab=orders';
        }, 1500);

    } catch (e) {
        alert('COD Order Error: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function initRazorpay(order, couponCode = null) {
    const btn = document.getElementById('place-order-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> INITIALIZING RAZORPAY...';

    try {
        // 1. Fetch Razorpay Key ID from backend config
        const configRes = await fetch(`${API_BASE}/api/orders/config`);
        const config    = await configRes.json();
        const keyId     = config.razorpayKeyId;
        if (!keyId) throw new Error('Razorpay key not found in server config.');

        // 2. Create Razorpay Order on backend
        const response = await fetch(`${API_BASE}/api/orders/razorpay`, {
            method : 'POST',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                amount       : order.totalAmount,
                customerName : order.shippingAddress.name,
                customerEmail: order.shippingAddress.email,
                customerPhone: order.shippingAddress.phone
            })
        });

        const rzpData = await response.json();
        if (!response.ok) throw new Error(rzpData.message || 'Razorpay order creation failed');

        // 3. Dynamically load Razorpay SDK (if not already loaded)
        await loadRazorpayScript();

        // 4. Open Razorpay Checkout Modal
        const options = {
            key         : keyId,
            amount      : rzpData.amount,        // paise from backend
            currency    : rzpData.currency || 'INR',
            name        : 'Extraordinary Founder Vault',
            description : 'Order Payment',
            image       : CONFIG.BASE_PATH + 'assets/images/logo.png',
            order_id    : rzpData.rzpOrderId,
            prefill     : {
                name   : order.shippingAddress.name,
                email  : order.shippingAddress.email,
                contact: order.shippingAddress.phone
            },
            notes       : {
                couponCode: couponCode || ''
            },
            theme       : { color: '#c9a84c' },

            handler: async function(rzpResponse) {
                // 5. Verify on backend & fulfill order
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFYING PAYMENT...';

                try {
                    const verifyRes = await fetch(`${API_BASE}/api/orders/verify-razorpay`, {
                        method : 'POST',
                        headers: {
                            'Content-Type' : 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id  : rzpResponse.razorpay_order_id,
                            razorpay_payment_id: rzpResponse.razorpay_payment_id,
                            razorpay_signature : rzpResponse.razorpay_signature,
                            customer           : order.shippingAddress,
                            items              : order.products,
                            couponCode         : couponCode
                        })
                    });

                    const result = await verifyRes.json();
                    if (!verifyRes.ok) throw new Error(result.message || 'Verification failed');

                    // Clear cart
                    if (!localStorage.getItem('directCheckout')) {
                        const user = JSON.parse(localStorage.getItem('efv_user'));
                        if (user && user.email) {
                            const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
                            localStorage.removeItem(`efv_cart_${cleanEmail}`);
                        }
                        localStorage.removeItem('efv_cart');
                    }
                    localStorage.removeItem('directCheckout');
                    localStorage.removeItem('efv_applied_coupon');

                    showToast('✅ Payment Successful! Redirecting...');
                    setTimeout(() => {
                                    window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html?tab=orders';
                    }, 1500);

                } catch (verifyErr) {
                    alert('Payment was deducted but verification failed: ' + verifyErr.message +
                          '\nPlease contact support with Payment ID: ' + rzpResponse.razorpay_payment_id);
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            },

            modal: {
                ondismiss: function() {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function(response) {
            alert('Payment failed: ' + (response.error.description || 'Unknown error') +
                  '\nReason: ' + (response.error.reason || ''));
            btn.disabled = false;
            btn.innerHTML = originalText;
        });
        rzp.open();

    } catch (e) {
        alert('Payment Error: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Dynamically load Razorpay checkout JS
function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) { resolve(); return; }
        const script  = document.createElement('script');
        script.src    = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.head.appendChild(script);
    });
}

async function verifyCashfreePayment(cfOrderId, localOrder) {
    try {
        const res = await fetch(`${API_BASE}/api/orders/verify-cashfree`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                order_id: cfOrderId,
                customer: {
                    name: localOrder.shippingAddress.name,
                    email: localOrder.shippingAddress.email,
                    phone: localOrder.shippingAddress.phone,
                    address: localOrder.shippingAddress.street + ', ' + localOrder.shippingAddress.area,
                    city: localOrder.shippingAddress.city,
                    state: localOrder.shippingAddress.state,
                    pincode: localOrder.shippingAddress.pincode,
                    country: localOrder.shippingAddress.country
                },
                items: localOrder.products.map(i => ({
                    productId: i.id || i.productId,
                    quantity: i.quantity
                }))
            })
        });

        const verification = await res.json();

        if (res.ok) {
            updateLocalOrderStatus(localOrder.orderId, 'Paid', 'Processing');
            if (!localStorage.getItem('directCheckout')) {
                localStorage.removeItem('efv_cart');
            }
            localStorage.removeItem('directCheckout');
            alert('✅ Payment Successful! Your order is being processed.');
            window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html?tab=orders';
        } else {
            throw new Error(verification.message || 'Verification Failed');
        }
    } catch (e) {
        alert('Verification Error: ' + e.message);
        location.reload();
    }
}

function updateLocalOrderStatus(orderId, paymentStatus, orderStatus) {
    let allOrders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = allOrders.findIndex(o => o.orderId === orderId);
    if (idx !== -1) {
        allOrders[idx].paymentStatus = paymentStatus;
        allOrders[idx].orderStatus = orderStatus;
        localStorage.setItem('orders', JSON.stringify(allOrders));
    }
}
