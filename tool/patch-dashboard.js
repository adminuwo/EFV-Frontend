const fs = require('fs');
const path = 'f:\\EFVFINAL\\VHA\\EFV-F\\public\\admin-dashboard.html';
const content = fs.readFileSync(path, 'utf8');
const searchString = '<!-- Admin Quick Actions -->';
const replacement = `                <!-- Strategic Management Access -->
                <div class="stats-grid" style="grid-template-columns: 1fr; margin-top: 25px;">
                    <button class="stat-card glass-panel shine-hover" onclick="location.href=\'partners.html\'" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; border-left: 5px solid var(--gold-text); background: rgba(212, 175, 55, 0.05); width: 100%; border-radius: 12px; border: none;">
                        <div style="display: flex; align-items: center; gap: 20px;">
                            <div class="icon-box gold" style="width: 50px; height: 50px; font-size: 1.2rem; background: rgba(212, 175, 55, 0.2);"><i class="fas fa-handshake"></i></div>
                            <div class="stat-info" style="text-align: left;">
                                <h3 style="margin: 0 0 5px 0; color: var(--gold-text); font-family: \'Cinzel\'; letter-spacing: 1px;">Partner Marketing Manager</h3>
                                <p style="margin: 0; opacity: 0.7; font-size: 0.9rem;">Oversee coupons, track marketing performance, and coordinate payouts.</p>
                            </div>
                        </div>
                        <span class="btn btn-gold small" style="padding: 10px 20px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Access Dashboard <i class="fas fa-arrow-right"></i></span>
                    </button>
                </div>

                <!-- Admin Quick Actions -->`;

if (content.includes(searchString)) {
    const newContent = content.replace(searchString, replacement);
    fs.writeFileSync(path, newContent);
    console.log('✅ Successfully patched admin-dashboard.html');
} else {
    console.error('❌ Could not find search string. Available content around line 169:');
    const lines = content.split('\n');
    console.log(lines.slice(165, 175).join('\n'));
    process.exit(1);
}
