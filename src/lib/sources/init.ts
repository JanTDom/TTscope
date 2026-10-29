import { dbRepo } from "../db";
import { SOURCES_REGISTRY } from "./registry";

export async function initSourcesRegistry() {
  for (const item of SOURCES_REGISTRY) {
    await dbRepo.upsertSource(item.source);
    await dbRepo.upsertSourceConnector({
      ...item.connector,
      source_id: item.source.id,
    });
  }
}
