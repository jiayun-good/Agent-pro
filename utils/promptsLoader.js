import fs from "fs";
import { promptsConfExport } from "./configHandler.js";
import { getAbsPath } from "./pathTool.js";
import { logger } from "./loggerHandler.js";

// 通用读取函数（避免重复代码）
function loadPrompt(key, errorMsg) {
  let filePath;

  try {
    filePath = getAbsPath(promptsConfExport[key]);
  } catch (e) {
    logger.error(`${errorMsg} 配置缺失`);
    throw e;
  }

  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (e) {
    logger.error(`${errorMsg} 读取失败: ${e.message}`);
    throw e;
  }
}

// 读取 3个prompt文件
export function loadSystemPrompts() {
  return loadPrompt("main_prompt_path", "[loadSystemPrompts]");
}

export function loadRagPrompts() {
  return loadPrompt("rag_summarize_prompt_path", "[loadRagPrompts]");
}

export function loadReportPrompts() {
  return loadPrompt("report_prompt_path", "[loadReportPrompts]");
}