import * as admin from "firebase-admin";
import type { ConnectionConfig, ConnectionState } from "../types";

export class ConnectionManager {
  private states: Map<string, ConnectionState> = new Map();
  private apps: Map<string, admin.app.App> = new Map();

  getAll(): ConnectionState[] {
    return Array.from(this.states.values());
  }

  getState(name: string): ConnectionState | undefined {
    return this.states.get(name);
  }

  async connect(config: ConnectionConfig): Promise<void> {
    // Disconnect existing if reconnecting
    if (this.apps.has(config.name)) {
      await this.disconnect(config.name);
    }

    let app: admin.app.App;

    if (config.type === "emulator") {
      process.env["FIRESTORE_EMULATOR_HOST"] = `${config.host}:${config.port}`;
      const projectId = config.projectId ?? `emulator-${config.name}`;
      app = admin.initializeApp({ projectId }, config.name);
    } else {
      // Remove emulator env if set, so production connects to real Firestore
      delete process.env["FIRESTORE_EMULATOR_HOST"];
      const credential = admin.credential.cert(config.serviceAccountPath);
      app = admin.initializeApp({ credential }, config.name);
    }

    // Verify connectivity by listing collections
    try {
      await app.firestore().listCollections();
      this.apps.set(config.name, app);
      this.states.set(config.name, { config, status: "connected" });
    } catch (err) {
      await app.delete();
      const message = err instanceof Error ? err.message : String(err);
      this.states.set(config.name, { config, status: "error", error: message });
      throw err;
    }
  }

  async disconnect(name: string): Promise<void> {
    const app = this.apps.get(name);
    if (app) {
      await app.delete();
      this.apps.delete(name);
    }
    const state = this.states.get(name);
    if (state) {
      this.states.set(name, { ...state, status: "disconnected", error: undefined });
    }
  }

  async remove(name: string): Promise<void> {
    await this.disconnect(name);
    this.states.delete(name);
  }

  getFirestore(name: string): admin.firestore.Firestore {
    const app = this.apps.get(name);
    if (!app) {
      throw new Error(`No connected Firestore for "${name}"`);
    }
    return app.firestore();
  }

  async disconnectAll(): Promise<void> {
    for (const name of this.apps.keys()) {
      await this.disconnect(name);
    }
  }
}
