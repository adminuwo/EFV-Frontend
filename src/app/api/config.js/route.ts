import { NextResponse } from 'next/server';

export async function GET() {
    // Determine the API URL from the environment variable or fallback to production
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = envApiUrl || 'https://efvbackend-743928421487.asia-south1.run.app';
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '743928421487-tgh59ajhsmuk5ltomsooj46lials3hpt.apps.googleusercontent.com';
    
    if (!envApiUrl) {
        console.warn('⚠️ NEXT_PUBLIC_API_URL is not set. Falling back to production URL.');
    } else {
        console.log('✅ NEXT_PUBLIC_API_URL is set to:', envApiUrl);
    }
    
    // Create the plain JavaScript content that matches the old api-config.js
    const jsContent = `
/**
 * EFV API Configuration (Dynamically Generated)
 */
const CONFIG = {
    API_BASE_URL: '${apiUrl}',
    GOOGLE_CLIENT_ID: '${googleClientId}',
    BASE_PATH: window.location.pathname.includes('/pages/') ? '../' : ''
};

console.log('🔗 EFV API connected to: ' + CONFIG.API_BASE_URL);
if (CONFIG.API_BASE_URL.includes('localhost')) {
    console.warn('⚠️ WARNING: Frontend is connecting to LOCALHOST API. If this is a live site, login will fail.');
}
    `;

    // Return the response as an application/javascript file, preventing cache so updates apply instantly
    return new NextResponse(jsContent, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}
