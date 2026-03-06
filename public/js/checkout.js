const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';

let appliedCoupon = null;
let checkoutSubtotal = 0;
let isDigitalOrder = false;

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

    // AUTO-APPLY COUPON FROM URL OR LOCALSTORAGE
    const urlParams = new URLSearchParams(window.location.search);
    const urlCoupon = urlParams.get('coupon');
    const savedCoupon = localStorage.getItem('efv_applied_coupon');
    const finalCoupon = urlCoupon || savedCoupon;

    if (finalCoupon) {
        document.getElementById('coupon-input').value = finalCoupon;
        applyCoupon(finalCoupon, checkoutSubtotal);
        if (!urlCoupon) localStorage.removeItem('efv_applied_coupon');
    }

    setupPaymentModeHandlers(checkoutItems);
});

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

function calculateCOD(subtotal) {
    const isCOD = document.querySelector('input[name="payment-mode"]:checked').value === 'COD';
    if (!isCOD) return 0;
    return COD_CHARGES.BASE + (subtotal * COD_CHARGES.PERCENTAGE);
}

function setupPaymentModeHandlers(items = []) {
    const radios = document.querySelectorAll('input[name="payment-mode"]');
    const placeBtn = document.getElementById('place-order-btn');
    const optionCod = document.getElementById('option-cod');
    const onlineOpt = document.getElementById('option-online');

    // 1. Check for Digital Products (EBOOK / AUDIOBOOK)
    const hasDigital = isDigitalOrder || items.some(item => {
        const type = (item.type || '').toUpperCase();
        const id = (item.productId || item.id || '').toLowerCase();
        return type === 'EBOOK' || type === 'AUDIOBOOK' || type.includes('DIGITAL') || id.includes('ebook') || id.includes('audio');
    });

    if (hasDigital) {
        if (optionCod) {
            // HIDE COD OPTION as requested
            optionCod.style.display = 'none';

            // Ensure Online is selected
            const onlineRadio = document.querySelector('input[name="payment-mode"][value="Online"]');
            if (onlineRadio) {
                onlineRadio.checked = true;
                if (onlineOpt) onlineOpt.classList.add('active');
            }
        }
    } else {
        // Show COD if no digital product
        if (optionCod) {
            optionCod.style.display = 'flex';
            const codRadio = optionCod.querySelector('input');
            if (codRadio) codRadio.disabled = false;
        }
    }

    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Update UI classes for styles
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
            radio.closest('.payment-option').classList.add('active');

            // Toggle COD row visibility
            const codRow = document.getElementById('cod-charge-row');
            if (radio.value === 'COD') {
                if (codRow) codRow.style.display = 'flex';
                placeBtn.innerHTML = 'PLACE ORDER <i class="fas fa-arrow-right"></i>';
            } else {
                if (codRow) codRow.style.display = 'none';
                placeBtn.innerHTML = 'PAY NOW <i class="fas fa-arrow-right"></i>';
            }

            renderSummary(null, true);
        });
    });
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
            // Save coupon code so payment-status.html can pass it to backend after Cashfree redirect
            localStorage.setItem('efv_applied_coupon', data.code);
            status.innerHTML = `<i class="fas fa-check-circle"></i> Coupon <strong>${data.code}</strong> applied!`;
            status.style.color = '#2ed573';
            renderSummary(null, true); // Refresh summary with discount
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

let isServiceable = true; // Default to true for now, will be updated by check

function setupPincodeCheck(items) {
    const pinInput = document.getElementById('ship-pincode');
    const statusDiv = document.getElementById('serviceability-status');
    const statusText = statusDiv.querySelector('.status-text');
    const placeOrderBtn = document.getElementById('place-order-btn');

    pinInput.addEventListener('input', async (e) => {
        const pincode = e.target.value.trim();

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
        const imgPath = item.thumbnail || 'img/vol1-cover.png';

        return `
            <div class="checkout-item">
                <img src="${imgPath}" alt="${item.name}" class="checkout-item-img" onerror="this.src='img/vol1-cover.png'">
                <div class="checkout-item-info">
                    <div class="checkout-item-title">${item.name}</div>
                    <div class="checkout-item-meta">${item.subtitle || ''} | Qty: ${item.quantity}</div>
                    <div class="checkout-item-price">₹${item.price}</div>
                </div>
                <div style="font-weight: 700; align-self: center;">₹${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    }).join('');

    const shippingCharge = calculateShipping(currentCheckoutItems);
    const codCharge = calculateCOD(subtotal);

    document.getElementById('summary-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = `₹${shippingCharge.toFixed(2)}`;
    document.getElementById('summary-cod').textContent = `₹${codCharge.toFixed(2)}`;

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
            summaryBox.insertBefore(row, document.getElementById('cod-charge-row'));
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

        if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
            alert('Please enter a valid 6-digit pincode.');
            return;
        }

        if (!isServiceable) {
            alert('Your location is currently not serviceable. Please choose another address.');
            return;
        }

        const address = {
            name: document.getElementById('ship-name').value,
            phone: phone,
            email: document.getElementById('ship-email').value,
            street: document.getElementById('ship-address').value,
            area: document.getElementById('ship-area').value,
            city: document.getElementById('ship-city').value,
            state: document.getElementById('ship-state').value,
            pincode: pincode,
            country: document.getElementById('ship-country').value
        };

        localStorage.setItem('shippingAddress', JSON.stringify(address));

        // Calculate Totals using dynamic logic
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = calculateShipping(items);
        const cod = calculateCOD(subtotal);
        let discount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.type === 'Percentage') {
                discount = (subtotal * appliedCoupon.value) / 100;
            } else {
                discount = appliedCoupon.value;
            }
        }

        const isCOD = document.querySelector('input[name="payment-mode"]:checked').value === 'COD';

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
            showToast('Initializing Online Payment...');
            await initCashfree(orderData, appliedCoupon ? appliedCoupon.code : null);
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
            window.location.href = 'profile.html?tab=orders';
        }, 1500);

    } catch (e) {
        alert('COD Order Error: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function initCashfree(order, couponCode = null) {
    const btn = document.getElementById('place-order-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> INITIALIZING CASHFREE...';

    try {
        // Fetch config to get mode
        const configRes = await fetch(`${API_BASE}/api/orders/config`);
        const { cashfreeMode } = await configRes.json();

        const response = await fetch(`${API_BASE}/api/orders/cashfree`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                amount: order.totalAmount,
                customerName: order.shippingAddress.name,
                customerEmail: order.shippingAddress.email,
                customerPhone: order.shippingAddress.phone,
                couponCode: couponCode // Pass coupon to backend
            })
        });

        const text = await response.text();
        let cfData;
        try {
            cfData = JSON.parse(text);
        } catch (err) {
            console.error('SERVER RESPONSE WAS NOT JSON:', text);
            throw new Error('Server returned non-JSON response. Check console for details.');
        }

        if (!response.ok) throw new Error(cfData.message || 'Cashfree init failed');

        const cashfree = Cashfree({
            mode: cashfreeMode || "sandbox"
        });

        let checkoutOptions = {
            paymentSessionId: cfData.payment_session_id,
            redirectTarget: "_self", // Optional: "_self" for same window
        };

        // Note: verifyPayment will be called after redirect or via a callback if supported by SDK setup
        // For simplicity with v3 Web SDK, we can use the following approach:
        cashfree.checkout(checkoutOptions).then((result) => {
            if (result.error) {
                alert(result.error.message);
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
            if (result.redirect) {
                console.log("Redirecting to payment page...");
            }
        });

        // However, if we want to handle verification on the same page for a smoother UX:
        // We'd need to use the headless/elements approach or check the status after redirect.
        // For now, let's assume direct verification if possible or guide the user.

    } catch (e) {
        alert('Payment Error: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
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
            window.location.href = 'profile.html?tab=orders';
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
