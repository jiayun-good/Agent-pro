// react_agent.js
import { createAgent } from "langchain";   // ✅ 从 langchain 导入
import { createChatModel } from "../model/modelFactory.js";
import { loadSystemPrompts } from "../utils/promptsLoader.js";
import {
  ragSummarize,
  getWeather,
  getUserLocation,
  getUserId,
  getCurrentMonth,
  fetchExternalData,
  fillContextForReport,
} from "./tools/agentTools.js";
import {
  monitorTool,
  logBeforeModel,
  reportPromptSwitch,
} from "./tools/middleware.js";

class ReactAgent {
  constructor() {
    this.model = createChatModel();
    
    this.agent = createAgent({
      model: this.model,
      systemPrompt: loadSystemPrompts(),
      tools: [
        ragSummarize,
        getWeather,
        getUserLocation,
        getUserId,
        getCurrentMonth,
        fetchExternalData,
        fillContextForReport,
      ],
      middleware: [monitorTool, logBeforeModel, reportPromptSwitch],
    });
  }

  async *executeStream(query) {
    const inputDict = {
      messages: [{ role: "user", content: query }],
    };

    // ✅ 关键修复：await 拿到 AsyncGenerator
    const stream = await this.agent.stream(inputDict, {
      streamMode: "values",
      context: { report: false },   // 传递上下文对象（可变）
    });

    // 此时 stream 已经是 AsyncGenerator，可以直接 for await
    for await (const chunk of stream) {
      const latestMessage = chunk.messages[chunk.messages.length - 1];
      if (latestMessage.content) {
        yield latestMessage.content.trim() + "\n";
      }
    }
  }
}

// 测试代码
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new ReactAgent();
  for await (const chunk of agent.executeStream("给我生成我的使用报告")) {
    process.stdout.write(chunk);
  }
}

export default ReactAgent;