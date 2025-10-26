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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerplexityClient = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
class PerplexityClient {
    constructor() {
        this.apiKey = this.getApiKey();
        this.model = this.getModel();
        this.client = axios_1.default.create({
            baseURL: 'https://api.perplexity.ai',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }
    getApiKey() {
        const config = vscode.workspace.getConfiguration('perplexity');
        const apiKey = config.get('apiKey', '');
        if (!apiKey) {
            vscode.window.showErrorMessage('Por favor configura tu API Key de Perplexity en las preferencias');
            return '';
        }
        return apiKey;
    }
    getModel() {
        const config = vscode.workspace.getConfiguration('perplexity');
        return config.get('model', 'llama-3.1-sonar-large-128k-online');
    }
    async chat(messages) {
        try {
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4000
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            console.error('Error en Perplexity API:', error);
            if (error.response?.status === 401) {
                vscode.window.showErrorMessage('API Key inválida. Verifica tu configuración.');
            }
            else {
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
            throw error;
        }
    }
    async streamChat(messages, onToken) {
        try {
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4000,
                stream: true
            }, {
                responseType: 'stream'
            });
            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]')
                            return;
                        try {
                            const parsed = JSON.parse(data);
                            const token = parsed.choices[0]?.delta?.content;
                            if (token) {
                                onToken(token);
                            }
                        }
                        catch (e) {
                            console.error('Error parsing stream:', e);
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error en streaming:', error);
            throw error;
        }
    }
}
exports.PerplexityClient = PerplexityClient;
//# sourceMappingURL=perplexityClient.js.map