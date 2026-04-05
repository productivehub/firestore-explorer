# Plan: Document View with Tabs + Table Ellipsis

## Status

| # | File | Status |
|---|------|--------|
| 1 | `webview/src/styles/index.css` | PARTIAL - truncation + clickable ID done. Missing: document tabs, kv-table, subcollections CSS |
| 2 | `webview/src/components/TableView.tsx` | DONE |
| 3 | `webview/src/components/DocumentEditor.tsx` | NOT DONE |
| 4 | `src/panels/documentEditorPanel.ts` | NOT DONE |

## 1. CSS - `webview/src/styles/index.css`

### Already applied:
- `table td` has `max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
- `.doc-id` has `cursor: pointer; text-decoration: underline;` + hover state

### Still needed - append these new classes:

```css
/* Document Tabs */
.document-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--vscode-widget-border);
}
.document-tab {
  background: none;
  color: var(--vscode-foreground);
  border: none;
  border-bottom: 2px solid transparent;
  padding: 6px 16px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0.7;
}
.document-tab:hover {
  opacity: 1;
  background: none;
}
.document-tab.active {
  opacity: 1;
  border-bottom-color: var(--vscode-focusBorder);
  background: none;
}
.document-tab-content {
  flex: 1;
  overflow: auto;
}
.document-save-indicator {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--vscode-testing-iconPassed);
  animation: fadeOut 3s forwards;
}
@keyframes fadeOut {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

/* Key/Value View */
.kv-table {
  width: 100%;
  border-collapse: collapse;
}
.kv-table th {
  text-align: left;
  padding: 6px 12px;
  font-weight: 600;
  background: var(--vscode-editor-background);
  position: sticky;
  top: 0;
}
.kv-table td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--vscode-widget-border);
  max-width: none;
  white-space: normal;
  overflow: visible;
}
.kv-key {
  font-family: var(--vscode-editor-font-family);
  font-weight: 600;
  color: var(--vscode-symbolIcon-propertyForeground, #9cdcfe);
  width: 200px;
  vertical-align: top;
}
.kv-value {
  font-family: var(--vscode-editor-font-family);
  word-break: break-all;
}
.kv-type {
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
  width: 80px;
  vertical-align: top;
}

/* Subcollections list in doc editor */
.subcollections-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.subcollection-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--vscode-list-hoverBackground);
  border: 1px solid var(--vscode-widget-border);
  cursor: pointer;
  font-family: var(--vscode-editor-font-family);
  font-size: 13px;
  color: var(--vscode-textLink-foreground);
  text-align: left;
}
.subcollection-item:hover {
  background: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground);
}
.subcollections-empty {
  padding: 16px;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
}
```

## 2. TableView.tsx - `webview/src/components/TableView.tsx` — DONE

Changes made:
- Doc ID is now clickable via `onClick={() => onEditDocument(doc.path)}`
- Removed the Edit button `<td>` and its `<th>`

## 3. DocumentEditor.tsx - `webview/src/components/DocumentEditor.tsx` — FULL REWRITE

Replace entire file with:

```tsx
import React, { useState, useEffect, useCallback } from "react";
import { useVsCodeMessages } from "../hooks/useVsCodeMessages";
import type { FirestoreDoc, HostToWebviewMessage } from "../../../src/types";

interface DocumentEditorProps {
  connectionName: string;
  docPath: string;
}

type TabType = "keyvalue" | "json" | "subcollections";

function getValueType(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function renderValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function DocumentEditor({ connectionName, docPath }: DocumentEditorProps) {
  const [document, setDocument] = useState<FirestoreDoc | null>(null);
  const [originalJson, setOriginalJson] = useState("");
  const [editedJson, setEditedJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("keyvalue");
  const [subCollections, setSubCollections] = useState<string[]>([]);

  const onMessage = useCallback((msg: HostToWebviewMessage) => {
    switch (msg.type) {
      case "loadDocument": {
        setDocument(msg.document);
        const json = JSON.stringify(msg.document.data, null, 2);
        setOriginalJson(json);
        setEditedJson(json);
        setDirty(false);
        break;
      }
      case "saveResult": {
        setSaving(false);
        if (msg.success) {
          setOriginalJson(editedJson);
          setDirty(false);
          setError(null);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } else {
          setError(msg.error ?? "Save failed");
        }
        break;
      }
      case "collections": {
        setSubCollections(msg.collections);
        break;
      }
      case "error": {
        setError(msg.message);
        setSaving(false);
        break;
      }
    }
  }, [editedJson]);

  const { postMessage } = useVsCodeMessages(onMessage);

  useEffect(() => {
    postMessage({ type: "openDocument", connectionName, docPath });
    postMessage({ type: "fetchSubCollections", connectionName, docPath });
  }, [connectionName, docPath, postMessage]);

  function handleSave() {
    try {
      const parsed = JSON.parse(editedJson);
      setError(null);
      setSaving(true);
      postMessage({ type: "saveDocument", connectionName, docPath, data: parsed });
    } catch (e) {
      setError("Invalid JSON: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  function handleChange(value: string) {
    setEditedJson(value);
    setDirty(value !== originalJson);
    setError(null);
  }

  function handleRevert() {
    setEditedJson(originalJson);
    setDirty(false);
    setError(null);
  }

  function handleOpenSubCollection(sub: string) {
    postMessage({ type: "navigateSubCollection", connectionName, collectionPath: `${docPath}/${sub}` });
  }

  return (
    <div className="document-editor">
      <div className="document-editor-header">
        <span className="document-path">{docPath}</span>
        <div className="document-editor-actions">
          {saved && <span className="document-save-indicator">Saved!</span>}
          {activeTab === "json" && (
            <>
              <button onClick={handleRevert} disabled={!dirty}>Revert</button>
              <button onClick={handleSave} disabled={!dirty || saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="document-tabs">
        <button className={`document-tab ${activeTab === "keyvalue" ? "active" : ""}`} onClick={() => setActiveTab("keyvalue")}>
          Key / Value
        </button>
        <button className={`document-tab ${activeTab === "json" ? "active" : ""}`} onClick={() => setActiveTab("json")}>
          JSON
        </button>
        <button className={`document-tab ${activeTab === "subcollections" ? "active" : ""}`} onClick={() => setActiveTab("subcollections")}>
          Subcollections{subCollections.length > 0 ? ` (${subCollections.length})` : ""}
        </button>
      </div>

      {error && <div className="document-editor-error">{error}</div>}

      <div className="document-tab-content">
        {activeTab === "keyvalue" && document && (
          <table className="kv-table">
            <thead>
              <tr><th>Key</th><th>Type</th><th>Value</th></tr>
            </thead>
            <tbody>
              {Object.entries(document.data).map(([key, value]) => (
                <tr key={key}>
                  <td className="kv-key">{key}</td>
                  <td className="kv-type">{getValueType(value)}</td>
                  <td className="kv-value">
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{renderValue(value)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "json" && (
          <textarea
            className="document-editor-textarea"
            value={editedJson}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
          />
        )}

        {activeTab === "subcollections" && (
          <div className="subcollections-list">
            {subCollections.length === 0 ? (
              <div className="subcollections-empty">No subcollections found</div>
            ) : (
              subCollections.map((sub) => (
                <button key={sub} className="subcollection-item" onClick={() => handleOpenSubCollection(sub)}>
                  {sub}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

## 4. DocumentEditorPanel.ts - `src/panels/documentEditorPanel.ts`

Add two new cases to `handleMessage` switch:

```typescript
case "fetchSubCollections": {
  const db = this.connectionManager.getFirestore(msg.connectionName);
  const svc = new FirestoreService(db);
  const collections = await svc.listSubCollections(msg.docPath);
  this.panel.webview.postMessage({ type: "collections", collections });
  break;
}
case "navigateSubCollection": {
  new (await import("./collectionPanel")).CollectionPanel(
    this.context,
    this.connectionManager,
    msg.connectionName,
    msg.collectionPath
  );
  break;
}
```

## 5. Types - `src/types.ts` — NO CHANGES NEEDED

All message types already exist.
