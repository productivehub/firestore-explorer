import React from "react";

interface BreadcrumbProps {
  segments: { label: string; path: string }[];
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ segments, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb">
      {segments.map((seg, i) => (
        <span key={seg.path}>
          {i > 0 && <span className="breadcrumb-separator"> &gt; </span>}
          {i < segments.length - 1 ? (
            <button
              className="breadcrumb-link"
              onClick={() => onNavigate(seg.path)}
            >
              {seg.label}
            </button>
          ) : (
            <span className="breadcrumb-current">{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
