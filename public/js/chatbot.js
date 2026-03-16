// EFV Intelligence Chatbot
class EFVChatbot {
    constructor() {
        this.isOpen = false;
        this.history = [];
        const base = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';
        this.apiUrl = `${base}/api/chat/message`;
        this.init();
    }

    init() {
        this.injectHTML();
        this.attachEventListeners();
        this.startPeriodicBlink();
        this.checkFirstTimeIntro();
    }

    startPeriodicBlink() {
        const tooltip = document.querySelector('.efv-chat-tooltip');
        if (!tooltip) return;

        const triggerBlink = () => {
            tooltip.classList.add('efv-blink-active');
            setTimeout(() => {
                tooltip.classList.remove('efv-blink-active');
            }, 5000); // Wait for the 5s CSS animation to complete
        };

        // Repeat every 3 minutes (180,000ms)
        setInterval(triggerBlink, 180000);
    }

    injectHTML() {
        const chatHTML = `
            <div id="efv-chatbot">
                <!-- Background Blur Overlay -->
                <div id="efv-chat-overlay" class="efv-chat-overlay"></div>

                <!-- Floating Chat Button -->
                <button id="efv-chat-toggle" class="efv-chat-button" aria-label="Open EFV Intelligence">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M12 1C12 1 12.5 9.5 23 12C12.5 14.5 12 23 12 23C12 23 11.5 14.5 1 12C11.5 9.5 12 1 12 1Z" fill="#F4D03F"/>
                        <path d="M5 4C5 4 5.2 6 7.5 6.5C5.2 7 5 9 5 9C5 9 4.8 7 2.5 6.5C4.8 6 5 4 5 4Z" fill="#F4D03F" opacity="0.6"/>
                    </svg>
                </button>
                
                <!-- Tooltip with curved arrow -->
                <div class="efv-chat-tooltip">
                    <span class="efv-tooltip-text">EFV BOT</span>
                    <svg class="efv-curved-arrow" xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40">
                        <path d="M 10 5 Q 15 35, 50 35" stroke="#d4af37" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                <polygon points="0 0, 10 3, 0 6" fill="#d4af37" />
                            </marker>
                        </defs>
                    </svg>
                </div>

                <!-- Chat Window -->
                <div id="efv-chat-window" class="efv-chat-window">
                    <div class="efv-chat-header">
                        <div class="efv-chat-title">
                            <div class="efv-ai-avatar">⚡</div>
                            <div>
                                <h3>EFV<sup>™</sup> Intelligence</h3>
                                <p>Alignment Intelligence System</p>
                            </div>
                        </div>
                        <button id="efv-chat-close" class="efv-close-btn">×</button>
                    </div>

                    <div id="efv-chat-messages" class="efv-chat-messages">
                        <div class="efv-message efv-ai-message">
                            <div class="efv-message-content">
                                Welcome to EFV™. Let's measure your alignment.
                            </div>
                        </div>
                    </div>

                    <div class="efv-chat-input-container">
                        <input 
                            type="text" 
                            id="efv-chat-input" 
                            placeholder="Ask about alignment, books, or EFV™..." 
                            autocomplete="off"
                        />
                        <button id="efv-chat-send" class="efv-send-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Premium Intro Popup -->
            <div id="efv-intro-overlay">
                <div class="efv-intro-popup">
                    <div class="efv-intro-header">
                        <div class="efv-intro-icon-glow">
                             <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C12 2 12.5 9.5 23 12C12.5 14.5 12 22 12 22C12 22 11.5 14.5 1 12C11.5 9.5 12 2 12 2Z" fill="#D4AF37"/>
                            </svg>
                        </div>
                        <h2>MEET EFV ASSISTANT</h2>
                        <span class="efv-intro-subtitle">Your intelligent guide across the EFV platform.</span>
                    </div>
                    
                    <div class="efv-intro-body">
                        <p>Welcome to EFV™.</p>
                        <p>If you ever need help exploring the platform, finding books, understanding features, or asking questions, our EFV Assistant is always here for you.</p>
                        <p class="efv-highlight-text">Simply click the glowing star icon in the bottom-right corner to start chatting.</p>
                    </div>

                    <div class="efv-intro-actions">
                        <button id="efv-intro-got-it" class="efv-btn-intro-outline">Got It</button>
                        <button id="efv-intro-ask" class="efv-btn-intro-glow">Ask EFV Bot</button>
                    </div>

                    <!-- Short Elegant Pointer -->
                    <div class="efv-card-pointer">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <path d="M5 5 L35 35 M35 15 L35 35 L15 35" stroke="#D4AF37" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Enhanced Bot Highlight System -->
            <div id="efv-guide-system" class="efv-hidden">
                <div class="efv-bot-ring"></div>
                <div class="efv-bot-ring" style="animation-delay: 0.8s"></div>
                <div class="efv-bot-ring" style="animation-delay: 1.6s"></div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    checkFirstTimeIntro() {
        const hasSeenIntro = localStorage.getItem('efv_bot_intro_seen');
        if (!hasSeenIntro) {
            setTimeout(() => {
                this.showIntro();
            }, 2000);
        }
    }

    showIntro() {
        const introOverlay = document.getElementById('efv-intro-overlay');
        const chatToggle = document.getElementById('efv-chat-toggle');

        if (introOverlay) {
            introOverlay.classList.add('active');
            chatToggle.classList.add('efv-highlight');
            document.getElementById('efv-guide-system').classList.remove('efv-hidden');
        }

        // Event listeners for intro buttons
        const gotItBtn = document.getElementById('efv-intro-got-it');
        const askBtn = document.getElementById('efv-intro-ask');

        if (gotItBtn) {
            gotItBtn.onclick = () => this.closeIntro();
        }

        if (askBtn) {
            askBtn.onclick = () => {
                this.closeIntro();
                this.toggleChat();
            };
        }
    }

    closeIntro() {
        const introOverlay = document.getElementById('efv-intro-overlay');
        const chatToggle = document.getElementById('efv-chat-toggle');

        if (introOverlay) {
            introOverlay.classList.remove('active');
            document.getElementById('efv-guide-system').classList.add('efv-hidden');
            setTimeout(() => {
                introOverlay.style.display = 'none';
            }, 500);
        }

        if (chatToggle) {
            chatToggle.classList.remove('efv-highlight');
        }

        localStorage.setItem('efv_bot_intro_seen', 'true');
    }

    attachEventListeners() {
        const toggleBtn = document.getElementById('efv-chat-toggle');
        const closeBtn = document.getElementById('efv-chat-close');
        const sendBtn = document.getElementById('efv-chat-send');
        const input = document.getElementById('efv-chat-input');

        toggleBtn.addEventListener('click', () => this.toggleChat());
        closeBtn.addEventListener('click', () => this.closeChat());
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Click overlay to close
        const overlay = document.getElementById('efv-chat-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeChat());
        }
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('efv-chat-window');
        const toggleBtn = document.getElementById('efv-chat-toggle');
        const overlay = document.getElementById('efv-chat-overlay');

        if (this.isOpen) {
            chatWindow.classList.add('active');
            if (overlay) overlay.classList.add('active');
            toggleBtn.style.display = 'none';
        } else {
            chatWindow.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            toggleBtn.style.display = 'flex';
        }
    }

    closeChat() {
        this.isOpen = false;
        const chatWindow = document.getElementById('efv-chat-window');
        const toggleBtn = document.getElementById('efv-chat-toggle');
        const overlay = document.getElementById('efv-chat-overlay');

        if (chatWindow) chatWindow.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (toggleBtn) toggleBtn.style.display = 'flex';
    }

    async sendMessage() {
        const input = document.getElementById('efv-chat-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to UI
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history: this.history })
            });

            const data = await response.json();

            // Remove typing indicator
            this.hideTyping();

            if (data.response) {
                this.addMessage(data.response, 'ai');
                this.history.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.response }
                );
            } else {
                this.addMessage('I apologize, but I encountered an error. Please try again.', 'ai');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTyping();
            this.addMessage('Connection error. Please check if the server is running.', 'ai');
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('efv-chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `efv-message efv-${sender}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'efv-message-content';

        if (sender === 'ai') {
            // Professional Formatting for AI
            let formattedText = text
                .replace(/\n/g, '<br>') // Support newlines
                .replace(/\*\*(.*?)\*\*/g, '<span style="color: #d4af37; font-weight: bold;">$1</span>') // Highlight **words** as Gold Bold
                .replace(/• (.*?)(?=<br>|$)/g, '<div style="margin-left: 15px; margin-bottom: 5px;">• $1</div>'); // Indent bullet points

            contentDiv.innerHTML = formattedText;
        } else {
            contentDiv.textContent = text;
        }

        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
        const messagesContainer = document.getElementById('efv-chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'efv-typing';
        typingDiv.className = 'efv-message efv-ai-message';
        typingDiv.innerHTML = `
            <div class="efv-message-content">
                <div class="efv-typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        const typingDiv = document.getElementById('efv-typing');
        if (typingDiv) typingDiv.remove();
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new EFVChatbot());
} else {
    new EFVChatbot();
}
