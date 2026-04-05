import * as path from "path";
import * as vscode from "vscode";
import { ConnectionManager } from "./services/connectionManager";
import {
  ConnectionTreeProvider,
  ConnectionTreeItem,
  CollectionTreeItem,
} from "./providers/connectionTreeProvider";
import { SavedQueriesTreeProvider } from "./providers/savedQueriesTreeProvider";
import { CollectionPanel } from "./panels/collectionPanel";
import { QueryBuilderPanel } from "./panels/queryBuilderPanel";
import { DocumentEditorPanel } from "./panels/documentEditorPanel";
import { FirestoreFileSystemProvider } from "./providers/firestoreFileSystemProvider";
import type { ConnectionConfig } from "./types";

let connectionManager: ConnectionManager;

export function activate(context: vscode.ExtensionContext) {
  connectionManager = new ConnectionManager();
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  // Register firestore: virtual file system
  const fsProvider = new FirestoreFileSystemProvider(connectionManager);
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider("firestore", fsProvider, {
      isCaseSensitive: true,
    })
  );

  // Tree providers
  const connectionTreeProvider = new ConnectionTreeProvider(connectionManager);
  const savedQueriesProvider = new SavedQueriesTreeProvider(workspaceRoot);

  vscode.window.registerTreeDataProvider("firestoreConnections", connectionTreeProvider);
  vscode.window.registerTreeDataProvider("firestoreSavedQueries", savedQueriesProvider);

  // Resolve relative serviceAccountPath against the workspace root so
  // production connections work regardless of the process cwd.
  function resolveConnection(config: ConnectionConfig): ConnectionConfig {
    if (config.type === "production" && config.serviceAccountPath && workspaceRoot && !path.isAbsolute(config.serviceAccountPath)) {
      return { ...config, serviceAccountPath: path.resolve(workspaceRoot, config.serviceAccountPath) };
    }
    return config;
  }

  // Load connections from settings
  function loadConnections() {
    const config = vscode.workspace.getConfiguration("firestoreExplorer");
    return (config.get<ConnectionConfig[]>("connections") ?? []).map(resolveConnection);
  }

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("firestoreExplorer.addConnection", async () => {
      const type = await vscode.window.showQuickPick(["emulator", "production"], {
        placeHolder: "Connection type",
      });
      if (!type) return;

      const name = await vscode.window.showInputBox({ prompt: "Connection name" });
      if (!name) return;

      let config: ConnectionConfig;

      if (type === "emulator") {
        const host = await vscode.window.showInputBox({
          prompt: "Emulator host",
          value: "localhost",
        });
        if (!host) return;
        const portStr = await vscode.window.showInputBox({
          prompt: "Emulator port",
          value: "8080",
        });
        if (!portStr) return;
        const projectId = await vscode.window.showInputBox({
          prompt: "Firebase project ID (leave empty for auto-generated)",
        });
        config = { name, type: "emulator", host, port: parseInt(portStr, 10), ...(projectId ? { projectId } : {}) };
      } else {
        const serviceAccountPath = await vscode.window.showInputBox({
          prompt: "Path to service account JSON",
        });
        if (!serviceAccountPath) return;
        config = { name, type: "production", serviceAccountPath };
      }

      // Save to settings
      const vsConfig = vscode.workspace.getConfiguration("firestoreExplorer");
      const connections = vsConfig.get<ConnectionConfig[]>("connections") ?? [];
      connections.push(config);
      await vsConfig.update("connections", connections, vscode.ConfigurationTarget.Workspace);

      // Auto-connect
      try {
        await connectionManager.connect(resolveConnection(config));
        vscode.window.showInformationMessage(`Connected to ${name}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Failed to connect to ${name}: ${msg}`);
      }

      connectionTreeProvider.refresh();
    }),

    vscode.commands.registerCommand("firestoreExplorer.connect", async (item: ConnectionTreeItem) => {
      try {
        await connectionManager.connect(resolveConnection(item.connectionState.config));
        vscode.window.showInformationMessage(`Connected to ${item.connectionState.config.name}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Connection failed: ${msg}`);
      }
      connectionTreeProvider.refresh();
    }),

    vscode.commands.registerCommand("firestoreExplorer.disconnect", async (item: ConnectionTreeItem) => {
      await connectionManager.disconnect(item.connectionState.config.name);
      connectionTreeProvider.refresh();
    }),

    vscode.commands.registerCommand("firestoreExplorer.removeConnection", async (item: ConnectionTreeItem) => {
      const name = item.connectionState.config.name;
      await connectionManager.remove(name);

      // Remove from settings
      const vsConfig = vscode.workspace.getConfiguration("firestoreExplorer");
      const connections = (vsConfig.get<ConnectionConfig[]>("connections") ?? []).filter(
        (c) => c.name !== name
      );
      await vsConfig.update("connections", connections, vscode.ConfigurationTarget.Workspace);

      connectionTreeProvider.refresh();
    }),

    vscode.commands.registerCommand(
      "firestoreExplorer.openCollection",
      (connectionName: string, collectionPath: string) => {
        new CollectionPanel(context, connectionManager, fsProvider, connectionName, collectionPath);
      }
    ),

    vscode.commands.registerCommand("firestoreExplorer.openQueryBuilder", async () => {
      const states = connectionManager.getAll().filter((s) => s.status === "connected");
      if (states.length === 0) {
        vscode.window.showWarningMessage("No connected databases. Connect first.");
        return;
      }
      let connectionName: string;
      if (states.length === 1) {
        connectionName = states[0].config.name;
      } else {
        const picked = await vscode.window.showQuickPick(
          states.map((s) => s.config.name),
          { placeHolder: "Select a connection" }
        );
        if (!picked) return;
        connectionName = picked;
      }
      new QueryBuilderPanel(context, connectionManager, connectionName, workspaceRoot);
    }),

    vscode.commands.registerCommand("firestoreExplorer.openSavedQuery", async (filePath: string) => {
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    }),

    vscode.commands.registerCommand("firestoreExplorer.refreshConnections", () => {
      connectionTreeProvider.refresh();
      savedQueriesProvider.refresh();
    })
  );

  // Auto-connect on activation
  const connections = loadConnections();
  for (const config of connections) {
    connectionManager.connect(config).catch(() => {
      // Silent fail on auto-connect — user can connect manually
    });
  }
  if (connections.length > 0) {
    // Refresh tree after connections attempt
    setTimeout(() => connectionTreeProvider.refresh(), 2000);
  }
}

export function deactivate() {
  if (connectionManager) {
    connectionManager.disconnectAll();
  }
}
