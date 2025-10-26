"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPanel = void 0;
const vscode = __importStar(require("vscode"));
class ChatPanel {
    constructor(extensionUri, client) {
        this.extensionUri = extensionUri;
        this.client = client;
        this.messages = [];
    }
    show() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel('perplexityChat', 'Perplexity Chat', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.webview.html = this.getWebviewContent();
        this.panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'sendMessage') {
                await this.handleUserMessage(message.content);
            }
        });
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }
    async handleUserMessage(content) {
        this.messages.push({ role: 'user', content });
        this.postMessage({ type: 'userMessage', content });
        try {
            let assistantMessage = '';
            await this.client.streamChat(this.messages, (token) => {
                assistantMessage += token;
                this.postMessage({ type: 'streamToken', content: token });
            });
            this.messages.push({ role: 'assistant', content: assistantMessage });
            this.postMessage({ type: 'messageDone' });
        }
        catch (error) {
            this.postMessage({
                type: 'error',
                content: 'Error al comunicarse con Perplexity'
            });
        }
    }
    postMessage(message) {
        this.panel?.webview.postMessage(message);
    }
    getWebviewContent() {
        return `&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;style&gt;
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        #messages {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
            padding: 10px;
        }
        .message {
            margin-bottom: 16px;
            padding: 12px;
            border-radius: 8px;
            line-height: 1.5;
        }
        .user {
            background: #2b5278;
            color: white;
            margin-left: 20%;
        }
        .assistant {
            background: #1e1e1e;
            color: #d4d4d4;
            margin-right: 20%;
        }
        #input-container {
            display: flex;
            gap: 10px;
        }
        #messageInput {
            flex: 1;
            padding: 12px;
            border: 1px solid #3c3c3c;
            border-radius: 6px;
            background: #1e1e1e;
            color: #d4d4d4;
            font-size: 14px;
        }
        #sendButton {
            padding: 12px 24px;
            background: #2ea043;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        }
        #sendButton:hover {
            background: #2c974b;
        }
        code {
            background: #2d2d30;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
    &lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;div id="messages"&gt;&lt;/div&gt;
    &lt;div id="input-container"&gt;
        &lt;input type="text" id="messageInput" placeholder="Escribe tu pregunta..."&gt;
        &lt;button id="sendButton"&gt;Enviar&lt;/button&gt;
    &lt;/div&gt;

    &lt;script&gt;
        const vscode = acquireVsCodeApi();
        const messagesDiv = document.getElementById('messages');
        const input = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        let currentAssistantMessage = null;

        function addMessage(content, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user' : 'assistant');
            messageDiv.textContent = content;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            return messageDiv;
        }

        function sendMessage() {
            const content = input.value.trim();
            if (!content) return;

            addMessage(content, true);
            vscode.postMessage({ type: 'sendMessage', content });
            input.value = '';
            currentAssistantMessage = addMessage('', false);
        }

        sendButton.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.type === 'userMessage') {
                // Ya manejado localmente
            } else if (message.type === 'streamToken') {
                if (currentAssistantMessage) {
                    currentAssistantMessage.textContent += message.content;
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            } else if (message.type === 'messageDone') {
                currentAssistantMessage = null;
            } else if (message.type === 'error') {
                addMessage('❌ ' + message.content, false);
            }
        });
    &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;`;
    }
}
exports.ChatPanel = ChatPanel;
//# sourceMappingURL=chatPanel.js.map