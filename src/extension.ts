import * as vscode from 'vscode';
import { PerplexityClient } from './perplexityClient';
import { ChatPanel } from './chatPanel';
import { CodeActions } from './codeActions';

let perplexityClient: PerplexityClient;
let chatPanel: ChatPanel;
let codeActions: CodeActions;

export function activate(context: vscode.ExtensionContext) {
    console.log('Perplexity Pro Assistant activado');

    perplexityClient = new PerplexityClient();
    chatPanel = new ChatPanel(context.extensionUri, perplexityClient);
    codeActions = new CodeActions(perplexityClient);

    // Comando: Abrir Chat
    context.subscriptions.push(
        vscode.commands.registerCommand('perplexity.openChat', () => {
            chatPanel.show();
        })
    );

    // Comando: Explicar Código
    context.subscriptions.push(
        vscode.commands.registerCommand('perplexity.explainCode', async () => {
            await codeActions.explainCode();
        })
    );

    // Comando: Optimizar Código
    context.subscriptions.push(
        vscode.commands.registerCommand('perplexity.optimizeCode', async () => {
            await codeActions.optimizeCode();
        })
    );

    // Comando: Generar Tests
    context.subscriptions.push(
        vscode.commands.registerCommand('perplexity.generateTests', async () => {
            await codeActions.generateTests();
        })
    );

    // Comando: Documentar Código
    context.subscriptions.push(
        vscode.commands.registerCommand('perplexity.documentCode', async () => {
            await codeActions.documentCode();
        })
    );

    // Comando: Solucionar Error
    context.subscriptions.push(
        vscode.commands.registerCommand('perplexity.fixError', async () => {
            await codeActions.fixError();
        })
    );

    // Agregar botón en la barra de estado
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'perplexity.openChat';
    statusBarItem.text = '$(comment-discussion) Perplexity';
    statusBarItem.tooltip = 'Abrir Chat de Perplexity Pro';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

export function deactivate() {
    console.log('Perplexity Pro Assistant desactivado');
}