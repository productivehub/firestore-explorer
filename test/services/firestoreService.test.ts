import { describe, it, expect, vi, beforeEach } from "vitest";
import { FirestoreService } from "../../src/services/firestoreService";
import type { QueryDef } from "../../src/types";

function createMockFirestore() {
  const mockDocs = [
    { id: "doc1", ref: { path: "users/doc1" }, data: () => ({ name: "Alice", age: 30 }) },
    { id: "doc2", ref: { path: "users/doc2" }, data: () => ({ name: "Bob", age: 25 }) },
  ];
  const mockSnapshot = { docs: mockDocs, empty: false };

  const mockQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    startAfter: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(mockSnapshot),
  };

  const mockDocRef = {
    get: vi.fn().mockResolvedValue({
      exists: true,
      id: "doc1",
      ref: { path: "users/doc1" },
      data: () => ({ name: "Alice", age: 30 }),
    }),
    set: vi.fn().mockResolvedValue(undefined),
    listCollections: vi.fn().mockResolvedValue([
      { id: "orders" },
      { id: "reviews" },
    ]),
  };

  const mockCollection = {
    ...mockQuery,
    doc: vi.fn().mockReturnValue(mockDocRef),
  };

  const db = {
    collection: vi.fn().mockReturnValue(mockCollection),
    listCollections: vi.fn().mockResolvedValue([
      { id: "users" },
      { id: "products" },
    ]),
  };

  return { db, mockCollection, mockDocRef, mockQuery, mockDocs };
}

describe("FirestoreService", () => {
  let service: FirestoreService;
  let mock: ReturnType<typeof createMockFirestore>;

  beforeEach(() => {
    mock = createMockFirestore();
    service = new FirestoreService(mock.db as any);
  });

  it("lists root collections", async () => {
    const collections = await service.listCollections();
    expect(collections).toEqual(["users", "products"]);
  });

  it("fetches documents from a collection with limit", async () => {
    const result = await service.getDocuments("users", 500);
    expect(mock.db.collection).toHaveBeenCalledWith("users");
    expect(mock.mockCollection.limit).toHaveBeenCalledWith(500);
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].id).toBe("doc1");
    expect(result.documents[0].data).toEqual({ name: "Alice", age: 30 });
  });

  it("fetches documents with cursor for pagination", async () => {
    const result = await service.getDocuments("users", 500, "doc1");
    expect(mock.mockCollection.startAfter).toHaveBeenCalled();
  });

  it("gets a single document", async () => {
    const doc = await service.getDocument("users/doc1");
    expect(doc.id).toBe("doc1");
    expect(doc.data).toEqual({ name: "Alice", age: 30 });
  });

  it("saves a document", async () => {
    const data = { name: "Charlie", age: 35 };
    await service.saveDocument("users/doc1", data);
    expect(mock.mockDocRef.set).toHaveBeenCalledWith(data, { merge: false });
  });

  it("lists sub-collections of a document", async () => {
    const subs = await service.listSubCollections("users/doc1");
    expect(subs).toEqual(["orders", "reviews"]);
  });

  it("executes a query", async () => {
    const query: QueryDef = {
      collection: "users",
      groups: [
        { type: "AND", clauses: [{ field: "age", operator: ">=", value: 18 }] },
      ],
      orderBy: [{ field: "age", direction: "asc" }],
      limit: 100,
    };
    const result = await service.executeQuery(query);
    expect(mock.mockCollection.where).toHaveBeenCalledWith("age", ">=", 18);
    expect(mock.mockCollection.orderBy).toHaveBeenCalledWith("age", "asc");
    expect(mock.mockCollection.limit).toHaveBeenCalledWith(100);
    expect(result.documents).toHaveLength(2);
  });
});
