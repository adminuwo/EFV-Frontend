// --- I18N SYSTEM INJECTION ---
(function initI18nSystem() {
    // 0. PRE-INITIALIZATION COOKIE CHECK (CRITICAL FOR NO-FLASH)
    const savedLang = localStorage.getItem('efv_lang');
    if (savedLang && savedLang !== 'en') {
        document.cookie = `googtrans=/en/${savedLang}; path=/`;
        document.cookie = `googtrans=/en/${savedLang}; domain=.${window.location.hostname}; path=/`;
        // Lock body opacity until translation kicks in
        document.documentElement.classList.add('efv-i18n-loading');
    }

    // Inject Google Translate Div completely hidden
    const gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    gtDiv.style.setProperty('display', 'none', 'important');
    gtDiv.style.setProperty('visibility', 'hidden', 'important');
    document.body.appendChild(gtDiv);

    // Load Google Translate Script
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
        
        // Ensure default combo picks up saved lang with robust polling
        let attempts = 0;
        const applySavedLang = () => {
            const selectElement = document.querySelector('.goog-te-combo');
            
            if (selectElement && savedLang && savedLang !== 'en') {
                selectElement.value = savedLang;
                selectElement.dispatchEvent(new Event('change'));
                console.log("🌍 i18n: Language applied successfully.");
                
                // Release the lock after a small delay to ensure rendering
                setTimeout(() => {
                    document.documentElement.classList.remove('efv-i18n-loading');
                }, 500);
            } else if (!selectElement && attempts < 20) {
                attempts++;
                setTimeout(applySavedLang, 200);
            } else {
                // If English or timed out, just show the page
                document.documentElement.classList.remove('efv-i18n-loading');
            }
        };
        setTimeout(applySavedLang, 200);
    };

    const gtScript = document.createElement('script');
    gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    gtScript.async = true;
    document.body.appendChild(gtScript);

    // Dynamic Google Translate CSS Hiding to maintain SaaS look
    const style = document.createElement('style');
    style.innerHTML = `
        /* Flash Prevention */
        html.efv-i18n-loading body {
            opacity: 0 !important;
            transition: opacity 0.4s ease-in-out;
            pointer-events: none !important;
        }

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
        
        /* Force body to stay at top and not pushed down by the Translate banner */
        body {
            top: 0px !important;
            position: static !important;
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
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'ar', name: 'Arabic' },
        { code: 'zh-CN', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'it', name: 'Italian' }
    ];

    function updateLanguageUI(langCode) {
        const langObj = languages.find(l => l.code === langCode);
        if (langObj) {
            const currentLangEl = document.getElementById('i18n-current-lang');
            if (currentLangEl) currentLangEl.textContent = langObj.name;
        }
    }

    function applyLanguage(langCode, isExternalSync = false) {
        if (!isExternalSync) {
            localStorage.setItem('efv_lang', langCode);
            // Trigger storage event manually for same-tab listeners if needed (though browser won't do it)
        }

        // Set cookies for Google Translate to pick up on page load
        if (langCode === 'en') {
            document.cookie = `googtrans=/en/en; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `googtrans=/en/en; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`;
        } else {
            document.cookie = `googtrans=/en/${langCode}; path=/`;
            document.cookie = `googtrans=/en/${langCode}; domain=.${window.location.hostname}; path=/`;
        }
        
        updateLanguageUI(langCode);

        // Attempt to trigger the Google Translate Widget
        let attempts = 0;
        const triggerWidget = () => {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                if (select.value !== langCode) {
                    select.value = langCode;
                    select.dispatchEvent(new Event('change'));
                }
            } else if (attempts < 15) {
                attempts++;
                setTimeout(triggerWidget, 300);
            } else {
                // Last resort: reload if widget doesn't appear after several seconds
                if (!isExternalSync) window.location.reload();
            }
        };
        triggerWidget();
    }

    // Tab Synchronization Logic
    window.addEventListener('storage', (e) => {
        if (e.key === 'efv_lang') {
            console.log('🔄 Syncing language change from another tab:', e.newValue);
            applyLanguage(e.newValue, true);
        }
    });

    // Modal HTML for Country Selection (Instantly Visible if no selection)
    const popupHtml = `
        <div id="i18n-popup-overlay" class="notranslate" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:999999;display:none;align-items:center;justify-content:center;opacity:0;transition:opacity(0.4s);pointer-events:none;">
            <div id="i18n-popup-content" style="background:#0a0e1a;border:1px solid rgba(212,175,55,0.2);border-radius:24px;width:90%;max-width:500px;box-shadow:0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.05);transform:scale(0.9);transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;">
                <div style="padding:25px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;align-items:center;text-align:center;">
                    <div style="width:50px;height:50px;background:rgba(212,175,55,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:15px;">
                        <i class="fas fa-globe-americas" style="color:#d4af37;font-size:1.5rem;"></i>
                    </div>
                    <h2 style="margin:0;font-size:1.4rem;font-weight:700;color:white;letter-spacing:0.5px;">Choose Your Location</h2>
                    <p style="color:rgba(255,255,255,0.5);font-size:0.9rem;margin-top:8px;">Experience the portal in your preferred language.</p>
                </div>
                <div style="padding:20px;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;gap:12px;" class="custom-scrollbar">
                    ${countries.map(c => `
                        <button class="i18n-country-btn notranslate" data-code="${c.code}" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px;color:white;text-align:left;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                            <img src="https://flagcdn.com/w40/${c.code.toLowerCase()}.png" width="28" style="border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,0.4); flex-shrink:0;" alt="${c.name}">
                            <span style="font-size:0.85rem; font-weight: 500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.name}</span>
                        </button>
                    `).join('')}
                </div>
                <div style="padding:20px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;background:rgba(255,255,255,0.02);">
                    <p style="color:rgba(255,255,255,0.4);font-size:0.75rem;margin:0;">Setting your region unlocks localized content and pricing.</p>
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
                <button id="i18n-switcher-btn" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:50px;padding:8px 16px;color:white;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:0.85rem;transition:all 0.3s;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-language" style="color:#d4af37;font-size:1rem;"></i>
                    <span id="i18n-current-lang" class="notranslate">English</span>
                    <i class="fas fa-caret-down" style="font-size:0.7rem;opacity:0.6;margin-left:2px;"></i>
                </button>
                <div id="i18n-switcher-dropdown" style="position:absolute;top:calc(100% + 12px);right:0;width:190px;background:#0d111d;border:1px solid rgba(212,175,55,0.2);border-radius:15px;box-shadow:0 10px 40px rgba(0,0,0,0.6);display:none;flex-direction:column;overflow:hidden;z-index:999999;">
                    <div style="max-height:350px;overflow-y:auto;padding:8px 0;" class="custom-scrollbar">
                        ${languages.map(l => `
                            <button class="i18n-lang-btn notranslate" data-code="${l.code}" style="background:transparent;border:none;width:100%;text-align:left;padding:12px 18px;color:rgba(255,255,255,0.8);font-size:0.9rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10px;border-left:3px solid transparent;">
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
            if (!isVisible) {
                switcherBtn.style.background = 'rgba(212,175,55,0.1)';
                switcherBtn.style.borderColor = 'rgba(212,175,55,0.3)';
            }
        });
        
        document.addEventListener('click', () => {
            switcherDropdown.style.display = 'none';
            switcherBtn.style.background = 'rgba(255,255,255,0.05)';
            switcherBtn.style.borderColor = 'rgba(255,255,255,0.1)';
        });

        document.querySelectorAll('.i18n-lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.currentTarget.getAttribute('data-code');
                applyLanguage(code);
                switcherDropdown.style.display = 'none';
            });
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(212, 175, 55, 0.08)';
                btn.style.color = '#fff';
                btn.style.borderLeftColor = '#d4af37';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'transparent';
                btn.style.color = 'rgba(255,255,255,0.8)';
                btn.style.borderLeftColor = 'transparent';
            });
        });
    }

    // Checking initial states
    const hasSeenPopup = sessionStorage.getItem('efv_country_selected_session');
    // savedLang is already declared at the top scope of the IIFE now

    if (savedLang) {
        updateLanguageUI(savedLang);
    }

    const overlay = document.getElementById('i18n-popup-overlay');
    const content = document.getElementById('i18n-popup-content');

    // Show popup as a mandatory starting point for each session
    if (!hasSeenPopup) {
        overlay.style.display = 'flex';
        // Block scrolling to force selection
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'all';
            content.style.transform = 'scale(1)';
        }, 100);
    }

    document.querySelectorAll('.i18n-country-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = 'rgba(212, 175, 55, 0.4)';
            btn.style.background = 'rgba(212, 175, 55, 0.08)';
            btn.style.transform = 'translateY(-2px)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            btn.style.background = 'rgba(255, 255, 255, 0.03)';
            btn.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('click', (e) => {
            const countryCode = e.currentTarget.getAttribute('data-code');
            const lang = countryLanguageMap[countryCode] || 'en';
            
            // Show Transition State
            const originalContent = btn.innerHTML;
            btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Initializing...`;
            btn.style.pointerEvents = 'none';
            btn.style.background = 'rgba(212, 175, 55, 0.2)';
            
            // Save selection
            sessionStorage.setItem('efv_country_selected_session', 'true');
            localStorage.setItem('efv_selected_country', countryCode); 
            localStorage.setItem('efv_country_selected', 'true'); 
            
            // Trigger language change
            applyLanguage(lang);
            
            // Delay closing to allow transition to start
            setTimeout(() => {
                overlay.style.opacity = '0';
                content.style.transform = 'scale(0.9)';
                overlay.style.pointerEvents = 'none';
                
                // Re-enable scrolling after selection
                document.body.style.overflow = '';
                
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 400);
            }, 800);
        });
    });
})();
