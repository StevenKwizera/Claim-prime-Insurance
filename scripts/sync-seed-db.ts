import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seedClaims } from "../frontend/src/services/seedClaims.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, "..");
const dbPath = join(root, "backend", "database.json");
const db = JSON.parse(readFileSync(dbPath, "utf8")) as { claims: unknown[] };
db.claims = seedClaims;
writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
console.log(`Synced ${seedClaims.length} claims to backend/database.json`);
