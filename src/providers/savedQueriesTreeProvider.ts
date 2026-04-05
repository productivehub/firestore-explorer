import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class SavedQueriesTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    if (!this.workspaceRoot) return [];

    const queriesDir = path.join(this.workspaceRoot, ".firestore", "queries");
    if (!fs.existsSync(queriesDir)) return [];

    const files = fs.readdirSync(queriesDir).filter((f) => f.endsWith(".js"));
    return files.map((file) => {
      const item = new vscode.TreeItem(
        file.replace(".js", ""),
        vscode.TreeItemCollapsibleState.None
      );
      item.iconPath = new vscode.ThemeIcon("search");
      item.command = {
        command: "firestoreExplorer.openSavedQuery",
        title: "Open Query",
        arguments: [path.join(queriesDir, file)],
      };
      item.contextValue = "savedQuery";
      return item;
    });
  }
}
