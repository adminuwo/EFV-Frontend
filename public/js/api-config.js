/**
 * EFV API Configuration - Core System
 */
const CONFIG = {
    // Determine API Base URL
    API_BASE_URL: (window.location.hostname.includes('efv-') || window.location.hostname.includes('.run.app') || window.location.hostname.includes('.app') || window.location.hostname.includes('efvframework.com'))
        ? 'https://efv-backend-246449377479.asia-south1.run.app'
        : 'http://localhost:8080',
    GOOGLE_CLIENT_ID: '246449377479-favi4q5sskhc1hnljs53aik69ftnr6bf.apps.googleusercontent.com',
    BASE_PATH: window.location.pathname.includes('/pages/') ? '../' : ''
};

// Global Exposure
window.API_BASE = CONFIG.API_BASE_URL;

console.log(`🔗 EFV API connected to: ${CONFIG.API_BASE_URL}`);
