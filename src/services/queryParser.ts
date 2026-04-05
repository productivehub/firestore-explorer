import type { QueryDef, QueryClause, QueryGroup } from "../types";

export function queryToJs(query: QueryDef): string {
  const lines: string[] = [`db.collection("${query.collection}")`];

  for (const group of query.groups) {
    for (const clause of group.clauses) {
      lines.push(`  .where("${clause.field}", "${clause.operator}", ${formatValue(clause.value)})`);
    }
  }

  if (query.orderBy) {
    for (const order of query.orderBy) {
      lines.push(`  .orderBy("${order.field}", "${order.direction}")`);
    }
  }

  if (query.limit !== undefined) {
    lines.push(`  .limit(${query.limit})`);
  }

  return lines.join("\n");
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(", ")}]`;
  }
  return String(value);
}

export function jsToQuery(js: string): QueryDef {
  const collectionMatch = js.match(/\.collection\(["']([^"']+)["']\)/);
  if (!collectionMatch) {
    throw new Error("Could not parse collection name");
  }
  const collection = collectionMatch[1];

  const clauses: QueryClause[] = [];
  const whereRegex = /\.where\(["']([^"']+)["'],\s*["']([^"']+)["'],\s*(.+?)\)/g;
  let match;
  while ((match = whereRegex.exec(js)) !== null) {
    clauses.push({
      field: match[1],
      operator: match[2] as QueryClause["operator"],
      value: parseValue(match[3].trim()),
    });
  }

  const groups: QueryGroup[] = [];
  if (clauses.length > 0) {
    groups.push({ type: "AND", clauses });
  }

  const orderBy: { field: string; direction: "asc" | "desc" }[] = [];
  while ((match = /\.orderBy\(["']([^"']+)["'],\s*["'](asc|desc)["']\)/g.exec(js)) !== null) {
    orderBy.push({ field: match[1], direction: match[2] as "asc" | "desc" });
    break;
  }

  const limitMatch = js.match(/\.limit\((\d+)\)/);
  const limit = limitMatch ? parseInt(limitMatch[1], 10) : undefined;

  return {
    collection,
    groups,
    ...(orderBy.length > 0 ? { orderBy } : {}),
    ...(limit !== undefined ? { limit } : {}),
  };
}

function parseValue(raw: string): unknown {
  // Array value: ["a", "b"]
  if (raw.startsWith("[")) {
    try {
      return JSON.parse(raw);
    } catch {
      // Try to parse manually
      const inner = raw.slice(1, -1);
      return inner.split(",").map((s) => parseValue(s.trim()));
    }
  }

  // String value: "foo" or 'foo'
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }

  // Boolean
  if (raw === "true") return true;
  if (raw === "false") return false;

  // Null
  if (raw === "null") return null;

  // Number
  const num = Number(raw);
  if (!isNaN(num)) return num;

  return raw;
}
