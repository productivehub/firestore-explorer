import * as vscode from "vscode";
import type { ConnectionManager } from "../services/connectionManager";
import type { ConnectionState } from "../types";

export class ConnectionTreeItem extends vscode.TreeItem {
  constructor(
    public readonly connectionState: ConnectionState,
  ) {
    const isConnected = connectionState.status === "connected";
    super(
      connectionState.config.name,
      isConnected
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );

    this.contextValue = `connection-${connectionState.status}`;

    if (connectionState.config.type === "emulator") {
      this.description = `${connectionState.config.host}:${connectionState.config.port}`;
    } else {
      this.description = connectionState.status;
    }

    this.iconPath = new vscode.ThemeIcon(
      isConnected ? "database" : "debug-disconnect"
    );
  }
}

export class CollectionTreeItem extends vscode.TreeItem {
  constructor(
    public readonly collectionName: string,
    public readonly connectionName: string,
    public readonly collectionPath: string,
  ) {
    super(collectionName, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "collection";
    this.iconPath = new vscode.ThemeIcon("folder");
    this.command = {
      command: "firestoreExplorer.openCollection",
      title: "Open Collection",
      arguments: [connectionName, collectionPath],
    };
  }
}

export class ConnectionTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private connectionManager: ConnectionManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!element) {
      // Root level: show connections
      return this.connectionManager
        .getAll()
        .map((state) => new ConnectionTreeItem(state));
    }

    if (element instanceof ConnectionTreeItem) {
      const { connectionState } = element;
      if (connectionState.status !== "connected") {
        return [];
      }

      try {
        const db = this.connectionManager.getFirestore(connectionState.config.name);
        const collections = await db.listCollections();
        return collections.map(
          (col) =>
            new CollectionTreeItem(
              col.id,
              connectionState.config.name,
              col.id
            )
        );
      } catch {
        return [];
      }
    }

    return [];
  }
}
