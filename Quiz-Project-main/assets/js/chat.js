class ChatManager {
    constructor() {
        this.chatHistory = [];
        this.loadChatHistory();
        this.initializeUI();
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        // Chỉ hiển thị tin nhắn chào mừng nếu không có lịch sử chat
        if (this.chatHistory.length === 0) {
            const welcomeMessages = [
                {
                    type: 'ai',
                    content: 'Xin chào! Tôi là AI Assistant của Hello World Team 👋',
                    timestamp: new Date().toISOString()
                },
                {
                    type: 'ai',
                    content: 'Tôi có thể giúp bạn:' +
                            '\n• Tạo và quản lý các bài quiz' +
                            '\n• Giải đáp thắc mắc về các chủ đề' +
                            '\n• Hỗ trợ trong quá trình học tập',
                    timestamp: new Date(Date.now() + 100).toISOString()
                },
                {
                    type: 'ai',
                    content: 'Bạn có câu hỏi gì không? Đừng ngại hỏi tôi nhé! 😊',
                    timestamp: new Date(Date.now() + 200).toISOString()
                }
            ];

            welcomeMessages.forEach(message => {
                this.chatHistory.push(message);
                this.displayMessage(message);
            });

            // Lưu tin nhắn chào mừng vào localStorage
            this.saveChatHistory();
        }
    }

    initializeUI() {
        // Khởi tạo các event listeners cho chat
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        sendButton.addEventListener('click', () => this.sendMessage());
        
        // Khởi tạo các event listeners cho widget
        const chatWidget = document.getElementById('chatWidget');
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        const minimizeChatBtn = document.getElementById('minimizeChatBtn');
        
        // Toggle chat widget
        chatToggleBtn.addEventListener('click', () => {
            chatWidget.classList.toggle('active');
            if (chatWidget.classList.contains('active')) {
                chatInput.focus();
                // Scroll to bottom when opening chat
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
        
        // Minimize chat widget
        minimizeChatBtn.addEventListener('click', () => {
            chatWidget.classList.remove('active');
        });
        
        // Clear chat history
        const clearButton = document.getElementById('clearChatButton');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear chat history?')) {
                    this.clearHistory();
                    this.showWelcomeMessage(); // Show welcome message again after clearing
                }
            });
        }
        
        // Hiển thị lịch sử chat
        this.displayChatHistory();
    }

    loadChatHistory() {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            this.chatHistory = JSON.parse(savedHistory);
        }
    }

    saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        // Thêm tin nhắn của user vào chat
        this.addMessageToChat('user', message);
        chatInput.value = '';
        
        try {
            // Hiển thị loading indicator
            this.showLoading();
            
            // Gửi tin nhắn đến API với retry logic
            const response = await this.sendMessageWithRetry(message);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.details || 'Failed to get response');
            }
            
            const data = await response.json();
            
            // Thêm phản hồi từ AI vào chat
            this.addMessageToChat('ai', data.message);
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessageToChat('error', 
                'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau một lát. ' +
                (error.message || '')
            );
        } finally {
            this.hideLoading();
        }
    }

    async sendMessageWithRetry(message, retries = 3, delay = 1000) {
        // Get last 10 messages for context
        const recentMessages = this.chatHistory.slice(-10).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch('https://ttphuc.com/api/quiz/chat.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        message,
                        history: recentMessages
                    })
                });
                
                // Nếu response ok hoặc lỗi 4xx, return luôn
                if (response.ok || response.status >= 400 && response.status < 500) {
                    return response;
                }
                
                // Nếu lỗi 5xx và còn retry, đợi rồi thử lại
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                    continue;
                }
                
                return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    }

    addMessageToChat(type, content) {
        const message = {
            type,
            content,
            timestamp: new Date().toISOString()
        };
        
        this.chatHistory.push(message);
        this.saveChatHistory();
        this.displayMessage(message);
    }

    displayMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${message.type}-message`;
        
        const time = new Date(message.timestamp).toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-text">${this.formatMessage(message.content)}</span>
                <span class="message-time">${time}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    displayChatHistory() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        this.chatHistory.forEach(message => this.displayMessage(message));
    }

    formatMessage(content) {
        // Chuyển đổi URLs thành links
        return content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
                     // Chuyển đổi markdown code blocks
                     .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                     // Chuyển đổi markdown inline code
                     .replace(/`([^`]+)`/g, '<code>$1</code>')
                     // Chuyển đổi xuống dòng thành <br>
                     .replace(/\n/g, '<br>');
    }

    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'chatLoading';
        loadingDiv.className = 'chat-loading';
        loadingDiv.innerHTML = `
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        document.getElementById('chatMessages').appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingDiv = document.getElementById('chatLoading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    clearHistory() {
        this.chatHistory = [];
        localStorage.removeItem('chatHistory');
        this.displayChatHistory();
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    const chatManager = new ChatManager();
}); 