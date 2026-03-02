/**
 * Advanced Anti-Screenshot & Anti-Screen-Recording Protection Layer
 * EFV Security System v1.0
 */

class EFVSecurity {
    constructor() {
        this.isActive = false; // Security is OFF by default, enabled only during reading/listening
        this.isProtected = false;
        this.isTampered = false;
        this.userId = 'N/A';
        this.userName = 'User';
        this.userEmail = 'N/A';
        this.userIP = '0.0.0.0';
        this.lastFocusTime = Date.now();
        this.watermarkInterval = null;
        this.captureCheckInterval = null;

        this.init();
    }

    applyWatermark(container) {
        if (!container) return;
        const text = `${this.userEmail} | ${this.userId} | ${new Date().toLocaleDateString()}`;
        const wm = document.createElement('div');
        wm.className = 'security-item-watermark';
        wm.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-30deg); opacity:0.1; pointer-events:none; font-size:24px; font-weight:bold; color:gold; white-space:nowrap; z-index:1000;';
        wm.textContent = text;
        container.appendChild(wm);
    }

    async init() {
        console.log("🔒 EFV Security Layer Initializing...");

        // 1. Load User Data
        this.loadUserData();

        // 2. Setup UI Elements
        this.setupUI();

        // 3. Start Protection Mechanisms
        this.preventInteractions();
        this.detectShortcuts();
        this.detectDevTools();
        this.detectScreenCapture();
        this.handleVisibility();

        // 4. Start Watermark
        this.startWatermark();

        // 5. Try to get IP (Optional but requested)
        this.fetchIP();

        console.log("✅ EFV Security Layer Initialized (Standby).");
    }

    enable() {
        console.log("🛡️ EFV Security: ACTIVATING PROTECTION");
        this.isActive = true;
        this.isProtected = true;

        // Show watermark
        const wmContainer = document.getElementById('security-watermark-container');
        if (wmContainer) wmContainer.style.display = 'block';
    }

    disable() {
        console.log("🔓 EFV Security: DEACTIVATING PROTECTION");
        this.isActive = false;
        this.isProtected = false;

        // Hide watermark
        const wmContainer = document.getElementById('security-watermark-container');
        if (wmContainer) wmContainer.style.display = 'none';

        // If we were in a blur state, clear it
        this.unlockContent();
    }

    loadUserData() {
        const user = JSON.parse(localStorage.getItem('efv_user') || '{}');
        this.userId = user._id || user.id || 'N/A';
        this.userName = user.name || 'Anonymous';
        this.userEmail = user.email || 'N/A';
    }

    async fetchIP() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            this.userIP = data.ip;
            this.updateWatermark(); // Refresh with real IP
        } catch (e) {
            console.warn("Could not fetch IP for watermark.");
        }
    }

    setupUI() {
        // Create Overlay if not exists
        if (!document.getElementById('security-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'security-overlay';
            overlay.innerHTML = `
                <div class="security-lock-icon"><i class="fas fa-user-shield"></i></div>
                <h1>Security Policy Violation Detected</h1>
                <p>Unauthorized screen capture, recording, or inspection is strictly prohibited.</p>
                <div class="security-meta">
                    Event Logged: ${new Date().toLocaleString()}<br>
                    User ID: ${this.userId}
                </div>
                <button onclick="location.reload()" class="security-retry-btn">Restore Session</button>
            `;
            document.body.appendChild(overlay);
        }

        // Create Watermark Container
        if (!document.getElementById('security-watermark-container')) {
            const wmContainer = document.createElement('div');
            wmContainer.id = 'security-watermark-container';
            wmContainer.style.display = 'none'; // Hidden by default
            document.body.appendChild(wmContainer);
        }

        // Create Security Shield (Physical block on top of content)
        if (!document.getElementById('security-shield')) {
            const shield = document.createElement('div');
            shield.id = 'security-shield';
            shield.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:black; z-index:999997; display:none; opacity:0; pointer-events:none; transition: opacity 0.1s ease-in-out;';
            document.body.appendChild(shield);
        }

        // Add Global CSS for blur/protection
        const style = document.createElement('style');
        style.textContent = `
            .security-locked #particles-js, 
            .security-locked main, 
            .security-locked header, 
            .security-locked section, 
            .security-locked nav, 
            .security-locked footer,
            .security-locked .reader-overlay,
            .security-locked .efv-audio-player-overlay,
            .security-locked .audiobook-detail-overlay,
            .security-locked .product-modal-overlay,
            .security-locked .tc-modal-overlay,
            .security-locked .modal-overlay {
                filter: blur(50px) brightness(0.3) sepia(1) hue-rotate(-50deg) !important;
                pointer-events: none !important;
                user-select: none !important;
                opacity: 0.1 !important;
            }
            .watermark-item {
                opacity: 0.22 !important; 
                color: rgba(212, 175, 55, 0.45) !important;
                font-family: 'Inter', sans-serif !important;
                font-weight: 800 !important;
                letter-spacing: 1px !important;
                pointer-events: none !important;
            }
            .security-locked #security-overlay {
                display: flex !important;
                background: radial-gradient(circle at center, rgba(30, 0, 0, 0.99), rgba(0, 0, 0, 1));
                border-top: 8px solid #ff4d4d;
                opacity: 1;
                z-index: 2000000 !important;
            }
            .security-locked-blank {
                display: none !important;
            }
            .security-blur #security-shield {
                display: block !important;
                opacity: 1 !important;
                pointer-events: all !important;
                transition: none !important;
            }
            .security-blur main, 
            .security-blur header, 
            .security-blur section, 
            .security-blur nav, 
            .security-blur footer,
            .security-blur .reader-overlay,
            .security-blur .efv-audio-player-overlay,
            .security-blur .audiobook-detail-overlay,
            .security-blur .product-modal-overlay,
            .security-blur .tc-modal-overlay {
                filter: blur(100px) !important;
                opacity: 0 !important;
                display: none !important;
            }
            .security-retry-btn {
                margin-top: 2rem;
                padding: 12px 30px;
                background: transparent;
                border: 2px solid #ff4d4d;
                color: #ff4d4d;
                border-radius: 30px;
                cursor: pointer;
                text-transform: uppercase;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            .security-retry-btn:hover {
                background: #ff4d4d;
                color: white;
            }
            .security-lock-icon {
                font-size: 5rem;
                margin-bottom: 1.5rem;
                animation: security-pulse 2s infinite;
            }
            @keyframes security-pulse {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }

    preventInteractions() {
        // Block Right Click -> Trigger Violation
        document.addEventListener('contextmenu', e => {
            if (this.isProtected) {
                e.preventDefault();
                this.triggerViolation("Right Click Attempt (Blocked)");
            }
        });

        // Block Text Selection & Copy
        document.addEventListener('copy', e => {
            if (this.isProtected) {
                e.preventDefault();
                this.triggerViolation("Copy attempt (Ctrl+C)");
            }
        });

        // Block Print
        window.onbeforeprint = (e) => {
            if (this.isProtected) {
                this.triggerViolation("Print attempt");
                return false;
            }
        };
    }

    detectShortcuts() {
        window.addEventListener('keydown', e => {
            // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (View Source), Ctrl+S (Save)
            const isInspect = (e.key === 'F12') ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S'));

            // Ctrl+P (Print)
            const isPrint = (e.ctrlKey && (e.key === 'p' || e.key === 'P'));

            // PrintScreen Detection (Keydown is faster than keyup for blocking)
            const isPrintScreen = (e.key === 'PrintScreen' || e.keyCode === 44);

            // Windows + Shift + S / R (Snippet Tool) - Hard to catch but we try
            const isWinSnippet = (e.metaKey && e.shiftKey && (e.key === 'S' || e.key === 'R' || e.key === 's' || e.key === 'r'));

            // Mac Shortcuts (Cmd+Shift+3/4/5)
            const isMacSnippet = (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'));

            if (isInspect || isPrint || isPrintScreen || isWinSnippet || isMacSnippet) {
                if (this.isProtected) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isPrintScreen || isWinSnippet || isMacSnippet) {
                        alert("Security: Screen capture is disabled on this platform.");
                        this.triggerViolation("Screenshot/Recording Attempt (" + e.key + ")");
                    } else {
                        alert("Security: Developer tools and printing are disabled.");
                        this.triggerViolation("Unauthorized Tool Access (" + e.key + ")");
                    }
                }
            }
        }, true);

        // Also catch on keyup for redundancy
        window.addEventListener('keyup', e => {
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                if (this.isProtected) {
                    this.lockContent("PrintScreen Detected");
                    this.triggerViolation("PrintScreen Key Captured");
                }
            }
        }, true);
    }

    handleVisibility() {
        // 1. Sudden blur events -> Trigger Violation
        window.addEventListener('blur', () => {
            if (this.isProtected) {
                this.lastFocusTime = Date.now();
                // Instead of blackout, we just blur the content
                this.lockContent("Focus Lost");

                // If focus stays lost for too long, it might be a capture tool
                this.captureCheckTimeout = setTimeout(() => {
                    if (!document.hasFocus() && this.isActive) {
                        // We keep it blurred but don't show the hard red alert yet
                    }
                }, 100);
            }
        });

        window.addEventListener('focus', () => {
            if (this.isProtected && !this.isTampered) {
                const now = Date.now();
                const focusGap = now - this.lastFocusTime;

                if (focusGap < 1000 && focusGap > 10) {
                    this.triggerViolation("Rapid Focus Return (Screen Snapped)");
                } else {
                    this.unlockContent();
                }
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.isProtected) {
                this.lockContent("Tab Backgrounded");
                this.triggerViolation("Security: Content hidden during tab switch");
            }
        });

        // 2. Mouse Leave Detection -> Trigger Violation
        document.addEventListener('mouseleave', () => {
            if (this.isProtected) {
                // Blur slightly when mouse leaves (common for recording bars)
                document.body.classList.add('security-blur');
            }
        });

        document.addEventListener('mouseenter', () => {
            if (this.isProtected && !this.isTampered) {
                this.unlockContent();
            }
        });

        // 3. Aggressive Focus Polling
        setInterval(() => {
            if (this.isProtected && !document.hasFocus() && !this.isTampered) {
                this.lockContent("Persistent Focus Loss");
            }
        }, 100);

        // 4. Window Resize Detection
        let lastSize = { w: window.innerWidth, h: window.innerHeight };
        window.addEventListener('resize', () => {
            if (!this.isProtected) return;
            const dw = Math.abs(window.innerWidth - lastSize.w);
            const dh = Math.abs(window.innerHeight - lastSize.h);
            if (dw > 20 || dh > 20) {
                this.triggerViolation("Window Size Tampered");
                this.updateWatermark();
                lastSize = { w: window.innerWidth, h: window.innerHeight };
            }
        });
    }

    lockContent(reason) {
        if (!this.isProtected) return;
        // console.log("🔒 Locking content: " + reason);
        document.body.classList.add('security-blur');
        this.pauseMedia();
    }

    unlockContent() {
        if (this.isTampered) return;
        document.body.classList.remove('security-blur');
    }

    pauseMedia() {
        const media = document.querySelectorAll('video, audio');
        media.forEach(m => {
            try { m.pause(); } catch (e) { }
        });
    }

    startWatermark() {
        this.updateWatermark();
        this.watermarkInterval = setInterval(() => {
            this.updateWatermark();
        }, 2000);
    }

    updateWatermark() {
        const container = document.getElementById('security-watermark-container');
        if (!container) return;

        container.innerHTML = '';
        const timestamp = new Date().toLocaleTimeString();
        const partialIP = this.userIP.split('.').slice(0, 3).join('.') + '.*';
        const text = `${this.userName} | ${this.userEmail} | ${timestamp} | IP: ${partialIP}`;

        // Responsive grid to ensure full coverage without excessive overlap
        const isMobile = window.innerWidth < 768;
        const rows = isMobile ? 12 : 15;
        const cols = isMobile ? 4 : 8;

        const spacingH = 100 / cols;
        const spacingV = 100 / rows;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const item = document.createElement('div');
                item.className = 'watermark-item';
                item.textContent = text;
                item.style.top = `${(i * spacingV) - 2}%`;
                item.style.left = `${(j * spacingH) - 5}%`;
                // Add jitter to prevent easy algorithmic removal
                item.style.paddingLeft = `${Math.random() * (isMobile ? 10 : 30)}px`;
                item.style.fontSize = isMobile ? '10px' : '12px';
                container.appendChild(item);
            }
        }
    }

    triggerViolation(reason) {
        if (!this.isActive) return; // Only trigger if actively protecting content
        this.isTampered = true;

        // Log to backend (Mock)
        this.logViolation(reason);

        // We use blur instead of blanking out the whole screen
        document.body.classList.add('security-locked');
        this.pauseMedia();

        // Dispatch event for other modules to react (e.g. destroy buffers)
        window.dispatchEvent(new CustomEvent('efv-security-violation', { detail: { reason } }));

        // Destroy sensitive data from memory if possible (clobbering localStorage parts)
        // localStorage.removeItem('efv_token'); // Aggressive - maybe too much for simple blur?

        // Hide protected components (those with .protected-content)
        document.querySelectorAll('.protected-content').forEach(el => {
            el.style.display = 'none';
        });

        if (reason.includes("Inspect")) {
            // Optional: Infinite debugger loop to freeze devtools
            // setInterval(() => { debugger; }, 100); 
        }
    }

    logViolation(reason) {
        const logData = {
            userId: this.userId,
            userName: this.userName,
            email: this.userEmail,
            ip: this.userIP,
            timestamp: new Date().toISOString(),
            reason: reason,
            userAgent: navigator.userAgent
        };
        console.table(logData);
        // fetch('/api/security/log', { method: 'POST', body: JSON.stringify(logData) });
    }
}

// Initialize on Load
window.efvSecurity = new EFVSecurity();
