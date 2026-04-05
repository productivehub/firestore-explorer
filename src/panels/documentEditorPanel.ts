import * as vscode from "vscode";
import * as path from "path";
import type { ConnectionManager } from "../services/connectionManager";
import { FirestoreService } from "../services/firestoreService";
import type { WebviewToHostMessage } from "../types";

export class DocumentEditorPanel {
  private panel: vscode.WebviewPanel;

  constructor(
    private context: vscode.ExtensionContext,
    private connectionManager: ConnectionManager,
    connectionName: string,
    docPath: string
  ) {
    const docId = docPath.split("/").pop() ?? docPath;

    this.panel = vscode.window.createWebviewPanel(
      "firestoreDocument",
      `${docId} (edit)`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, "webview", "dist")),
        ],
      }
    );

    this.panel.webview.html = this.getHtml(connectionName, docPath);
    this.panel.webview.onDidReceiveMessage(
      (msg: WebviewToHostMessage) => this.handleMessage(msg),
      undefined,
      []
    );
  }

  private async handleMessage(msg: WebviewToHostMessage) {
    try {
      switch (msg.type) {
        case "openDocument": {
          const db = this.connectionManager.getFirestore(msg.connectionName);
          const svc = new FirestoreService(db);
          const doc = await svc.getDocument(msg.docPath);
          this.panel.webview.postMessage({ type: "loadDocument", document: doc });
          break;
        }
        case "saveDocument": {
          const db = this.connectionManager.getFirestore(msg.connectionName);
          const svc = new FirestoreService(db);
          await svc.saveDocument(msg.docPath, msg.data);
          this.panel.webview.postMessage({ type: "saveResult", success: true });
          break;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.panel.webview.postMessage({ type: "error", message });
    }
  }

  private getHtml(connectionName: string, docPath: string): string {
    const webviewDistPath = path.join(this.context.extensionPath, "webview", "dist");
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(webviewDistPath, "assets", "index.js"))
    );
    const styleUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(webviewDistPath, "assets", "index.css"))
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__PANEL_TYPE__ = "document";
    window.__INITIAL_DATA__ = ${JSON.stringify({ connectionName, docPath })};
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
