/**
 * EFV ULTRA-SECURE PROTECTION LAYER v3.0 [TITANIUM EDITION]
 * Hardened for Zero-Latency Blackout & System Capture Prevention
 */

class EFVSecurity {
    constructor() {
        this.isActive = false;
        this.isProtected = false;
        this.isTampered = false;
        this.userId = 'N/A';
        this.userEmail = 'N/A';
        this.userIP = '0.0.0.0';
        this.monitorRunning = false;

        this.init();
    }

    async init() {
        this.loadUserData();
        this.setupUI();
        this.attachGlobalListeners();
        this.startHighFrequencyMonitor();
        this.fetchIP();
        console.log("🛡️ EFV Titanium Security Layer Online.");
    }

    loadUserData() {
        const user = JSON.parse(localStorage.getItem('efv_user') || '{}');
        this.userId = user._id || user.id || 'N/A';
        this.userEmail = user.email || 'N/A';
    }

    async fetchIP() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            this.userIP = data.ip || '0.0.0.0';
        } catch (e) { }
    }

    setupUI() {
        // 1. Violation Overlay
        if (!document.getElementById('security-violation-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'security-violation-overlay';
            overlay.className = 'security-violation-screen';
            overlay.innerHTML = `
                <div class="violation-content">
                    <div class="violation-icon"><i class="fas fa-user-shield"></i></div>
                    <h1 style="color: #ff4d4d; font-family: 'Cinzel', serif; letter-spacing: 3px;">SECURITY POLICY VIOLATION DETECTED</h1>
                    <p style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Unauthorized access, screenshot, or screen recording activity has been detected. <br> System access has been restricted to protect digital assets.</p>
                    
                    <div style="margin: 30px 0;">
                        <span style="background: rgba(255, 77, 77, 0.1); border: 1px solid rgba(255, 77, 77, 0.3); color: #ff4d4d; padding: 10px 20px; border-radius: 8px; font-size: 0.8rem; font-family: monospace;">
                            EVENT ID: EFV-SYS-${Math.random().toString(36).substr(2, 6).toUpperCase()}
                        </span>
                    </div>

                    <button onclick="location.reload()" class="violation-restore-btn" style="border-radius: 4px; padding: 12px 30px; font-size: 0.8rem;">RE-AUTHENTICATE</button>
                    
                    <div style="margin-top: 40px; font-size: 0.65rem; opacity: 0.4; letter-spacing: 1px;">
                        EFV™ SECURE INFRASTRUCTURE • CONTINUOUS MONITORING ACTIVE
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        // 2. Titanium Blackout Shield (GPU Accelerated)
        if (!document.getElementById('security-blackout-shield')) {
            const shield = document.createElement('div');
            shield.id = 'security-blackout-shield';
            shield.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:black; z-index:2147483600; display:none; pointer-events:all; backface-visibility:hidden; transform:translateZ(0);';
            document.body.appendChild(shield);
        }

        // 3. Watermark Container
        if (!document.getElementById('security-watermark-container')) {
            const wmContainer = document.createElement('div');
            wmContainer.id = 'security-watermark-container';
            wmContainer.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:2147483610; overflow:hidden; display:none;';
            document.body.appendChild(wmContainer);
        }
    }

    attachGlobalListeners() {
        // Absolute Blockers
        ['contextmenu', 'dragstart', 'selectstart', 'copy', 'cut', 'paste', 'keydown', 'keyup'].forEach(evt => {
            document.addEventListener(evt, e => {
                if (!this.isProtected) return;

                // Key checks
                if (evt === 'keydown' || evt === 'keyup') {
                    const keys = [
                        'PrintScreen', 'F12', 'c', 'u', 'i', 'j', 'p', 's', 'r', '3', '4', '5'
                    ];

                    const isSystemSS = (e.key === 'PrintScreen') || (e.keyCode === 44);
                    const isWinSS = (e.metaKey && e.shiftKey && (e.key === 'S' || e.key === 'R' || e.key === '3' || e.key === '4' || e.key === '5'));
                    const isMacSS = (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key));
                    const isInspect = (e.key === 'F12') || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()));
                    const isSave = (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U'));

                    if (isSystemSS || isWinSS || isMacSS || isInspect || isSave) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.blackout(true);
                        this.triggerViolation(`Action Blocked: ${e.key}`);
                    }
                } else if (!['keydown', 'keyup'].includes(evt)) {
                    e.preventDefault();
                }
            }, true);
        });

        // Fast Visibility
        document.addEventListener('visibilitychange', () => {
            if (this.isProtected) {
                if (document.hidden || document.visibilityState === 'hidden') {
                    this.blackout(true);
                    this.triggerViolation("Visibility Lost");
                }
            }
        });

        window.addEventListener('blur', () => {
            if (this.isProtected) this.blackout(true);
        });

        window.addEventListener('focus', () => {
            if (this.isProtected && !this.isTampered) this.blackout(false);
        });

        // Mouse exit (Snipping Tool trigger)
        document.addEventListener('mouseleave', () => {
            if (this.isProtected) this.blackout(true);
        });

        document.addEventListener('mouseenter', () => {
            if (this.isProtected && !this.isTampered) this.blackout(false);
        });
    }

    startHighFrequencyMonitor() {
        if (this.monitorRunning) return;
        this.monitorRunning = true;

        const check = () => {
            if (this.isProtected && !this.isTampered) {
                // Reduced aggression: only blackout if truly hidden or visibility lost
                // focus check removed as it triggers on simple clicks outside the window
                if (document.hidden || document.visibilityState === 'hidden') {
                    this.blackout(true);
                }
            }
            requestAnimationFrame(check);
        };
        requestAnimationFrame(check);

        // Slow ticker for watermark and IP
        setInterval(() => {
            if (this.isActive) this.updateWatermark();
        }, 2500);
    }

    enable() {
        console.log("🛡️ SECURITY ACTIVATED");
        this.isActive = true;
        this.isProtected = true;
        this.isTampered = false;
        document.body.classList.add('security-active');
        document.getElementById('security-watermark-container').style.display = 'block';
        this.blackout(false);
        this.updateWatermark();
    }

    disable() {
        console.log("🛡️ SECURITY DEACTIVATED");
        this.isActive = false;
        this.isProtected = false;
        this.blackout(false);
        document.body.classList.remove('security-active', 'security-violator');
        document.getElementById('security-watermark-container').style.display = 'none';

        const shield = document.getElementById('security-blackout-shield');
        if (shield) shield.style.display = 'none';
    }

    blackout(active) {
        if (!active) return;

        // Instead of just a temporary blackout, we now trigger a permanent violation
        // as per user request to show the red screen instead of just black.
        this.triggerViolation("Immediate Capture Protection");

        const media = document.querySelectorAll('video, audio');
        media.forEach(m => { try { m.pause(); } catch (e) { } });
    }

    triggerViolation(reason) {
        if (!this.isProtected || this.isTampered) return;
        this.isTampered = true;

        console.error("⛔ BREACH DETECTED:", reason);
        this.blackout(true);
        document.body.classList.add('security-violator');

        // Notify application
        window.dispatchEvent(new CustomEvent('efv-security-violation', { detail: { reason } }));
    }

    updateWatermark() {
        this._drawWatermark(document.getElementById('security-watermark-container'));
    }

    applyWatermark(container) {
        if (!container) return;
        this._drawWatermark(container);
    }

    _drawWatermark(target) {
        if (!target || !this.isActive) return;

        // Ensure we have a dedicated watermark layer so we don't wipe the reader
        let wmLayer = target.id === 'security-watermark-container' ? target : target.querySelector('.efv-internal-watermark');
        
        if (!wmLayer && target.id !== 'security-watermark-container') {
            wmLayer = document.createElement('div');
            wmLayer.className = 'efv-internal-watermark security-watermark-container';
            wmLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1; overflow:hidden; opacity:0.15;';
            target.appendChild(wmLayer);
        }

        if (!wmLayer) return;

        wmLayer.innerHTML = '';
        const timestamp = new Date().toLocaleTimeString();
        const text = `${this.userEmail} | ${this.userId} | ${timestamp} | IP: ${this.userIP}`;

        const isMobile = window.innerWidth < 768;
        const rows = isMobile ? 12 : 14;
        const cols = isMobile ? 3 : 6;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const item = document.createElement('div');
                item.className = 'security-watermark-item';
                item.textContent = text;
                item.style.position = 'absolute';
                item.style.pointerEvents = 'none';
                item.style.top = `${(i * (100 / rows))}%`;
                item.style.left = `${(j * (100 / cols))}%`;
                wmLayer.appendChild(item);
            }
        }
    }
}

window.efvSecurity = new EFVSecurity();
