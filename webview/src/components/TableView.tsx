import React from "react";
import type { FirestoreDoc } from "../../../src/types";
import { ColumnPicker } from "./ColumnPicker";

interface TableViewProps {
  documents: FirestoreDoc[];
  visibleColumns: string[];
  allColumns: string[];
  onToggleColumn: (column: string) => void;
  onReorderColumns: (columns: string[]) => void;
  onOpenSubCollection: (docPath: string, subCollection: string) => void;
  onEditDocument: (docPath: string) => void;
  subCollections: Map<string, string[]>;
}

export function TableView({
  documents,
  visibleColumns,
  allColumns,
  onToggleColumn,
  onReorderColumns,
  onOpenSubCollection,
  onEditDocument,
  subCollections,
}: TableViewProps) {
  function renderCell(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return Array.isArray(value) ? `[${value.length}]` : "{...}";
    return String(value);
  }

  return (
    <div className="table-view">
      <div className="table-toolbar">
        <ColumnPicker
          allColumns={allColumns}
          visibleColumns={visibleColumns}
          onToggle={onToggleColumn}
          onReorder={onReorderColumns}
        />
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              {visibleColumns.map((col) => (
                <th key={col}>{col}</th>
              ))}
              <th>Sub-collections</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="doc-id" onClick={() => onEditDocument(doc.path)}>{doc.id}</td>
                {visibleColumns.map((col) => (
                  <td key={col} title={JSON.stringify(doc.data[col])}>
                    {renderCell(doc.data[col])}
                  </td>
                ))}
                <td>
                  {(subCollections.get(doc.path) ?? []).map((sub) => (
                    <button
                      key={sub}
                      className="sub-collection-badge"
                      onClick={() => onOpenSubCollection(doc.path, sub)}
                    >
                      {sub}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
