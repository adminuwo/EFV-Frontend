// --- I18N SYSTEM INJECTION ---
(function initI18nSystem() {
    // Inject Google Translate Div completely hidden
    const gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    gtDiv.style.display = 'none';
    document.body.appendChild(gtDiv);

    // Load Google Translate Script
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
        
        // Ensure default combo picks up saved lang with robust polling
        let attempts = 0;
        const applySavedLang = () => {
            const savedLang = localStorage.getItem('efv_lang');
            const selectElement = document.querySelector('.goog-te-combo');
            
            if (selectElement && savedLang && savedLang !== 'en') {
                selectElement.value = savedLang;
                selectElement.dispatchEvent(new Event('change'));
                console.log("🌍 i18n: Language applied successfully.");
            } else if (!selectElement && attempts < 10) {
                attempts++;
                setTimeout(applySavedLang, 500);
            }
        };
        setTimeout(applySavedLang, 500);
    };
    const gtScript = document.createElement('script');
    gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    gtScript.async = true;
    document.body.appendChild(gtScript);

    // Dynamic Google Translate CSS Hiding to maintain SaaS look
    const style = document.createElement('style');
    style.innerHTML = `
        /* Aggressively Hide Google Translate top banner & popups */
        .goog-te-banner-frame.skiptranslate, 
        .goog-te-banner-frame,
        .goog-te-gadget-icon,
        #goog-gt-tt,
        .VIpgJd-Zvi9od-ORHb-OEVmcd,
        .VIpgJd-Zvi9od-aZ2wEe-wOHMyf,
        iframe[src*="translate"], 
        iframe.skiptranslate,
        .goog-te-spinner-pos,
        .goog-te-balloon-frame,
        #google_translate_element,
        .goog-te-gadget {
            display: none !important;
            visibility: hidden !important;
        }

        /* Prevent Google Translate from adding 'original text' tooltips on hover */
        .goog-text-highlight {
            background: none !important;
            box-shadow: none !important;
        }
        
        .notranslate {
            /* This marks element as non-translatable for Google */
        }
        
        /* Force body to stay at top and not pushed down by the Translate banner */
        body {
            top: 0px !important;
            position: static !important;
        }
        
        html {
            height: 100%;
        }
    `;
    document.head.appendChild(style);

    const countryLanguageMap = {
        'IN': 'hi', 'US': 'en', 'GB': 'en', 'FR': 'fr', 'DE': 'de', 'ES': 'es',
        'AE': 'ar', 'CN': 'zh-CN', 'JP': 'ja', 'IT': 'it', 'PT': 'pt', 'RU': 'ru', 'KR': 'ko'
    };

    const countries = [
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'IN', name: 'India', flag: '🇮🇳' },
        { code: 'FR', name: 'France', flag: '🇫🇷' },
        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
        { code: 'ES', name: 'Spain', flag: '🇪🇸' },
        { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
        { code: 'CN', name: 'China', flag: '🇨🇳' },
        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
        { code: 'IT', name: 'Italy', flag: '🇮🇹' }
    ];

    const languages = [
        { code: 'en', name: 'English', flag: 'us' },
        { code: 'hi', name: 'Hindi', flag: 'in' },
        { code: 'es', name: 'Spanish', flag: 'es' },
        { code: 'fr', name: 'French', flag: 'fr' },
        { code: 'de', name: 'German', flag: 'de' },
        { code: 'ar', name: 'Arabic', flag: 'ae' },
        { code: 'zh-CN', name: 'Chinese', flag: 'cn' },
        { code: 'ja', name: 'Japanese', flag: 'jp' },
        { code: 'it', name: 'Italian', flag: 'it' }
    ];

    function applyLanguage(langCode) {
        localStorage.setItem('efv_lang', langCode);
        if (langCode === 'en') {
            document.cookie = `googtrans=/en/en; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `googtrans=/en/en; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`;
        } else {
            document.cookie = `googtrans=/en/${langCode}; path=/`;
        }
        
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
        } else {
            window.location.reload();
        }
    }

    // Modal HTML for Country Selection (Instantly Visible if no selection)
    const popupHtml = `
        <div id="i18n-popup-overlay" class="notranslate" style="position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(5px);z-index:999999;display:none;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s;pointer-events:none;">
            <div id="i18n-popup-content" style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;width:90%;max-width:450px;box-shadow:0 20px 50px rgba(0,0,0,0.5);transform:scale(0.95);transition:all 0.3s;max-height:80vh;display:flex;flex-direction:column;">
                <div style="padding:20px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;align-items:center;gap:10px;color:white;">
                        <i class="fas fa-globe" style="color:#d4af37;font-size:1.2rem;"></i>
                        <h2 style="margin:0;font-size:1.1rem;font-weight:600;">Select Your Country</h2>
                    </div>
                </div>
                <div style="padding:15px;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    ${countries.map(c => `
                        <button class="i18n-country-btn notranslate" data-code="${c.code}" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;color:white;text-align:left;cursor:pointer;display:flex;align-items:center;gap:15px;transition:all 0.2s;">
                            <img src="https://flagcdn.com/w40/${c.code.toLowerCase()}.png" width="30" style="border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.3); flex-shrink:0;" alt="${c.name}">
                            <span style="font-size:0.9rem; font-weight: 500;">${c.name}</span>
                        </button>
                    `).join('')}
                </div>
                <div style="padding:15px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;color:rgba(255,255,255,0.5);font-size:0.8rem;">
                    We'll customize your experience based on your region.
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHtml);

    // Language Switcher in Navbar
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        const switcherHtml = `
            <div style="position:relative;margin-right:15px;display:inline-flex;align-items:center;" id="i18n-switcher-container" class="notranslate">
                <button id="i18n-switcher-btn" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:50px;padding:8px 15px;color:white;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:0.85rem;transition:all 0.2s;">
                    <i class="fas fa-globe" style="color:#d4af37;"></i>
                    <span id="i18n-current-lang" class="notranslate">English</span>
                    <i class="fas fa-chevron-down" style="font-size:0.7rem;opacity:0.7;margin-left:4px;"></i>
                </button>
                <div id="i18n-switcher-dropdown" style="position:absolute;top:calc(100% + 10px);right:0;width:180px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.1);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);display:none;flex-direction:column;overflow:hidden;z-index:999999;">
                    <div style="max-height:300px;overflow-y:auto;padding:5px 0;">
                        ${languages.map(l => `
                            <button class="i18n-lang-btn notranslate" data-code="${l.code}" style="background:transparent;border:none;width:100%;text-align:left;padding:10px 15px;color:white;font-size:0.85rem;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;gap:10px;">
                                <img src="https://flagcdn.com/w20/${l.flag}.png" width="18" style="border-radius:2px; flex-shrink:0;" alt="${l.name}">
                                ${l.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        navActions.insertAdjacentHTML('afterbegin', switcherHtml);
        
        const switcherBtn = document.getElementById('i18n-switcher-btn');
        const switcherDropdown = document.getElementById('i18n-switcher-dropdown');
        
        switcherBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = switcherDropdown.style.display === 'flex';
            switcherDropdown.style.display = isVisible ? 'none' : 'flex';
        });
        document.addEventListener('click', () => switcherDropdown.style.display = 'none');

        document.querySelectorAll('.i18n-lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.currentTarget.getAttribute('data-code');
                document.getElementById('i18n-current-lang').textContent = languages.find(l => l.code === code).name;
                applyLanguage(code);
                switcherDropdown.style.display = 'none';
            });
            btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(212, 175, 55, 0.1)');
            btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
        });
    }

    // Checking states
    const hasSeenPopup = localStorage.getItem('efv_country_selected');
    const savedLang = localStorage.getItem('efv_lang');

    if (savedLang) {
        const langObj = languages.find(l => l.code === savedLang);
        if (langObj && document.getElementById('i18n-current-lang')) {
            document.getElementById('i18n-current-lang').textContent = langObj.name;
        }
    }

    const overlay = document.getElementById('i18n-popup-overlay');
    const content = document.getElementById('i18n-popup-content');

    // Trigger popup immediately if hasn't seen
    if (!hasSeenPopup) {
        overlay.style.display = 'flex';
        // Need a tiny delay for CSS transition to trigger
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'all';
            content.style.transform = 'scale(1)';
        }, 10);
    }

    document.querySelectorAll('.i18n-country-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = 'rgba(212, 175, 55, 0.5)';
            btn.style.background = 'rgba(212, 175, 55, 0.1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
        });
        
        btn.addEventListener('click', (e) => {
            const countryCode = e.currentTarget.getAttribute('data-code');
            const lang = countryLanguageMap[countryCode] || 'en';
            
            localStorage.setItem('efv_country_selected', 'true');
            
            overlay.style.opacity = '0';
            content.style.transform = 'scale(0.95)';
            overlay.style.pointerEvents = 'none';
            
            setTimeout(() => {
                overlay.style.display = 'none';
                
                // Update switcher visually
                const selectedLangObj = languages.find(l => l.code === lang);
                if (selectedLangObj && document.getElementById('i18n-current-lang')) {
                    document.getElementById('i18n-current-lang').textContent = selectedLangObj.name;
                }
                
                applyLanguage(lang);
            }, 300);
        });
    });
})();
