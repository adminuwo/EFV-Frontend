import { NextResponse } from 'next/server';

export async function GET() {
    // Determine the API URL from the environment variable or fallback to localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    // Create the plain JavaScript content that matches the old api-config.js
    const jsContent = `
/**
 * EFV API Configuration (Dynamically Generated)
 */
const CONFIG = {
    API_BASE_URL: '${apiUrl}',
    BASE_PATH: window.location.pathname.includes('/pages/') ? '../' : ''
};

console.log('🔗 EFV API connected to: ' + CONFIG.API_BASE_URL);
    `;

    // Return the response as an application/javascript file, preventing cache so updates apply instantly
    return new NextResponse(jsContent, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}
