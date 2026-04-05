import React from "react";

interface QueryCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function QueryCodeEditor({ value, onChange }: QueryCodeEditorProps) {
  return (
    <textarea
      className="query-code-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      placeholder={'db.collection("collectionName")\n  .where("field", "==", value)\n  .limit(500)'}
    />
  );
}
