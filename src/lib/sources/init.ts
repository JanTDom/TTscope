import { dbRepo } from "../db";
import { SOURCES_REGISTRY } from "./registry";

export function initSourcesRegistry() {
  for (const item of SOURCES_REGISTRY) {
    dbRepo.upsertSource(item.source);
    dbRepo.upsertSourceConnector({
      ...item.connector,
      source_id: item.source.id,
    });
  }
}
