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

    const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
        ? CONFIG.API_BASE_URL
        : 'http://localhost:8080';

    // Step 1: Render static products IMMEDIATELY
    renderProducts(STATIC_PRODUCTS);

    // Step 2: Merge backend data and re-render
    mergeBackendData();

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
            // This ensures that products deleted in Admin disappear from Marketplace
            const combinedProducts = backendProducts.map(b => {
                const staticMatch = STATIC_PRODUCTS.find(sp => sp._id === b._id);
                if (staticMatch) {
                    // Update static entry with live backend data
                    const preserved = {
                        language: staticMatch.language,
                        thumbnail: staticMatch.thumbnail || b.thumbnail
                    };
                    return { ...staticMatch, ...b, ...preserved };
                }
                // It's a brand new product not in our static list
                return b;
            });

            // Re-render EVERYTHING to ensure all updates, additions, AND deletions are reflected
            console.log('🔄 Marketplace: Syncing with Admin inventory (Updates & Deletions)...');
            renderProducts(combinedProducts, true);
        } catch (err) {
            console.log('ℹ️ Marketplace: Offline mode or timeout — using static catalog');
        }
    }

    function renderProducts(products, clearExisting = false) {
        if (!productGrid) return;

        if (clearExisting) {
            productGrid.innerHTML = ''; // Full refresh for backend updates
        }

        // Remove loading skeletons if present
        if (productGrid.querySelector('.loading-state')) {
            productGrid.innerHTML = '';
        }

        const existingIds = new Set(Array.from(productGrid.children).map(c => c.getAttribute('data-id')));

        products.forEach(product => {
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
        const card = document.createElement('div');
        card.className = 'product-card glass-panel reveal magnetic shine-box';
        card.setAttribute('data-id', product._id || product.id);
        card.setAttribute('data-name', product.title);
        card.setAttribute('data-price', product.price);
        card.setAttribute('data-type', product.type || '');
        card.setAttribute('data-language', product.language || '');
        card.setAttribute('data-subtitle', product.subtitle || '');

        const rawType = (product.type || 'book').toLowerCase();
        const typeLabel = {
            'hardcover': 'Hardcover',
            'paperback': 'Paperback',
            'audiobook': 'Audiobook',
            'ebook': 'E-Book'
        }[rawType] || product.type;

        const typeBadgeColor = {
            'hardcover': 'var(--gold-energy)',
            'paperback': '#4CAF50',
            'audiobook': '#FF6B35',
            'ebook': '#7B68EE'
        }[rawType] || 'var(--gold-energy)';

        let imageUrl = CONFIG.BASE_PATH + 'assets/images/vol1-cover.png';
        if (product.thumbnail) {
            if (product.thumbnail.startsWith('http') || product.thumbnail.startsWith(CONFIG.BASE_PATH + 'assets/images/')) {
                imageUrl = product.thumbnail;
            } else if (product.thumbnail.startsWith('img/')) {
                imageUrl = CONFIG.BASE_PATH + 'assets/images/' + product.thumbnail.replace('img/', '');
            } else {
                imageUrl = `${API_BASE}/${product.thumbnail}`;
            }
        }

        const isDigital = rawType === 'audiobook' || rawType === 'ebook';
        const isVol2 = product.volume === '2' || product.volume === 2 || (product._id || product.id || '').toLowerCase().includes('v2');
        const isEnglish = (product.language || '').toLowerCase().includes('english') || (product._id || '').toLowerCase().includes('_en');

        // Only Vol 2 products are "Coming Soon" by default. 
        let isComingSoon = isVol2;

        // Specific rule for Audiobooks: English stays "Coming Soon", Hindi goes LIVE.
        if (rawType === 'audiobook') {
            isComingSoon = isEnglish || isVol2;
        } else if (rawType === 'ebook' && !isVol2) {
            // E-Books for Vol 1 are all LIVE
            isComingSoon = false;
        }
        const buttonText = isComingSoon ? 'Coming Soon' : 'Add to Cart';

        const langBadge = product.language
            ? `<span style="display: block; width: fit-content; margin: 0 auto 8px; background: rgba(212,175,55,0.15); border: 1px solid var(--gold-energy); color: var(--gold-energy); padding: 1px 10px; border-radius: 20px; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; border-width: 0.5px;">${product.language} Edition</span>`
            : '';

        card.innerHTML = `
            <div class="book-cover"
                style="width: 100%; max-width: 140px; aspect-ratio: 2/3; margin: 0 auto 8px; background: #0b132b; border-radius: 8px; overflow: hidden; border: 1px solid var(--gold-energy); position: relative;">
                <span style="position: absolute; top: 5px; right: 5px; background: ${typeBadgeColor}; color: black; padding: 2px 8px; border-radius: 3px; font-size: 0.6rem; font-weight: 800; z-index: 5; text-transform: uppercase;">${typeLabel}</span>
                <img src="${imageUrl}" alt="${product.title}" loading="lazy"
                    style="width: 100%; height: 100%; object-fit: cover;"
                    onerror="this.src=CONFIG.BASE_PATH + 'assets/images/vol1-cover.png'">
            </div>
            <div class="product-info" style="text-align: center;">
                ${langBadge}
                <h3 style="font-size: 0.9rem; letter-spacing: 0.5px; margin-bottom: 2px; line-height: 1.2; min-height: unset; color: var(--gold-energy);">
                    ${product.title}
                </h3>
                <span style="color: rgba(255,255,255,0.6); font-size: 0.75rem; display: block; margin-bottom: 4px;">${typeLabel} Edition</span>
            </div>
            <div class="rating" style="color: var(--gold-energy); margin: 2px 0; text-align: center; font-size: 0.7rem; opacity: 0.8;">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
            </div>
            <p style="margin-bottom: 8px; font-size: 0.78rem; opacity: 0.7; min-height: 34px; text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">
                ${product.description || 'Discover the secrets of Energy and Alignment.'}
            </p>
            <span class="price" style="font-size: 1.15rem; display: block; text-align: center; margin-bottom: 10px; font-weight: 800; color: #fff;">₹${product.price}</span>
            <div class="product-actions" style="display: flex; gap: 8px; justify-content: center; margin-top: auto;">
                <button class="btn btn-outline view-info" ${isComingSoon ? 'disabled style="opacity: 0.5; padding: 6px 12px; font-size: 0.65rem;"' : 'style="padding: 6px 12px; font-size: 0.65rem; min-width: 95px; border-width: 1px;"'}>
                    <i class="fas fa-info-circle" style="margin-right: 5px;"></i> INFO
                </button>
                <button class="btn btn-gold buy-now" ${isComingSoon ? 'disabled style="background: rgba(255, 211, 105, 0.1); color: rgba(255, 211, 105, 0.5); opacity: 0.7; padding: 6px 12px; font-size: 0.65rem;"' : 'style="padding: 6px 12px; font-size: 0.65rem; min-width: 95px;"'}>
                    <i class="fas ${isComingSoon ? 'fa-clock' : 'fa-bolt'}" style="margin-right: 5px;"></i> ${isComingSoon ? 'SOON' : 'BUY'}
                </button>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                if (typeof window.openProductModal === 'function') {
                    window.openProductModal(product._id || product.id, card);
                }
            }
        });

        return card;
    }
});
