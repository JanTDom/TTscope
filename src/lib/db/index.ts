import { dbRepo, getSqliteDb } from "./sqlite";

export function getDb() {
  return getSqliteDb();
}

export { dbRepo };
export * from "./types";
