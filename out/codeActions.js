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
exports.CodeActions = void 0;
const vscode = __importStar(require("vscode"));
class CodeActions {
    constructor(client) {
        this.client = client;
    }
    getSelectedCode() {
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
        if (!codeInfo)
            return;
        const messages = [
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
        if (!codeInfo)
            return;
        const messages = [
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
        if (!codeInfo)
            return;
        const messages = [
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
        if (!codeInfo)
            return;
        const messages = [
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
        if (!editor)
            return;
        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        if (diagnostics.length === 0) {
            vscode.window.showInformationMessage('No se detectaron errores');
            return;
        }
        const error = diagnostics[0];
        const code = editor.document.getText();
        const messages = [
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
    async showResponse(title, messages) {
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
            }
            catch (error) {
                vscode.window.showErrorMessage('Error al obtener respuesta de Perplexity');
            }
        });
    }
}
exports.CodeActions = CodeActions;
//# sourceMappingURL=codeActions.js.map