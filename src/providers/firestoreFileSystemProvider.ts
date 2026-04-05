import * as vscode from "vscode";
import type { ConnectionManager } from "../services/connectionManager";
import { FirestoreService } from "../services/firestoreService";

/**
 * Provides a `firestore:` virtual file system so Firestore documents can be
 * opened in VS Code's native JSON editor.
 *
 * URI format: firestore:/<connectionName>/<document/path>.json
 */
export class FirestoreFileSystemProvider implements vscode.FileSystemProvider {
  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile = this._emitter.event;

  /** In-memory content cache keyed by URI toString() */
  private contents = new Map<string, Uint8Array>();

  constructor(private connectionManager: ConnectionManager) {}

  // --- Required interface methods ---

  watch(): vscode.Disposable {
    return new vscode.Disposable(() => {});
  }

  stat(uri: vscode.Uri): vscode.FileStat {
    return {
      type: vscode.FileType.File,
      ctime: 0,
      mtime: Date.now(),
      size: this.contents.get(uri.toString())?.length ?? 0,
    };
  }

  readDirectory(): [string, vscode.FileType][] {
    return [];
  }

  createDirectory(): void {}
  delete(): void {}
  rename(): void {}

  readFile(uri: vscode.Uri): Uint8Array {
    const data = this.contents.get(uri.toString());
    if (!data) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    return data;
  }

  writeFile(uri: vscode.Uri, content: Uint8Array): void {
    this.contents.set(uri.toString(), content);
    this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
  }

  // --- Helpers ---

  /** Parse a firestore: URI into connection name and document path. */
  static parseUri(uri: vscode.Uri): { connectionName: string; docPath: string } {
    // path: /<connectionName>/<doc/path>.json
    const raw = uri.path.startsWith("/") ? uri.path.slice(1) : uri.path;
    const stripped = raw.endsWith(".json") ? raw.slice(0, -5) : raw;
    const slashIdx = stripped.indexOf("/");
    return {
      connectionName: stripped.slice(0, slashIdx),
      docPath: stripped.slice(slashIdx + 1),
    };
  }

  static buildUri(connectionName: string, docPath: string): vscode.Uri {
    return vscode.Uri.parse(`firestore:/${connectionName}/${docPath}.json`);
  }

  /** Load a Firestore document into the virtual FS and return its URI. */
  async loadDocument(connectionName: string, docPath: string) {
    const db = this.connectionManager.getFirestore(connectionName);
    const svc = new FirestoreService(db);
    const doc = await svc.getDocument(docPath);

    const uri = FirestoreFileSystemProvider.buildUri(connectionName, docPath);
    const json = JSON.stringify(doc.data, null, 2) + "\n";
    this.contents.set(uri.toString(), Buffer.from(json, "utf-8"));

    return { uri, doc };
  }

  /** Save the current content of a virtual document back to Firestore. */
  async saveToFirestore(uri: vscode.Uri): Promise<void> {
    const { connectionName, docPath } = FirestoreFileSystemProvider.parseUri(uri);
    const content = this.contents.get(uri.toString());
    if (!content) {
      throw new Error("No content for document");
    }

    const data = JSON.parse(Buffer.from(content).toString("utf-8"));
    const db = this.connectionManager.getFirestore(connectionName);
    const svc = new FirestoreService(db);
    await svc.saveDocument(docPath, data);
  }
}
