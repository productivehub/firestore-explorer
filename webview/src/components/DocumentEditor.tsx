import React, { useState, useEffect, useCallback } from "react";
import { useVsCodeMessages } from "../hooks/useVsCodeMessages";
import type { FirestoreDoc, HostToWebviewMessage } from "../../../src/types";

interface DocumentEditorProps {
  connectionName: string;
  docPath: string;
}

export function DocumentEditor({ connectionName, docPath }: DocumentEditorProps) {
  const [originalJson, setOriginalJson] = useState("");
  const [editedJson, setEditedJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const onMessage = useCallback((msg: HostToWebviewMessage) => {
    switch (msg.type) {
      case "loadDocument": {
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
        } else {
          setError(msg.error ?? "Save failed");
        }
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
  }, [connectionName, docPath, postMessage]);

  function handleSave() {
    try {
      const parsed = JSON.parse(editedJson);
      setError(null);
      setSaving(true);
      postMessage({
        type: "saveDocument",
        connectionName,
        docPath,
        data: parsed,
      });
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

  return (
    <div className="document-editor">
      <div className="document-editor-header">
        <span className="document-path">{docPath}</span>
        <div className="document-editor-actions">
          <button onClick={handleRevert} disabled={!dirty}>
            Revert
          </button>
          <button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {error && <div className="document-editor-error">{error}</div>}
      <textarea
        className="document-editor-textarea"
        value={editedJson}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
