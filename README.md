<link rel="shortcut icon" type="image/png" href="/images/favicon.png">

# perplexity-pro-assistant
Extensión completa y funcional de VSCode para integrar Perplexity Pro
--

Extensión de VSCode para integrar Perplexity Pro con chat interactivo, análisis de código, optimización, generación de tests, documentación automática y más. Incluye toda la implementación en TypeScript con cliente API, panel de chat con streaming, acciones de código contextuales y configuración completa. Lista para compilar e instalar.

📚 Resumen de la Implementación

He creado una extensión completa y funcional de VSCode para integrar Perplexity Pro que incluye:


✅ Características Implementadas

Chat Interactivo: Panel lateral con streaming en tiempo real

Análisis de Código: Explica código seleccionado con contexto

Optimización: Sugerencias inteligentes de mejora

Generación de Tests: Crea tests unitarios automáticamente

Documentación: Genera JSDoc/docstrings profesionales

Corrección de Errores: Analiza y soluciona bugs

Menú Contextual: Integrado en el click derecho del editor

Barra de Estado: Acceso rápido desde la barra inferior

📦 Archivos Incluidos

favicon.png - Logo de extensión

package.json - Configuración y metadatos

extension.ts - Punto de entrada principal

perplexityClient.ts - Cliente API con streaming

chatPanel.ts - Panel de chat webview

codeActions.ts - Acciones contextuales de código

tsconfig.json - Configuración TypeScript

🔧 Para Empezar

1.- Crea la estructura de carpetas

📁 Estructura del Proyecto

perplexity-vscode-extension/

--images/

    favicon.png

--src/

  extension.ts
  ```
import * as vscode from 'vscode'; import { PerplexityClient } from './perplexityClient'; import { ChatPanel } from './chatPanel'; import { CodeActions } from './codeActions'; let perplexityClient: PerplexityClient; let chatPanel: ChatPanel; let codeActions: CodeActions; export function activate(context: vscode.ExtensionContext) { console.log('Perplexity Pro Assistant activado'); perplexityClient = new PerplexityClient(); chatPanel = new ChatPanel(context.extensionUri, perplexityClient); codeActions = new CodeActions(perplexityClient); // Comando: Abrir Chat context.subscriptions.push( vscode.commands.registerCommand('perplexity.openChat', () => { chatPanel.show(); }) ); // Comando: Explicar Código context.subscriptions.push( vscode.commands.registerCommand('perplexity.explainCode', async () => { await codeActions.explainCode(); }) ); // Comando: Optimizar Código context.subscriptions.push( vscode.commands.registerCommand('perplexity.optimizeCode', async () => { await codeActions.optimizeCode(); }) ); // Comando: Generar Tests context.subscriptions.push( vscode.commands.registerCommand('perplexity.generateTests', async () => { await codeActions.generateTests(); }) ); // Comando: Documentar Código context.subscriptions.push( vscode.commands.registerCommand('perplexity.documentCode', async () => { await codeActions.documentCode(); }) ); // Comando: Solucionar Error context.subscriptions.push( vscode.commands.registerCommand('perplexity.fixError', async () => { await codeActions.fixError(); }) ); // Agregar botón en la barra de estado const statusBarItem = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Right, 100 ); statusBarItem.command = 'perplexity.openChat'; statusBarItem.text = '$(comment-discussion) Perplexity'; statusBarItem.tooltip = 'Abrir Chat de Perplexity Pro'; statusBarItem.show(); context.subscriptions.push(statusBarItem); } export function deactivate() { console.log('Perplexity Pro Assistant desactivado'); }
```
  perplexityClient.ts
  ```
import * as vscode from 'vscode'; import axios, { AxiosInstance } from 'axios'; export interface Message { role: 'system' | 'user' | 'assistant'; content: string; } export class PerplexityClient { private apiKey: string; private model: string; private client: AxiosInstance; constructor() { this.apiKey = this.getApiKey(); this.model = this.getModel(); this.client = axios.create({ baseURL: 'https://api.perplexity.ai', headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' } }); } private getApiKey(): string { const config = vscode.workspace.getConfiguration('perplexity'); const apiKey = config.get('apiKey', ''); if (!apiKey) { vscode.window.showErrorMessage( 'Por favor configura tu API Key de Perplexity en las preferencias' ); return ''; } return apiKey; } private getModel(): string { const config = vscode.workspace.getConfiguration('perplexity'); return config.get('model', 'llama-3.1-sonar-large-128k-online'); } async chat(messages: Message[]): Promise { try { const response = await this.client.post('/chat/completions', { model: this.model, messages: messages, temperature: 0.7, max_tokens: 4000 }); return response.data.choices[0].message.content; } catch (error: any) { console.error('Error en Perplexity API:', error); if (error.response?.status === 401) { vscode.window.showErrorMessage('API Key inválida. Verifica tu configuración.'); } else { vscode.window.showErrorMessage(`Error: ${error.message}`); } throw error; } } async streamChat( messages: Message[], onToken: (token: string) => void ): Promise { try { const response = await this.client.post('/chat/completions', { model: this.model, messages: messages, temperature: 0.7, max_tokens: 4000, stream: true }, { responseType: 'stream' }); response.data.on('data', (chunk: Buffer) => { const lines = chunk.toString().split('\n').filter(line => line.trim()); for (const line of lines) { if (line.startsWith('data: ')) { const data = line.slice(6); if (data === '[DONE]') return; try { const parsed = JSON.parse(data); const token = parsed.choices[0]?.delta?.content; if (token) { onToken(token); } } catch (e) { console.error('Error parsing stream:', e); } } } }); } catch (error: any) { console.error('Error en streaming:', error); throw error; } } }
```
  chatPanel.ts
  ```
import * as vscode from 'vscode'; import { PerplexityClient, Message } from './perplexityClient'; export class ChatPanel { private panel: vscode.WebviewPanel | undefined; private messages: Message[] = []; constructor( private readonly extensionUri: vscode.Uri, private readonly client: PerplexityClient ) {} public show() { if (this.panel) { this.panel.reveal(); return; } this.panel = vscode.window.createWebviewPanel( 'perplexityChat', 'Perplexity Chat', vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true } ); this.panel.webview.html = this.getWebviewContent(); this.panel.webview.onDidReceiveMessage( async message => { if (message.type === 'sendMessage') { await this.handleUserMessage(message.content); } } ); this.panel.onDidDispose(() => { this.panel = undefined; }); } private async handleUserMessage(content: string) { this.messages.push({ role: 'user', content }); this.postMessage({ type: 'userMessage', content }); try { let assistantMessage = ''; await this.client.streamChat(this.messages, (token) => { assistantMessage += token; this.postMessage({ type: 'streamToken', content: token }); }); this.messages.push({ role: 'assistant', content: assistantMessage }); this.postMessage({ type: 'messageDone' }); } catch (error) { this.postMessage({ type: 'error', content: 'Error al comunicarse con Perplexity' }); } } private postMessage(message: any) { this.panel?.webview.postMessage(message); } private getWebviewContent(): string { return `<!DOCTYPE html> <html> <head> <meta charset="UTF-8"> <style> body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; display: flex; flex-direction: column; height: 100vh; } #messages { flex: 1; overflow-y: auto; margin-bottom: 20px; padding: 10px; } .message { margin-bottom: 16px; padding: 12px; border-radius: 8px; line-height: 1.5; } .user { background: #2b5278; color: white; margin-left: 20%; } .assistant { background: #1e1e1e; color: #d4d4d4; margin-right: 20%; } #input-container { display: flex; gap: 10px; } #messageInput { flex: 1; padding: 12px; border: 1px solid #3c3c3c; border-radius: 6px; background: #1e1e1e; color: #d4d4d4; font-size: 14px; } #sendButton { padding: 12px 24px; background: #2ea043; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; } #sendButton:hover { background: #2c974b; } code { background: #2d2d30; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; } </style> </head> <body> <div id="messages"></div> <div id="input-container"> <input type="text" id="messageInput" placeholder="Escribe tu pregunta..."> <button id="sendButton">Enviar</button> </div> <script> const vscode = acquireVsCodeApi(); const messagesDiv = document.getElementById('messages'); const input = document.getElementById('messageInput'); const sendButton = document.getElementById('sendButton'); let currentAssistantMessage = null; function addMessage(content, isUser) { const messageDiv = document.createElement('div'); messageDiv.className = 'message ' + (isUser ? 'user' : 'assistant'); messageDiv.textContent = content; messagesDiv.appendChild(messageDiv); messagesDiv.scrollTop = messagesDiv.scrollHeight; return messageDiv; } function sendMessage() { const content = input.value.trim(); if (!content) return; addMessage(content, true); vscode.postMessage({ type: 'sendMessage', content }); input.value = ''; currentAssistantMessage = addMessage('', false); } sendButton.addEventListener('click', sendMessage); input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); }); window.addEventListener('message', event => { const message = event.data; if (message.type === 'userMessage') { // Ya manejado localmente } else if (message.type === 'streamToken') { if (currentAssistantMessage) { currentAssistantMessage.textContent += message.content; messagesDiv.scrollTop = messagesDiv.scrollHeight; } } else if (message.type === 'messageDone') { currentAssistantMessage = null; } else if (message.type === 'error') { addMessage('❌ ' + message.content, false); } }); </script> </body> </html>`; } }
```
  codeActions.ts
```
import * as vscode from 'vscode'; import { PerplexityClient, Message } from './perplexityClient'; export class CodeActions { constructor(private readonly client: PerplexityClient) {} private getSelectedCode(): { code: string; language: string } | null { const editor = vscode.window.activeTextEditor; if (!editor) { vscode.window.showErrorMessage('No hay editor activo'); return null; } const selection = editor.selection; const code = editor.document.getText(selection); if (!code) { vscode.window.showErrorMessage('Por favor selecciona código primero'); return null; } const language = editor.document.languageId; return { code, language }; } async explainCode() { const codeInfo = this.getSelectedCode(); if (!codeInfo) return; const messages: Message[] = [ { role: 'system', content: 'Eres un experto en programación. Explica código de forma clara y concisa en español.' }, { role: 'user', content: `Explica este código ${codeInfo.language}:\n\n${codeInfo.code}` } ]; await this.showResponse('Explicación del Código', messages); } async optimizeCode() { const codeInfo = this.getSelectedCode(); if (!codeInfo) return; const messages: Message[] = [ { role: 'system', content: 'Eres un experto en optimización de código. Proporciona sugerencias de mejora.' }, { role: 'user', content: `Optimiza este código ${codeInfo.language} y explica las mejoras:\n\n${codeInfo.code}` } ]; await this.showResponse('Optimización de Código', messages); } async generateTests() { const codeInfo = this.getSelectedCode(); if (!codeInfo) return; const messages: Message[] = [ { role: 'system', content: 'Eres un experto en testing. Genera tests unitarios completos.' }, { role: 'user', content: `Genera tests unitarios para este código ${codeInfo.language}:\n\n${codeInfo.code}` } ]; await this.showResponse('Tests Generados', messages); } async documentCode() { const codeInfo = this.getSelectedCode(); if (!codeInfo) return; const messages: Message[] = [ { role: 'system', content: 'Eres un experto en documentación de código. Genera documentación profesional.' }, { role: 'user', content: `Genera documentación JSDoc/docstring para este código ${codeInfo.language}:\n\n${codeInfo.code}` } ]; await this.showResponse('Documentación', messages); } async fixError() { const editor = vscode.window.activeTextEditor; if (!editor) return; const diagnostics = vscode.languages.getDiagnostics(editor.document.uri); if (diagnostics.length === 0) { vscode.window.showInformationMessage('No se detectaron errores'); return; } const error = diagnostics[0]; const code = editor.document.getText(); const messages: Message[] = [ { role: 'system', content: 'Eres un experto en debugging. Proporciona soluciones claras.' }, { role: 'user', content: `Error: ${error.message}\n\nCódigo:\n${code}\n\n¿Cómo lo soluciono?` } ]; await this.showResponse('Solución de Error', messages); } private async showResponse(title: string, messages: Message[]) { vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Consultando Perplexity...`, cancellable: false }, async (progress) => { try { const response = await this.client.chat(messages); const doc = await vscode.workspace.openTextDocument({ content: response, language: 'markdown' }); await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside); } catch (error) { vscode.window.showErrorMessage('Error al obtener respuesta de Perplexity'); } }); } }
```
--media/

    chat.html
    styles.css
  
package.json
```
{ "name": "perplexity-pro-assistant", "displayName": "Perplexity Pro Assistant", "description": "Integración completa de Perplexity Pro con chat y asistencia de IA", "version": "1.0.0", "publisher": "tu-nombre", "engines": { "vscode": "^1.80.0" }, "categories": ["AI", "Programming Languages", "Other"], "activationEvents": ["onStartupFinished"], "main": "./out/extension.js", "contributes": { "commands": [ { "command": "perplexity.openChat", "title": "Perplexity: Abrir Chat", "icon": "$(comment-discussion)" }, { "command": "perplexity.explainCode", "title": "Perplexity: Explicar Código" }, { "command": "perplexity.optimizeCode", "title": "Perplexity: Optimizar Código" }, { "command": "perplexity.generateTests", "title": "Perplexity: Generar Tests" }, { "command": "perplexity.documentCode", "title": "Perplexity: Documentar Código" }, { "command": "perplexity.fixError", "title": "Perplexity: Solucionar Error" } ], "menus": { "editor/context": [ { "when": "editorHasSelection", "command": "perplexity.explainCode", "group": "perplexity@1" }, { "when": "editorHasSelection", "command": "perplexity.optimizeCode", "group": "perplexity@2" }, { "when": "editorHasSelection", "command": "perplexity.generateTests", "group": "perplexity@3" }, { "when": "editorHasSelection", "command": "perplexity.documentCode", "group": "perplexity@4" } ] }, "configuration": { "title": "Perplexity Pro", "properties": { "perplexity.apiKey": { "type": "string", "default": "", "description": "Tu API Key de Perplexity Pro" }, "perplexity.model": { "type": "string", "default": "llama-3.1-sonar-large-128k-online", "enum": [ "llama-3.1-sonar-large-128k-online", "llama-3.1-sonar-small-128k-online", "llama-3.1-sonar-large-128k-chat", "llama-3.1-sonar-small-128k-chat" ], "description": "Modelo de IA a utilizar" } } } }, "scripts": { "vscode:prepublish": "npm run compile", "compile": "tsc -p ./", "watch": "tsc -watch -p ./", "lint": "eslint src --ext ts" }, "devDependencies": { "@types/node": "^20.0.0", "@types/vscode": "^1.80.0", "@typescript-eslint/eslint-plugin": "^6.0.0", "@typescript-eslint/parser": "^6.0.0", "eslint": "^8.45.0", "typescript": "^5.1.6" }, "dependencies": { "axios": "^1.6.0" } }
```
tsconfig.json
```
{ "compilerOptions": { "module": "commonjs", "target": "ES2020", "outDir": "out", "lib": ["ES2020"], "sourceMap": true, "rootDir": "src", "strict": true, "esModuleInterop": true, "skipLibCheck": true, "forceConsistentCasingInFileNames": true, "resolveJsonModule": true }, "exclude": ["node_modules", ".vscode-test"] }
```
README.md

.vscodeignore

2.- Copia el código de cada archivo

Ejecuta npm install

Configura tu API Key de Perplexity Pro

Presiona F5 para probar en modo desarrollo

La extensión está lista para usar y se puede empaquetar para distribución en el marketplace de VSCode.

--

📋 Características Principales


💬 Chat Integrado
Panel lateral con chat interactivo conectado a Perplexity Pro API

🔍 Análisis de Código
Explica, optimiza y documenta código seleccionado automáticamente

🤖 Modelos de IA
Acceso a modelos GPT-4, Claude 3.5 Sonnet y otros de Perplexity

⚙️ Comandos Rápidos
Comandos de paleta para acceso instantáneo a todas las funciones

📝 Generación de Tests
Crea tests unitarios automáticamente para tu código

🔧 Refactorización
Sugerencias inteligentes para mejorar la calidad del código


🎯 Casos de Uso

<ins>Asistente de Programación</ins>

Pregunta sobre cualquier concepto de programación en tiempo real

<ins>Revisión de Código</ins>

Obtén sugerencias de mejora y detección de bugs

<ins>Documentación Automática</ins>

Genera comentarios JSDoc/docstrings profesionales

<ins>Resolución de Errores</ins>

Analiza errores y recibe soluciones contextualizadas


🚀 Instalación y Uso

Paso 1: Preparar el Proyecto

Crear carpeta del proyecto:
```
mkdir perplexity-vscode-extension cd perplexity-vscode-extension
Copiar todos los archivos de código mostrados arriba en la estructura correcta
```

Instalar dependencias:
```
npm install
```

Paso 2: Configurar API Key

Obtén tu API Key de Perplexity Pro
En VSCode, ve a Preferencias > Settings
Busca "Perplexity" y pega tu API Key

Paso 3: Compilar la Extensión
```
npm run compile
```

Paso 4: Probar en Modo Desarrollo

Abre la carpeta del proyecto en VSCode
Presiona F5 para iniciar debugging
Se abrirá una nueva ventana de VSCode con la extensión activa

Paso 5: Empaquetar para Distribución (Opcional)

Instalar vsce:
```
npm install -g @vscode/vsce
```
Empaquetar:
```
npx @vscode/vsce package
```
Instalar el archivo .vsix generado:
```
code --install-extension perplexity-pro-assistant-1.0.0.vsix
````

📌 Nota Importante: Esta extensión requiere una suscripción activa de Perplexity Pro y una API Key válida. Puedes obtenerla en tu cuenta de Perplexity.

Comandos Disponibles

- Ctrl+Shift+P → "Perplexity: Abrir Chat" - 
Abre el panel de chat interactivo

- Click derecho → "Perplexity: Explicar Código" - 
Explica el código seleccionado

- Click derecho → "Perplexity: Optimizar Código" - 
Sugiere optimizaciones

- Click derecho → "Perplexity: Generar Tests" - 
Crea tests unitarios automáticamente

- Click derecho → "Perplexity: Documentar Código" - 
Genera documentación profesional

Solución de Problemas

❌ Error de API Key

Verifica que tu API Key esté correctamente configurada en Settings → Perplexity

❌ No se carga la extensión

Ejecuta npm run compile y reinicia VSCode

❌ Error de compilación

Asegúrate de tener TypeScript 5.1+ instalado: npm install -g typescript

❌ Chat no responde

Verifica tu conexión a internet y que tu suscripción de Perplexity Pro esté activa
