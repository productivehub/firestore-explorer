import React, { useState } from "react";

interface ColumnPickerProps {
  allColumns: string[];
  visibleColumns: string[];
  onToggle: (column: string) => void;
  onReorder: (columns: string[]) => void;
}

export function ColumnPicker({ allColumns, visibleColumns, onToggle }: ColumnPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="column-picker">
      <button onClick={() => setOpen(!open)} title="Configure columns">
        Columns
      </button>
      {open && (
        <div className="column-picker-dropdown">
          {allColumns.map((col) => (
            <label key={col} className="column-picker-item">
              <input
                type="checkbox"
                checked={visibleColumns.includes(col)}
                onChange={() => onToggle(col)}
              />
              {col}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
