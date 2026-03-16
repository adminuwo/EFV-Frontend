/**
 * EFV API Configuration
 */
const CONFIG = {
    // FORCE LOCALHOST ONLY
    API_BASE_URL: 'http://localhost:8080',
    // API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '')
    //    ? 'http://localhost:8080'
    //    : 'https://efvbackend-743928421487.asia-south1.run.app',
    BASE_PATH: window.location.pathname.includes('/pages/') ? '../' : ''
};

console.log(`🔗 EFV API connected to: ${CONFIG.API_BASE_URL}`);
