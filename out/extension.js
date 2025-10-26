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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const perplexityClient_1 = require("./perplexityClient");
const chatPanel_1 = require("./chatPanel");
const codeActions_1 = require("./codeActions");
let perplexityClient;
let chatPanel;
let codeActions;
function activate(context) {
    console.log('Perplexity Pro Assistant activado');
    perplexityClient = new perplexityClient_1.PerplexityClient();
    chatPanel = new chatPanel_1.ChatPanel(context.extensionUri, perplexityClient);
    codeActions = new codeActions_1.CodeActions(perplexityClient);
    // Comando: Abrir Chat
    context.subscriptions.push(vscode.commands.registerCommand('perplexity.openChat', () => {
        chatPanel.show();
    }));
    // Comando: Explicar Código
    context.subscriptions.push(vscode.commands.registerCommand('perplexity.explainCode', async () => {
        await codeActions.explainCode();
    }));
    // Comando: Optimizar Código
    context.subscriptions.push(vscode.commands.registerCommand('perplexity.optimizeCode', async () => {
        await codeActions.optimizeCode();
    }));
    // Comando: Generar Tests
    context.subscriptions.push(vscode.commands.registerCommand('perplexity.generateTests', async () => {
        await codeActions.generateTests();
    }));
    // Comando: Documentar Código
    context.subscriptions.push(vscode.commands.registerCommand('perplexity.documentCode', async () => {
        await codeActions.documentCode();
    }));
    // Comando: Solucionar Error
    context.subscriptions.push(vscode.commands.registerCommand('perplexity.fixError', async () => {
        await codeActions.fixError();
    }));
    // Agregar botón en la barra de estado
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'perplexity.openChat';
    statusBarItem.text = '$(comment-discussion) Perplexity';
    statusBarItem.tooltip = 'Abrir Chat de Perplexity Pro';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}
function deactivate() {
    console.log('Perplexity Pro Assistant desactivado');
}
//# sourceMappingURL=extension.js.map