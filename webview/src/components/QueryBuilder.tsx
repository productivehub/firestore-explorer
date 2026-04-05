import React, { useState, useEffect, useCallback } from "react";
import { useVsCodeMessages } from "../hooks/useVsCodeMessages";
import { QueryCodeEditor } from "./QueryCodeEditor";
import type { QueryDef, QueryClause, HostToWebviewMessage, FirestoreDoc } from "../../../src/types";

interface QueryBuilderProps {
  connectionName: string;
}

const OPERATORS = ["==", "!=", "<", "<=", ">", ">=", "array-contains", "array-contains-any", "in", "not-in"] as const;

export function QueryBuilder({ connectionName }: QueryBuilderProps) {
  const [collection, setCollection] = useState("");
  const [clauses, setClauses] = useState<QueryClause[]>([]);
  const [orderByField, setOrderByField] = useState("");
  const [orderByDir, setOrderByDir] = useState<"asc" | "desc">("asc");
  const [limit, setLimit] = useState(500);
  const [jsCode, setJsCode] = useState("");
  const [results, setResults] = useState<FirestoreDoc[] | null>(null);
  const [collections, setCollections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncDirection, setSyncDirection] = useState<"visual" | "code">("visual");

  const onMessage = useCallback((msg: HostToWebviewMessage) => {
    switch (msg.type) {
      case "collections":
        setCollections(msg.collections);
        break;
      case "queryResult":
        setResults(msg.documents);
        setError(null);
        break;
      case "error":
        setError(msg.message);
        break;
    }
  }, []);

  const { postMessage } = useVsCodeMessages(onMessage);

  useEffect(() => {
    postMessage({
      type: "fetchDocuments",
      connectionName,
      collectionPath: "__list_collections__",
      limit: 0,
    });
  }, [connectionName, postMessage]);

  useEffect(() => {
    if (syncDirection !== "visual") return;
    if (collection) {
      const lines = [`db.collection("${collection}")`];
      for (const clause of clauses) {
        const val = typeof clause.value === "string" ? `"${clause.value}"` :
                    Array.isArray(clause.value) ? JSON.stringify(clause.value) :
                    String(clause.value);
        lines.push(`  .where("${clause.field}", "${clause.operator}", ${val})`);
      }
      if (orderByField) {
        lines.push(`  .orderBy("${orderByField}", "${orderByDir}")`);
      }
      lines.push(`  .limit(${limit})`);
      setJsCode(lines.join("\n"));
    }
  }, [collection, clauses, orderByField, orderByDir, limit, syncDirection]);

  function buildQueryDef(): QueryDef {
    return {
      collection,
      groups: clauses.length > 0 ? [{ type: "AND", clauses }] : [],
      ...(orderByField ? { orderBy: [{ field: orderByField, direction: orderByDir }] } : {}),
      limit,
    };
  }

  function handleCodeChange(code: string) {
    setSyncDirection("code");
    setJsCode(code);
    try {
      const collMatch = code.match(/\.collection\(["']([^"']+)["']\)/);
      if (collMatch) setCollection(collMatch[1]);

      const parsedClauses: QueryClause[] = [];
      const whereRegex = /\.where\(["']([^"']+)["'],\s*["']([^"']+)["'],\s*(.+?)\)/g;
      let m;
      while ((m = whereRegex.exec(code)) !== null) {
        let value: unknown = m[3].trim();
        if ((value as string).startsWith('"')) value = (value as string).slice(1, -1);
        else if ((value as string).startsWith("[")) {
          try { value = JSON.parse(value as string); } catch {}
        } else if (!isNaN(Number(value))) value = Number(value);
        parsedClauses.push({ field: m[1], operator: m[2] as QueryClause["operator"], value });
      }
      setClauses(parsedClauses);

      const orderMatch = code.match(/\.orderBy\(["']([^"']+)["'],\s*["'](asc|desc)["']\)/);
      if (orderMatch) {
        setOrderByField(orderMatch[1]);
        setOrderByDir(orderMatch[2] as "asc" | "desc");
      }

      const limitMatch = code.match(/\.limit\((\d+)\)/);
      if (limitMatch) setLimit(parseInt(limitMatch[1], 10));
    } catch {
      // Visual sync failed — that's fine, user is typing
    }
    setTimeout(() => setSyncDirection("visual"), 0);
  }

  function addClause() {
    setSyncDirection("visual");
    setClauses([...clauses, { field: "", operator: "==", value: "" }]);
  }

  function updateClause(index: number, updates: Partial<QueryClause>) {
    setSyncDirection("visual");
    setClauses(clauses.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  }

  function removeClause(index: number) {
    setSyncDirection("visual");
    setClauses(clauses.filter((_, i) => i !== index));
  }

  function handleRun() {
    if (!collection) {
      setError("Select a collection");
      return;
    }
    postMessage({ type: "runQuery", connectionName, query: buildQueryDef() });
  }

  function handleSave() {
    const name = prompt("Query name:");
    if (!name) return;
    postMessage({
      type: "saveQuery" as any,
      name,
      code: jsCode,
    } as any);
  }

  return (
    <div className="query-builder">
      <div className="query-builder-visual">
        <h3>Query Builder</h3>

        <div className="query-field">
          <label>Collection:</label>
          <input
            value={collection}
            onChange={(e) => { setSyncDirection("visual"); setCollection(e.target.value); }}
            placeholder="collection name"
            list="collections-list"
          />
          <datalist id="collections-list">
            {collections.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div className="query-clauses">
          <label>Where:</label>
          {clauses.map((clause, i) => (
            <div key={i} className="query-clause-row">
              <input
                placeholder="field"
                value={clause.field}
                onChange={(e) => updateClause(i, { field: e.target.value })}
              />
              <select
                value={clause.operator}
                onChange={(e) => updateClause(i, { operator: e.target.value as QueryClause["operator"] })}
              >
                {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
              </select>
              <input
                placeholder="value"
                value={String(clause.value)}
                onChange={(e) => {
                  let val: unknown = e.target.value;
                  if (!isNaN(Number(val)) && val !== "") val = Number(val);
                  updateClause(i, { value: val });
                }}
              />
              <button onClick={() => removeClause(i)}>x</button>
            </div>
          ))}
          <button onClick={addClause}>+ Add clause</button>
        </div>

        <div className="query-field">
          <label>Order by:</label>
          <input
            placeholder="field"
            value={orderByField}
            onChange={(e) => { setSyncDirection("visual"); setOrderByField(e.target.value); }}
          />
          <select
            value={orderByDir}
            onChange={(e) => { setSyncDirection("visual"); setOrderByDir(e.target.value as "asc" | "desc"); }}
          >
            <option value="asc">asc</option>
            <option value="desc">desc</option>
          </select>
        </div>

        <div className="query-field">
          <label>Limit:</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => { setSyncDirection("visual"); setLimit(Number(e.target.value) || 500); }}
            min={1}
          />
        </div>

        <div className="query-actions">
          <button onClick={handleRun}>Run</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>

      <div className="query-builder-code">
        <h3>JavaScript</h3>
        <QueryCodeEditor value={jsCode} onChange={handleCodeChange} />
      </div>

      {error && <div className="query-error">{error}</div>}

      {results && (
        <div className="query-results">
          <h3>Results ({results.length} documents)</h3>
          <pre className="json-view">{JSON.stringify(results.map(d => ({ _id: d.id, ...d.data })), null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
