import { describe, it, expect } from "vitest";
import { queryToJs, jsToQuery } from "../../src/services/queryParser";
import type { QueryDef } from "../../src/types";

describe("queryToJs", () => {
  it("converts a simple query to JS", () => {
    const query: QueryDef = {
      collection: "users",
      groups: [
        { type: "AND", clauses: [{ field: "age", operator: ">=", value: 18 }] },
      ],
      limit: 100,
    };
    const js = queryToJs(query);
    expect(js).toContain('db.collection("users")');
    expect(js).toContain('.where("age", ">=", 18)');
    expect(js).toContain(".limit(100)");
  });

  it("converts query with orderBy", () => {
    const query: QueryDef = {
      collection: "products",
      groups: [],
      orderBy: [{ field: "price", direction: "desc" }],
      limit: 50,
    };
    const js = queryToJs(query);
    expect(js).toContain('.orderBy("price", "desc")');
  });

  it("converts query with multiple where clauses", () => {
    const query: QueryDef = {
      collection: "users",
      groups: [
        {
          type: "AND",
          clauses: [
            { field: "age", operator: ">=", value: 18 },
            { field: "status", operator: "==", value: "active" },
          ],
        },
      ],
    };
    const js = queryToJs(query);
    expect(js).toContain('.where("age", ">=", 18)');
    expect(js).toContain('.where("status", "==", "active")');
  });

  it("converts query with string value", () => {
    const query: QueryDef = {
      collection: "users",
      groups: [
        { type: "AND", clauses: [{ field: "name", operator: "==", value: "Alice" }] },
      ],
    };
    const js = queryToJs(query);
    expect(js).toContain('.where("name", "==", "Alice")');
  });

  it("converts query with array value (in operator)", () => {
    const query: QueryDef = {
      collection: "users",
      groups: [
        { type: "AND", clauses: [{ field: "role", operator: "in", value: ["admin", "editor"] }] },
      ],
    };
    const js = queryToJs(query);
    expect(js).toContain('.where("role", "in", ["admin", "editor"])');
  });

  it("converts query with no clauses (collection only)", () => {
    const query: QueryDef = {
      collection: "users",
      groups: [],
      limit: 500,
    };
    const js = queryToJs(query);
    expect(js).toBe('db.collection("users")\n  .limit(500)');
  });
});

describe("jsToQuery", () => {
  it("parses a simple JS query", () => {
    const js = `db.collection("users")\n  .where("age", ">=", 18)\n  .limit(100)`;
    const query = jsToQuery(js);
    expect(query.collection).toBe("users");
    expect(query.groups[0].clauses[0]).toEqual({ field: "age", operator: ">=", value: 18 });
    expect(query.limit).toBe(100);
  });

  it("parses orderBy", () => {
    const js = `db.collection("products")\n  .orderBy("price", "desc")\n  .limit(50)`;
    const query = jsToQuery(js);
    expect(query.orderBy).toEqual([{ field: "price", direction: "desc" }]);
  });

  it("parses multiple where clauses", () => {
    const js = `db.collection("users")\n  .where("age", ">=", 18)\n  .where("status", "==", "active")`;
    const query = jsToQuery(js);
    expect(query.groups[0].clauses).toHaveLength(2);
  });

  it("parses string values correctly", () => {
    const js = `db.collection("users")\n  .where("name", "==", "Alice")`;
    const query = jsToQuery(js);
    expect(query.groups[0].clauses[0].value).toBe("Alice");
  });

  it("parses array values (in operator)", () => {
    const js = `db.collection("users")\n  .where("role", "in", ["admin", "editor"])`;
    const query = jsToQuery(js);
    expect(query.groups[0].clauses[0].value).toEqual(["admin", "editor"]);
  });

  it("roundtrips: query -> JS -> query", () => {
    const original: QueryDef = {
      collection: "users",
      groups: [
        {
          type: "AND",
          clauses: [
            { field: "age", operator: ">=", value: 18 },
            { field: "status", operator: "==", value: "active" },
          ],
        },
      ],
      orderBy: [{ field: "age", direction: "asc" }],
      limit: 100,
    };
    const js = queryToJs(original);
    const parsed = jsToQuery(js);
    expect(parsed.collection).toBe(original.collection);
    expect(parsed.groups[0].clauses).toEqual(original.groups[0].clauses);
    expect(parsed.orderBy).toEqual(original.orderBy);
    expect(parsed.limit).toBe(original.limit);
  });
});
