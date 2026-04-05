import React, { useState, useCallback } from "react";
import type { FirestoreDoc } from "../../../src/types";

interface JsonViewProps {
  documents: FirestoreDoc[];
}

export function JsonView({ documents }: JsonViewProps) {
  return (
    <div className="json-view">
      {documents.map((doc) => (
        <div key={doc.id} className="json-doc">
          <div className="json-doc-header">
            <span className="json-doc-id">{doc.id}</span>
            <span className="json-doc-path">{doc.path}</span>
          </div>
          <JsonNode value={doc.data} depth={0} />
        </div>
      ))}
    </div>
  );
}

function JsonNode({ value, depth }: { value: unknown; depth: number }) {
  if (value === null) return <span className="json-null">null</span>;
  if (value === undefined) return <span className="json-null">undefined</span>;

  switch (typeof value) {
    case "string":
      return <span className="json-string">"{value}"</span>;
    case "number":
      return <span className="json-number">{String(value)}</span>;
    case "boolean":
      return <span className="json-boolean">{String(value)}</span>;
    case "object":
      if (Array.isArray(value)) {
        return <JsonArray items={value} depth={depth} />;
      }
      return <JsonObject obj={value as Record<string, unknown>} depth={depth} />;
    default:
      return <span>{String(value)}</span>;
  }
}

function JsonObject({ obj, depth }: { obj: Record<string, unknown>; depth: number }) {
  const keys = Object.keys(obj);
  const [collapsed, setCollapsed] = useState(depth > 2);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  if (keys.length === 0) {
    return <span className="json-bracket">{"{}"}</span>;
  }

  if (collapsed) {
    return (
      <span className="json-collapsed" onClick={toggle} role="button" tabIndex={0}>
        <span className="json-toggle-arrow-inline">▶</span>
        <span className="json-bracket">{"{"}</span>
        <span className="json-collapsed-hint">{keys.length} {keys.length === 1 ? "key" : "keys"}</span>
        <span className="json-bracket">{"}"}</span>
      </span>
    );
  }

  return (
    <span>
      <span className="json-bracket">{"{"}</span>
      <div className="json-indent">
        <button className="json-indent-toggle" onClick={toggle} aria-label="Collapse">
          <span className="json-toggle-arrow">▼</span>
          <span className="json-indent-line" />
        </button>
        <div className="json-indent-content">
          {keys.map((key, i) => (
            <div className="json-line" key={key}>
              <span className="json-key">"{key}"</span>
              <span className="json-colon">: </span>
              <JsonNode value={obj[key]} depth={depth + 1} />
              {i < keys.length - 1 && <span className="json-comma">,</span>}
            </div>
          ))}
        </div>
      </div>
      <span className="json-bracket">{"}"}</span>
    </span>
  );
}

function JsonArray({ items, depth }: { items: unknown[]; depth: number }) {
  const [collapsed, setCollapsed] = useState(depth > 2);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  if (items.length === 0) {
    return <span className="json-bracket">[]</span>;
  }

  if (collapsed) {
    return (
      <span className="json-collapsed" onClick={toggle} role="button" tabIndex={0}>
        <span className="json-toggle-arrow-inline">▶</span>
        <span className="json-bracket">[</span>
        <span className="json-collapsed-hint">{items.length} {items.length === 1 ? "item" : "items"}</span>
        <span className="json-bracket">]</span>
      </span>
    );
  }

  return (
    <span>
      <span className="json-bracket">[</span>
      <div className="json-indent">
        <button className="json-indent-toggle" onClick={toggle} aria-label="Collapse">
          <span className="json-toggle-arrow">▼</span>
          <span className="json-indent-line" />
        </button>
        <div className="json-indent-content">
          {items.map((item, i) => (
            <div className="json-line" key={i}>
              <span className="json-array-index">{i}</span>
              <JsonNode value={item} depth={depth + 1} />
              {i < items.length - 1 && <span className="json-comma">,</span>}
            </div>
          ))}
        </div>
      </div>
      <span className="json-bracket">]</span>
    </span>
  );
}
