const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Prefill user data if available
    document.getElementById('ship-email').value = user.email || '';
    document.getElementById('ship-name').value = user.name || '';

    let checkoutItems = [];
    const directCheckout = JSON.parse(localStorage.getItem('directCheckout'));
    const cart = JSON.parse(localStorage.getItem('efv_cart')) || [];

    if (directCheckout) {
        checkoutItems = Array.isArray(directCheckout) ? directCheckout : [directCheckout];
    } else {
        checkoutItems = cart;
    }

    if (checkoutItems.length === 0) {
        alert('No items to checkout.');
        window.location.href = 'marketplace.html';
        return;
    }

    renderSummary(checkoutItems);
    setupPlaceOrder(checkoutItems, user);
    setupPincodeCheck(checkoutItems);
});

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
        } else {
            statusDiv.className = 'serviceability-info'; // Reverts to display:none via CSS
        }
    });

    // Also check if pre-filled pincode (e.g. from saved address) exists
    if (pinInput.value.length === 6) {
        pinInput.dispatchEvent(new Event('input'));
    }
}

function renderSummary(items) {
    const list = document.getElementById('checkout-items-list');
    let subtotal = 0;

    list.innerHTML = items.map(item => {
        subtotal += item.price * item.quantity;
        // In modal we set pm-img src, but in items we might not have 'image'. 
        // We'll try to find a thumbnail or use a placeholder.
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

    document.getElementById('summary-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `₹${subtotal.toFixed(2)}`;
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

        // 2. Create Order Object
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderId = 'EFV-' + Date.now() + Math.floor(Math.random() * 1000);

        const orderData = {
            orderId: orderId,
            userEmail: user.email,
            products: items,
            totalAmount: totalAmount,
            shippingAddress: address,
            paymentStatus: 'Pending',
            orderStatus: 'Awaiting Payment',
            orderDate: new Date().toISOString()
        };

        // Save to localStorage "orders"
        let allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        allOrders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(allOrders));

        showToast('Order created! Initializing payment...');

        // 3. Open Cashfree
        await initCashfree(orderData);
    });
}

async function initCashfree(order) {
    const btn = document.getElementById('place-order-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> INITIALIZING CASHFREE...';

    try {
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
                customerPhone: order.shippingAddress.phone
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
            mode: "sandbox" // Change to "production" in live
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
                    address: `${localOrder.shippingAddress.street}, ${localOrder.shippingAddress.area}, ${localOrder.shippingAddress.city}, ${localOrder.shippingAddress.pincode}`
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
