import path from "path";
import { fileURLToPath } from "url";

// ESM下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录（往上一级）
const rootDir = path.resolve(__dirname, "..");

export function getAbsPath(relativePath) {
  return path.resolve(rootDir, relativePath);
}