// middleware.js
import { createMiddleware } from "langchain";
import { loadSystemPrompts, loadReportPrompts } from "../../utils/promptsLoader.js";
import { logger } from "../../utils/loggerHandler.js";

export const monitorTool = createMiddleware({
  name: "MonitorTool",
  wrapToolCall: async (request, handler) => {
    const toolName = request.toolCall.name;
    logger.info(`[工具监控] 执行工具：${toolName}`);
    logger.info(`[工具监控] 参数：${JSON.stringify(request.toolCall.args)}`);

    try {
      const result = await handler(request);
      logger.info(`[工具监控] 工具 ${toolName} 调用成功`);

      // 当调用 fill_context_for_report 时，修改 runtime.context 开启报告模式
      if (toolName === "fill_context_for_report") {
        // 通过 runtime 访问和修改上下文
        if (request.runtime) {
          if (!request.runtime.context) {
            request.runtime.context = {};
          }
          request.runtime.context.report = true;
          logger.info("[工具监控] 已开启报告模式（report = true）");
          logger.info(`[工具监控] runtime.context 当前值：${JSON.stringify(request.runtime.context)}`);
        } else {
          logger.warn("[工具监控] request.runtime 不存在，无法开启报告模式");
        }
      }
      return result;
    } catch (error) {
      logger.error(`[工具监控] 工具 ${toolName} 调用失败：${error.message}`);
      throw error;
    }
  },
});

export const logBeforeModel = createMiddleware({
  name: "LogBeforeModel",
  beforeModel: async (state, runtime) => {
    logger.info(`[模型日志] 即将调用模型，消息数：${state.messages.length}`);
    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg) {
      logger.debug(`[模型日志] 最后消息：${lastMsg.content?.substring(0, 100)}`);
    }
    // 不修改状态
    return null;
  },
});

export const reportPromptSwitch = createMiddleware({
  name: "ReportPromptSwitch",
  beforeModel: async (state, runtime) => {
    // 从 runtime.context 中获取 report 标志
    const isReport = runtime.context?.report === true;
    if (isReport) {
      logger.info("[提示词切换] 检测到报告模式，插入报告专用提示词");
      const reportPrompt = loadReportPrompts();
      // 注意：这里返回的对象会与当前状态合并，添加一条系统消息
      return {
        messages: [
          { role: "system", content: reportPrompt },
          ...state.messages,
        ],
      };
    }
    // 普通模式不做改动
    return null;
  },
});