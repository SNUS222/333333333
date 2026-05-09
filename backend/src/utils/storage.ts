import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

export const uploadDir = path.resolve(env.UPLOAD_DIR);
export const generatedDir = path.resolve(env.GENERATED_DIR);

export function ensureStorage(): void {
  for (const dir of [uploadDir, generatedDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
