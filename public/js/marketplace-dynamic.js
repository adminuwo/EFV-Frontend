/**
 * EFV Marketplace - Dynamic Loading System v4.0
 * Renders all products from static data immediately.
 * Merges digital product filePaths from backend (admin-configured).
 */

// ─── Static Product Catalog ─────────────────────────────────────────────────
const STATIC_PRODUCTS = [

    // ══════════════════════════════════════════════════════════════
    //  VOLUME 1 — ORIGIN CODE™  (Hindi Edition)
    // ══════════════════════════════════════════════════════════════
    {
        _id: 'efv_v1_hardcover',
        title: 'EFV™ VOL 1: ORIGIN CODE™',
        subtitle: 'Hardcover Edition',
        type: 'HARDCOVER',
        price: 599,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol1-cover.png',
        category: 'Physical',
        description: 'Learn the secrets of Energy and Alignment. Premium hardcover book.',
        language: 'Hindi',
        volume: '1'
    },
    {
        _id: 'efv_v1_paperback',
        title: 'EFV™ VOL 1: ORIGIN CODE™',
        subtitle: 'Paperback Edition',
        type: 'PAPERBACK',
        price: 299,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol1-cover.png',
        category: 'Physical',
        description: 'Learn the secrets of Energy and Alignment. Easy-to-carry paperback book.',
        language: 'Hindi',
        volume: '1'
    },
    {
        _id: 'efv_v1_ebook',
        title: 'EFV™ VOL 1: ORIGIN CODE™',
        subtitle: 'E-Book Edition',
        type: 'EBOOK',
        price: 149,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol1-cover.png',
        category: 'Digital',
        description: 'The complete digital version of Volume 1. Accessible on all devices.',
        language: 'Hindi',
        volume: '1'
    },
    {
        _id: 'efv_v1_audiobook',
        title: 'EFV™ VOL 1: ORIGIN CODE™',
        subtitle: 'Audiobook Edition',
        type: 'AUDIOBOOK',
        price: 199,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol1-cover.png',
        category: 'Digital',
        description: 'The immersive audio experience of Volume 1. Listen and align on the go.',
        language: 'Hindi',
        volume: '1'
    },

    // ══════════════════════════════════════════════════════════════
    //  VOLUME 1 — ORIGIN CODE™  (English Edition)
    // ══════════════════════════════════════════════════════════════
    {
        _id: 'efv_v1_hardcover_en',
        title: 'EFV™ VOL 1: THE ORIGIN CODE™',
        subtitle: 'Hardcover Edition',
        type: 'HARDCOVER',
        price: 499,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/english_v1.jpeg',
        category: 'Physical',
        description: 'The English hardcover edition of the foundational Volume 1.',
        language: 'English',
        volume: '1'
    },
    {
        _id: 'efv_v1_paperback_en',
        title: 'EFV™ VOL 1: THE ORIGIN CODE™',
        subtitle: 'Paperback Edition',
        type: 'PAPERBACK',
        price: 298,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/english_v1.jpeg',
        category: 'Physical',
        description: 'Explore the secrets of Energy and Alignment in English. Easy-to-carry paperback.',
        language: 'English',
        volume: '1'
    },
    {
        _id: 'efv_v1_ebook_en',
        title: 'EFV™ VOL 1: THE ORIGIN CODE™',
        subtitle: 'E-Book Edition',
        type: 'EBOOK',
        price: 149,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/english_v1.jpeg',
        category: 'Digital',
        description: 'The complete English digital version of Volume 1.',
        language: 'English',
        volume: '1'
    },
    {
        _id: 'efv_v1_audiobook_en',
        title: 'EFV™ VOL 1: THE ORIGIN CODE™',
        subtitle: 'Audiobook Edition',
        type: 'AUDIOBOOK',
        price: 199,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/english_v1.jpeg',
        category: 'Digital',
        description: 'The immersive English audio experience of Volume 1.',
        language: 'English',
        volume: '1'
    },

    // ══════════════════════════════════════════════════════════════
    //  VOLUME 2 — MINDOS™  (Hindi Edition)
    // ══════════════════════════════════════════════════════════════
    {
        _id: 'efv_v2_hardcover',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Hardcover Edition',
        type: 'HARDCOVER',
        price: 649,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol 2.png',
        category: 'Physical',
        description: 'An exploration of how thoughts and emotions shape our inner world.',
        language: 'Hindi',
        volume: '2'
    },
    {
        _id: 'efv_v2_paperback',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Paperback Edition',
        type: 'PAPERBACK',
        price: 449,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol 2.png',
        category: 'Physical',
        description: 'Decoding Thought, Emotion & The Architecture Of The Human Mind.',
        language: 'Hindi',
        volume: '2'
    },
    {
        _id: 'efv_v2_ebook',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'E-Book Edition',
        type: 'EBOOK',
        price: 199,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol 2.png',
        category: 'Digital',
        description: 'The complete digital version of Volume 2. Accessible on all devices.',
        language: 'Hindi',
        volume: '2'
    },
    {
        _id: 'efv_v2_audiobook',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Audiobook Edition',
        type: 'AUDIOBOOK',
        price: 249,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol 2.png',
        category: 'Digital',
        description: 'The immersive audio experience of Volume 2. Listen and align on the go.',
        language: 'Hindi',
        volume: '2'
    },

    // ══════════════════════════════════════════════════════════════
    //  VOLUME 2 — MINDOS™  (English Edition)
    // ══════════════════════════════════════════════════════════════
    {
        _id: 'efv_v2_hardcover_en',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Hardcover Edition',
        type: 'HARDCOVER',
        price: 699,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol 2.png',
        category: 'Physical',
        description: 'The English hardcover edition of Volume 2. Explore the architecture of the human mind.',
        language: 'English',
        volume: '2'
    },
    {
        _id: 'efv_v2_paperback_en',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Paperback Edition',
        type: 'PAPERBACK',
        price: 499,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol 2.png',
        category: 'Physical',
        description: 'The English paperback edition. Decoding Thought, Emotion & The Architecture Of The Human Mind.',
        language: 'English',
        volume: '2'
    },
    {
        _id: 'efv_v2_ebook_en',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'E-Book Edition',
        type: 'EBOOK',
        price: 249,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol 2.png',
        category: 'Digital',
        description: 'The complete English digital version of Volume 2.',
        language: 'English',
        volume: '2'
    },
    {
        _id: 'efv_v2_audiobook_en',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Audiobook Edition',
        type: 'AUDIOBOOK',
        price: 299,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol 2.png',
        category: 'Digital',
        description: 'The English audio experience of Volume 2.',
        language: 'English',
        volume: '2'
    }
];

// ─── Main Marketplace Logic ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    let allProducts = [...STATIC_PRODUCTS]; // Initial state
    let activeFilter = 'all';

    const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
        ? CONFIG.API_BASE_URL
        : 'http://localhost:8080';

    // Step 1: Render static products IMMEDIATELY
    renderProducts(allProducts);

    // Step 2: Merge backend data and re-render
    mergeBackendData();

    // Step 3: Initialize Filters
    initFilters();

    async function mergeBackendData() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${API_BASE}/api/products`, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) return;
            const backendProducts = await response.json();
            if (!Array.isArray(backendProducts)) return;

            // Use backend products as the source of truth for the catalog
            allProducts = backendProducts.map(b => {
                const staticMatch = STATIC_PRODUCTS.find(sp => sp._id === b._id);
                if (staticMatch) {
                    const preserved = {
                        language: staticMatch.language,
                        thumbnail: staticMatch.thumbnail || b.thumbnail
                    };
                    return { ...staticMatch, ...b, ...preserved };
                }
                return b;
            });

            console.log('🔄 Marketplace: Syncing with Admin inventory (Updates & Deletions)...');
            applyFilter(); // Re-render with existing filter
        } catch (err) {
            console.log('ℹ️ Marketplace: Offline mode or timeout — using static catalog');
        }
    }

    function initFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update UI state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update filter choice
                activeFilter = btn.dataset.filter;
                applyFilter();
            });
        });
    }

    function applyFilter() {
        if (!productGrid) return;

        let filtered = allProducts;
        if (activeFilter !== 'all') {
            filtered = allProducts.filter(p => p.type === activeFilter);
        }

        // Add a small fade-out effect for smooth transition
        productGrid.style.opacity = '0.3';

        setTimeout(() => {
            renderProducts(filtered, true);
            productGrid.style.opacity = '1';
        }, 300);
    }

    function checkIsComingSoon(product) {
        const rawType = (product.type || 'book').toLowerCase();
        const isVol2 = product.volume === '2' || product.volume === 2 || (product._id || product.id || '').toLowerCase().includes('v2');
        const isEnglish = (product.language || '').toLowerCase().includes('english') || (product._id || '').toLowerCase().includes('_en');

        let isSoon = isVol2;
        if (rawType === 'audiobook') {
            isSoon = isEnglish || isVol2;
        } else if (rawType === 'ebook' && !isVol2) {
            isSoon = false;
        }
        return isSoon;
    }

    function renderProducts(products, clearExisting = false) {
        if (!productGrid) return;

        // Sort: Available (isComingSoon=false) first, then Coming Soon (isComingSoon=true)
        const sortedProducts = [...products].sort((a, b) => {
            const soonA = checkIsComingSoon(a);
            const soonB = checkIsComingSoon(b);
            if (soonA === soonB) return 0;
            return soonA ? 1 : -1;
        });

        if (clearExisting) {
            productGrid.innerHTML = ''; // Full refresh for backend updates
        }

        // Remove loading skeletons if present
        if (productGrid.querySelector('.loading-state')) {
            productGrid.innerHTML = '';
        }

        const existingIds = new Set(Array.from(productGrid.children).map(c => c.getAttribute('data-id')));

        sortedProducts.forEach(product => {
            const id = product._id || product.id;
            // If not clearing, only add new ones. If clearing, we add everything back.
            if (!existingIds.has(id) || clearExisting) {
                productGrid.appendChild(createProductCard(product));
            }
        });

        // Initialize scroll animations
        if (typeof revealObserver !== 'undefined') {
            document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
        }
        if (typeof updateMarketplaceButtons === 'function') {
            updateMarketplaceButtons();
        }
    }

    function createProductCard(product) {
        const rawType = (product.type || 'PHYSICAL').toLowerCase();
        
        // ─── Regional Pricing Logic (Moved Up) ───
        const selectedCountry = localStorage.getItem('efv_selected_country') || 'IN';
        const CURRENCY_MAP = {
            'US': '$', 'GB': '£', 'EU': '€', 'CA': '$', 'AU': '$', 'IN': '₹'
        };
        const activeCurrency = CURRENCY_MAP[selectedCountry] || '$';
        
        // Use backend's regional price if available, else derive from provided table
        let displayPrice = product.price;
        const regionalData = product.regionalPrices ? (product.regionalPrices instanceof Map ? Object.fromEntries(product.regionalPrices) : product.regionalPrices) : {};

        if (regionalData && regionalData[selectedCountry]) {
            displayPrice = regionalData[selectedCountry];
        } else if (selectedCountry !== 'IN') {
            // Intelligent Fallback Based on User Requests
            const pricingTable = {
                'US': { 'audiobook': 6.99, 'ebook': 8.99, 'hindi_paperback': 14.99, 'hindi_hardcover': 22.99, 'english_paperback': 17.99, 'english_hardcover': 26.99 },
                'GB': { 'audiobook': 5.99, 'ebook': 6.99, 'hindi_paperback': 11.99, 'hindi_hardcover': 18.99, 'english_paperback': 13.99, 'english_hardcover': 21.99 },
                'EU': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
                'CA': { 'audiobook': 8.99, 'ebook': 10.99, 'hindi_paperback': 16.99, 'hindi_hardcover': 24.99, 'english_paperback': 19.99, 'english_hardcover': 29.99 },
                'AU': { 'audiobook': 9.99, 'ebook': 11.99, 'hindi_paperback': 18.99, 'hindi_hardcover': 27.99, 'english_paperback': 21.99, 'english_hardcover': 32.99 }
            };

            const rates = pricingTable[selectedCountry] || pricingTable['US']; // Fallback to US pricing for other global countries
            const lang = (product.language || 'Hindi').toLowerCase();
            const lookupKey = (rawType === 'audiobook' || rawType === 'ebook') 
                ? rawType 
                : `${lang}_${rawType}`;
            
            if (rates[lookupKey]) {
                displayPrice = rates[lookupKey];
            } else {
                // Global fallback for "Other Global Countries"
                const defaultGlobal = pricingTable['US'];
                displayPrice = defaultGlobal[lookupKey] || product.price;
            }
        }

        const card = document.createElement('div');
        card.className = 'product-card glass-panel reveal magnetic shine-box';
        card.setAttribute('data-id', product._id || product.id);
        card.setAttribute('data-name', product.title);
        card.setAttribute('data-price', displayPrice); // Now using the calculated regional price
        card.setAttribute('data-type', product.type || '');
        card.setAttribute('data-language', product.language || '');
        card.setAttribute('data-subtitle', product.subtitle || '');

        const typeBadgeData = {
            'hardcover': { color: '#FFD700', icon: 'fa-book', label: 'HARDCOVER' },
            'paperback': { color: '#4CAF50', icon: 'fa-book-open', label: 'PAPERBACK' },
            'audiobook': { color: '#FF6B35', icon: 'fa-headphones', label: 'AUDIOBOOK' },
            'ebook': { color: '#7B68EE', icon: 'fa-tablet-alt', label: 'E-BOOK' }
        }[rawType] || { color: 'var(--gold-energy)', icon: 'fa-book', label: rawType.toUpperCase() };

        let imageUrl = CONFIG.BASE_PATH + 'assets/images/vol1-cover.png';
        if (product.thumbnail) {
            if (product.thumbnail.startsWith('http') || product.thumbnail.startsWith(CONFIG.BASE_PATH + 'assets/images/')) {
                imageUrl = product.thumbnail;
            } else if (product.thumbnail.startsWith('img/')) {
                imageUrl = CONFIG.BASE_PATH + 'assets/images/' + product.thumbnail.replace('img/', '');
            } else if (product.thumbnail.startsWith('assets/images/')) {
                imageUrl = CONFIG.BASE_PATH + product.thumbnail;
            } else {
                imageUrl = `${API_BASE}/${product.thumbnail}`;
            }
        }

        const isComingSoon = checkIsComingSoon(product);
        const buttonText = isComingSoon ? 'Coming Soon' : 'Add to Cart';

        const langBadge = product.language
            ? `<span style="display: block; width: fit-content; margin: 0 auto 8px; background: rgba(212,175,55,0.15); border: 1px solid var(--gold-energy); color: var(--gold-energy); padding: 1px 10px; border-radius: 20px; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; border-width: 0.5px;">${product.language} Edition</span>`
            : '';

        card.innerHTML = `
            <div class="book-cover"
                style="width: 100%; max-width: 140px; aspect-ratio: 2/3; margin: 40px auto 12px; background: #0b132b; border-radius: 8px; overflow: visible; border: 1.5px solid var(--gold-energy); position: relative; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
                
                <div class="format-tag" style="position: absolute; top: -52px; left: 50%; transform: translateX(-50%); background: ${typeBadgeData.color}; color: black; padding: 4px 12px; border-radius: 50px; font-size: 0.65rem; font-weight: 900; z-index: 10; display: flex; flex-direction: row !important; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); white-space: nowrap; border: 1px solid rgba(0,0,0,0.1); transition: all 0.3s ease;">
                    <i class="fas ${typeBadgeData.icon}" style="font-size: 0.72rem; margin-top: -1px;"></i>
                    <span style="display: inline-block;">${typeBadgeData.label}</span>
                </div>

                <img src="${imageUrl}" alt="${product.title}" loading="lazy"
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;"
                    onerror="this.src=CONFIG.BASE_PATH + 'assets/images/vol1-cover.png'">
            </div>
            <div class="product-info" style="text-align: center;">
                ${langBadge}
                <h3 style="font-size: 0.9rem; letter-spacing: 0.5px; margin-bottom: 2px; line-height: 1.2; min-height: unset; color: var(--gold-energy);">
                    ${product.title}
                </h3>
                <span style="color: rgba(255,255,255,0.6); font-size: 0.75rem; display: block; margin-bottom: 4px;">${typeBadgeData.label} Edition</span>
            </div>
            <div class="rating" style="color: var(--gold-energy); margin: 2px 0; text-align: center; font-size: 0.7rem; opacity: 0.8;">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
            </div>
            <p style="margin-bottom: 8px; font-size: 0.78rem; opacity: 0.7; min-height: 34px; text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">
                ${product.description || 'Discover the secrets of Energy and Alignment.'}
            </p>
            <span class="price" style="font-size: 1.15rem; display: block; text-align: center; margin-bottom: 10px; font-weight: 800; color: #fff;">${activeCurrency}${displayPrice}</span>
            <div class="product-actions" style="display: flex; gap: 8px; justify-content: center; margin-top: auto;">
                <button class="btn btn-outline view-info" ${isComingSoon ? 'disabled style="opacity: 0.5; padding: 6px 12px; font-size: 0.65rem;"' : 'style="padding: 6px 12px; font-size: 0.65rem; min-width: 95px; border-width: 1px;"'}>
                    <i class="fas fa-info-circle" style="margin-right: 5px;"></i> INFO
                </button>
                <button class="btn btn-gold ${isComingSoon ? 'notify-trigger' : 'buy-now'}" 
                    ${isComingSoon ? `data-book="${product.title}"` : ''}
                    style="padding: 6px 12px; font-size: 0.65rem; min-width: 95px; ${isComingSoon ? 'background: var(--gold-energy); color: #000; opacity: 1;' : ''}">
                    <i class="fas ${isComingSoon ? 'fa-bell' : 'fa-bolt'}" style="margin-right: 5px;"></i> ${isComingSoon ? 'NOTIFY ME' : 'BUY NOW'}
                </button>
            </div>
        `;

        // Modal should ONLY open when clicking specific buttons, not the whole card
        const infoBtn = card.querySelector('.view-info');
        const buyBtn = card.querySelector('.buy-now');

        const triggerModal = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.openProductModal === 'function') {
                window.openProductModal(product._id || product.id, card);
            }
        };

        if (infoBtn) infoBtn.addEventListener('click', triggerModal);
        if (buyBtn && !isComingSoon) {
            buyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (typeof window.showTermsAndConditions === 'function' && typeof window.checkoutOrder === 'function') {
                    window.showTermsAndConditions(() => {
                        const item = {
                            id: product._id || product.id,
                            name: product.title,
                            price: displayPrice,
                            currency: activeCurrency,
                            quantity: 1,
                            language: product.language || '',
                            subtitle: product.subtitle || '',
                            type: (product.type || 'PHYSICAL').toUpperCase()
                        };
                        window.checkoutOrder([item]);
                    });
                } else {
                    // Fallback to modal if functions are missing
                    triggerModal(e);
                }
            });
        }

        return card;
    }
});
