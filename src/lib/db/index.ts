import { postgresRepo } from "./postgres";

export const dbRepo = postgresRepo;

export function getDb() {
  return null;
}

export * from "./types";
