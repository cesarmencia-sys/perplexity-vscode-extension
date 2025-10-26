import * as vscode from 'vscode';
import { PerplexityClient, Message } from './perplexityClient';

export class CodeActions {
    constructor(private readonly client: PerplexityClient) {}

    private getSelectedCode(): { code: string; language: string } | null {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No hay editor activo');
            return null;
        }

        const selection = editor.selection;
        const code = editor.document.getText(selection);
        
        if (!code) {
            vscode.window.showErrorMessage('Por favor selecciona código primero');
            return null;
        }

        const language = editor.document.languageId;
        return { code, language };
    }

    async explainCode() {
        const codeInfo = this.getSelectedCode();
        if (!codeInfo) return;

        const messages: Message[] = [
            {
                role: 'system',
                content: 'Eres un experto en programación. Explica código de forma clara y concisa en español.'
            },
            {
                role: 'user',
                content: `Explica este código ${codeInfo.language}:\n\n${codeInfo.code}`
            }
        ];

        await this.showResponse('Explicación del Código', messages);
    }

    async optimizeCode() {
        const codeInfo = this.getSelectedCode();
        if (!codeInfo) return;

        const messages: Message[] = [
            {
                role: 'system',
                content: 'Eres un experto en optimización de código. Proporciona sugerencias de mejora.'
            },
            {
                role: 'user',
                content: `Optimiza este código ${codeInfo.language} y explica las mejoras:\n\n${codeInfo.code}`
            }
        ];

        await this.showResponse('Optimización de Código', messages);
    }

    async generateTests() {
        const codeInfo = this.getSelectedCode();
        if (!codeInfo) return;

        const messages: Message[] = [
            {
                role: 'system',
                content: 'Eres un experto en testing. Genera tests unitarios completos.'
            },
            {
                role: 'user',
                content: `Genera tests unitarios para este código ${codeInfo.language}:\n\n${codeInfo.code}`
            }
        ];

        await this.showResponse('Tests Generados', messages);
    }

    async documentCode() {
        const codeInfo = this.getSelectedCode();
        if (!codeInfo) return;

        const messages: Message[] = [
            {
                role: 'system',
                content: 'Eres un experto en documentación de código. Genera documentación profesional.'
            },
            {
                role: 'user',
                content: `Genera documentación JSDoc/docstring para este código ${codeInfo.language}:\n\n${codeInfo.code}`
            }
        ];

        await this.showResponse('Documentación', messages);
    }

    async fixError() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        if (diagnostics.length === 0) {
            vscode.window.showInformationMessage('No se detectaron errores');
            return;
        }

        const error = diagnostics[0];
        const code = editor.document.getText();

        const messages: Message[] = [
            {
                role: 'system',
                content: 'Eres un experto en debugging. Proporciona soluciones claras.'
            },
            {
                role: 'user',
                content: `Error: ${error.message}\n\nCódigo:\n${code}\n\n¿Cómo lo soluciono?`
            }
        ];

        await this.showResponse('Solución de Error', messages);
    }

    private async showResponse(title: string, messages: Message[]) {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Consultando Perplexity...`,
            cancellable: false
        }, async (progress) => {
            try {
                const response = await this.client.chat(messages);
                
                const doc = await vscode.workspace.openTextDocument({
                    content: response,
                    language: 'markdown'
                });
                
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            } catch (error) {
                vscode.window.showErrorMessage('Error al obtener respuesta de Perplexity');
            }
        });
    }
}