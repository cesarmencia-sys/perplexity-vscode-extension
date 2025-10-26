import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class PerplexityClient {
    private apiKey: string;
    private model: string;
    private client: AxiosInstance;

    constructor() {
        this.apiKey = this.getApiKey();
        this.model = this.getModel();
        this.client = axios.create({
            baseURL: 'https://api.perplexity.ai',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    private getApiKey(): string {
        const config = vscode.workspace.getConfiguration('perplexity');
        const apiKey = config.get<string>('apiKey', '');
        
        if (!apiKey) {
            vscode.window.showErrorMessage(
                'Por favor configura tu API Key de Perplexity en las preferencias'
            );
            return '';
        }
        
        return apiKey;
    }

    private getModel(): string {
        const config = vscode.workspace.getConfiguration('perplexity');
        return config.get<string>('model', 'llama-3.1-sonar-large-128k-online');
    }

    async chat(messages: Message[]): Promise<string> {
        try {
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4000
            });

            return response.data.choices[0].message.content;
        } catch (error: any) {
            console.error('Error en Perplexity API:', error);
            
            if (error.response?.status === 401) {
                vscode.window.showErrorMessage('API Key inválida. Verifica tu configuración.');
            } else {
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
            
            throw error;
        }
    }

    async streamChat(
        messages: Message[],
        onToken: (token: string) => void
    ): Promise<void> {
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

            response.data.on('data', (chunk: Buffer) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') return;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const token = parsed.choices[0]?.delta?.content;
                            if (token) {
                                onToken(token);
                            }
                        } catch (e) {
                            console.error('Error parsing stream:', e);
                        }
                    }
                }
            });
        } catch (error: any) {
            console.error('Error en streaming:', error);
            throw error;
        }
    }
}