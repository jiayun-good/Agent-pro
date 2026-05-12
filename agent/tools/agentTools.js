// agentTools.js
import { tool } from "langchain/tools";
import fs from "fs";
import { logger } from "../../utils/loggerHandler.js";
import { RAGServiceAdvanced as RAGService } from "../../rag/ragService.js";  // 导入类，不是函数
import { createChatModel } from "../../model/modelFactory.js";     // 添加导入
import { getRetriever } from "../../rag/vector_store.js"; // 添加导入
import { agentConf } from "../../utils/configHandler.js";
import { getAbsPath } from "../../utils/pathTool.js";
import { z } from "zod";

const userIds = [
  "1001", "1002", "1003", "1004", "1005", "1006", "1007", "1008", "1009", "1010",
];

const monthArr = [
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
  "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
];

let externalData = {};

// 初始化 RAG 服务（单例模式）
let ragServiceInstance = null;

function getRAGServiceInstance() {
  if (!ragServiceInstance) {
    const model = createChatModel();
    const embedModel = createEmbeddingModel();  // 创建嵌入模型
    
    // 正确传入参数
    const retriever = getRetriever(
      embedModel,
      chromaConf.collection_name,
      chromaConf.host,
      chromaConf.port
    );
    ragServiceInstance = new RAGService(model, retriever);
  }
  return ragServiceInstance;
}

// RAG 工具 - 改名避免冲突
const ragSummarizeTool = tool(
  async (query) => {
    try {
      const ragService = getRAGServiceInstance();
      const result = await ragService.ragSummarize(query);
      return result;
    } catch (error) {
      logger.error(`RAG 工具执行失败: ${error.message}`);
      return `抱歉，检索参考资料时出错: ${error.message}`;
    }
  },
  {
    name: "rag_summarize",
    description: "从向量数据库中检索相关参考资料并生成总结。输入：用户的查询问题。",
  }
);

// 获取指定城市的天气
const getWeather = tool(
  async (city) => {
    return `城市${city}天气为晴天，气温26摄氏度，空气湿度50%，南风1级，AQI21，最近6小时降雨概率极低`;
  },
  {
    name: "get_weather",
    description: "获取指定城市的天气，以消息字符串的形式返回",
  }
);

// 获取用户所在城市
const getUserLocation = tool(
  async () => {
    const cities = ["深圳", "合肥", "杭州"];
    return cities[Math.floor(Math.random() * cities.length)];
  },
  {
    name: "get_user_location",
    description: "获取用户所在城市的名称，以纯字符串形式返回",
  }
);

// 获取用户ID
const getUserId = tool(
  async ({ userId }) => {
    // 如果传入了特定用户ID，直接返回
    if (userId) {
      return userId;
    }
    // 否则随机返回一个用户ID
    return userIds[Math.floor(Math.random() * userIds.length)];
  },
  {
    name: "get_user_id",
    description: "获取用户的ID。如果提供了userId参数则返回该ID，否则随机返回一个用户ID。以纯字符串形式返回",
  }
);

// 获取当前月份
const getCurrentMonth = tool(
  async () => {
    return monthArr[Math.floor(Math.random() * monthArr.length)];
  },
  {
    name: "get_current_month",
    description: "获取当前月份，以纯字符串形式返回",
  }
);

// 生成外部数据
function generateExternalData() {
  if (Object.keys(externalData).length > 0) {
    return;
  }
  const externalDataPath = getAbsPath(agentConf.external_data_path);


  if (!fs.existsSync(externalDataPath)) {
    throw new Error(`外部数据文件${externalDataPath}不存在`);
  }

  const content = fs.readFileSync(externalDataPath, "utf-8");
  const lines = content.split("\n");

  // 跳过表头，从第二行开始读取
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const arr = line.split(",").map(item => item.replace(/"/g, ""));

    const userId = arr[0];
    const feature = arr[1];
    const efficiency = arr[2];
    const consumables = arr[3];
    const comparison = arr[4];
    const time = arr[5];

    if (!externalData[userId]) {
      externalData[userId] = {};
    }

    externalData[userId][time] = {
      "特征": feature,
      "效率": efficiency,
      "耗材": consumables,
      "对比": comparison,
    };
  }
}

// agentTools.js
async function fetchExternalDataHandler(args) {
  if (!args) {
    logger.error("[fetch_external_data] 参数为空");
    return "";
  }

  const { user_id, month } = args;
  if (!user_id || !month) {
    logger.error("[fetch_external_data] 参数无效");
    return "";
  }

  generateExternalData();

  if (externalData[user_id]?.[month]) {
    return JSON.stringify(externalData[user_id][month]);
  }

  logger.warn(`[fetch_external_data] 未找到用户 ${user_id} 在 ${month} 的数据`);
  return "";
}

// 工具包装
const fetchExternalData = tool(
  async (args) => {
    // Agent 调用可能 args 在 input 里
    if (!args) return "";
    if (args.input) {
      try {
        args = typeof args.input === "string" ? JSON.parse(args.input) : args.input;
      } catch (e) {
        logger.error("[fetch_external_data] JSON解析失败");
        return "";
      }
    }

    const data = await fetchExternalDataHandler(args);
    return {
      tool: "fetch_external_data",
      content: JSON.stringify(data), // 模型可以直接读取
    };
    

  },
  {
    name: "fetch_external_data",
    description: "从外部系统获取用户使用记录",
    parameters: z.object({ input: z.any().optional() }), // 兼容 Agent 传入的 input
  }
);

// 触发上下文切换的工具
const fillContextForReport = tool(
  async () => {
    return "fill_context_for_report已调用";
  },
  {
    name: "fill_context_for_report",
    description: "无入参，无返回值，调用后触发中间件自动为报告生成的场景动态注入上下文信息，为后续提示词切换提供上下文信息",
  }
);

// 导出所有工具
export {
  ragSummarizeTool as ragSummarize,  // 导出时使用原名称
  getWeather,
  getUserLocation,
  getUserId,
  getCurrentMonth,
  fetchExternalData,
  fillContextForReport,
  fetchExternalDataHandler
};