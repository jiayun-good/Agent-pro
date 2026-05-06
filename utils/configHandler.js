import fs from 'fs'
import yaml from 'js-yaml'
import { getAbsPath } from './pathTool.js' // 你的路径工具

// Helper function to load YAML config
function loadConfig(configPath = 'config/default.yml', encoding = 'utf8') {
  try {
    const absPath = getAbsPath(configPath)   // ✅ 关键：转绝对路径
    const fileContents = fs.readFileSync(absPath, encoding);
    return yaml.load(fileContents);
  } catch (e) {
    console.error(`Error loading config from ${configPath}:`, e);
    return null;
  }
}

// Example configuration files
const ragConf = loadConfig('config/rag.yml');
const chromaConf = loadConfig('config/chroma.yml');
const promptsConf = loadConfig('config/prompts.yml');
const agentConf = loadConfig('config/agent.yml');

const promptsConfExport = {
  main_prompt_path: getAbsPath('prompts/main_prompt.txt'),   // ✅ 这里也建议统一
  rag_summarize_prompt_path: getAbsPath('prompts/rag_summarize.txt'),
  report_prompt_path: getAbsPath('prompts/report_prompt.txt'),
};

export {
  ragConf,
  chromaConf,
  promptsConf,
  agentConf,
  promptsConfExport
}