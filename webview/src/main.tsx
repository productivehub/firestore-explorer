import React from "react";
import ReactDOM from "react-dom/client";
import { CollectionView } from "./components/CollectionView";
import { DocumentEditor } from "./components/DocumentEditor";
import { QueryBuilder } from "./components/QueryBuilder";
import "./styles/index.css";

declare global {
  interface Window {
    __PANEL_TYPE__: "collection" | "document" | "queryBuilder";
    __INITIAL_DATA__: Record<string, unknown>;
  }
}

function App() {
  const panelType = window.__PANEL_TYPE__ ?? "collection";
  const data = window.__INITIAL_DATA__ ?? {};

  switch (panelType) {
    case "collection":
      return (
        <CollectionView
          connectionName={data.connectionName as string}
          initialCollectionPath={data.collectionPath as string}
        />
      );
    case "document":
      return (
        <DocumentEditor
          connectionName={data.connectionName as string}
          docPath={data.docPath as string}
        />
      );
    case "queryBuilder":
      return <QueryBuilder connectionName={data.connectionName as string} />;
    default:
      return <div>Unknown panel type</div>;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
