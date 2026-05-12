// rag/ragServiceAdvanced.js
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { loadRagPrompts } from '../utils/promptsLoader.js';
import { logger } from '../utils/loggerHandler.js';

export class RAGServiceAdvanced {
  constructor(model, retriever, config = {}) {
    this.model = model;
    this.retriever = retriever;
    this.config = {
      topK: config.topK || 5,
      minRelevance: config.minRelevance || 0.5,
      enableStreaming: config.enableStreaming || false,
      ...config
    };
    this.chain = null;
    this.initChain();
  }

  /**
   * 初始化 LangChain 执行链
   */
  initChain() {
    const promptText = loadRagPrompts();
    const promptTemplate = PromptTemplate.fromTemplate(promptText);
    
    this.chain = RunnableSequence.from([
      {
        input: (input) => input.input,
        context: async (input) => await this.retrieveContext(input.input)
      },
      promptTemplate,
      this.model,
      new StringOutputParser()
    ]);
  }

  /**
   * 检索并处理上下文
   */
  async retrieveContext(query) {
    const docs = await this.retriever.invoke(query);
    
    // 可选：根据相似度分数过滤
    const filteredDocs = docs.slice(0, this.config.topK);
    
    return filteredDocs
      .map((doc, index) => {
        const score = doc.metadata?.score || 'N/A';
        return `【文档${index + 1}】(相关度: ${score})\n内容: ${doc.pageContent}\n元数据: ${JSON.stringify(doc.metadata)}`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * 标准 RAG 查询
   */
  async ragSummarize(query) {
    try {
      logger.info(`[RAG Advanced] 处理查询: ${query}`);
      
      const result = await this.chain.invoke({
        input: query
      });
      
      return result;
    } catch (error) {
      logger.error(`RAG 查询失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 流式输出 RAG 结果
   */
  async *ragSummarizeStream(query) {
    try {
      logger.info(`[RAG Advanced] 开始流式输出: ${query}`);
      
      const context = await this.retrieveContext(query);
      const promptText = loadRagPrompts();
      const promptTemplate = PromptTemplate.fromTemplate(promptText);
      
      const stream = await promptTemplate
        .pipe(this.model)
        .pipe(new StringOutputParser())
        .stream({
          input: query,
          context: context
        });
      
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      logger.error(`流式 RAG 失败: ${error.message}`);
      yield `错误: ${error.message}`;
    }
  }

  /**
   * 获取检索到的原始文档（不生成回答）
   */
  async retrieveOnly(query) {
    const docs = await this.retriever.invoke(query);
    return docs.slice(0, this.config.topK).map(doc => ({
      content: doc.pageContent,
      metadata: doc.metadata
    }));
  }
}