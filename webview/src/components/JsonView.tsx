import React from "react";
import type { FirestoreDoc } from "../../../src/types";

interface JsonViewProps {
  documents: FirestoreDoc[];
}

export function JsonView({ documents }: JsonViewProps) {
  const json = documents.map((doc) => ({
    _id: doc.id,
    _path: doc.path,
    ...doc.data,
  }));

  return (
    <pre className="json-view">
      {JSON.stringify(json, null, 2)}
    </pre>
  );
}
