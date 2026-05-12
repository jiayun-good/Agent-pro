/**
 * 简单的 RAG 测试脚本
 */

import { get_rag_system } from './rag/vector_store.js';
import { ragSummarize } from './rag/rag_service.js';

async function testRagSummarize() {
  console.log("开始测试 ragSummarize 功能...");

  try {
    // 获取 RAG 系统
    console.log("1. 初始化 RAG 系统...");
    const { chatModel, retriever } = await get_rag_system();
    console.log("✅ RAG 系统初始化成功");

    // 测试查询
    console.log("2. 执行 RAG 查询...");
    const query = "今天天气如何";
    const result = await ragSummarize(query, chatModel, retriever);

    console.log("✅ RAG 查询成功");
    console.log("查询结果:", result);

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    console.error("详细错误:", error);
  }
}

async function testProcessDocuments() {
  console.log("\n开始测试 processDocumentsToVectorStore 功能...");

  try {
    // 获取嵌入模型
    console.log("1. 初始化嵌入模型...");
    const { embedModel } = await get_rag_system();
    console.log("✅ 嵌入模型初始化成功");

    // 导入必要的模块
    const { chromaConf } = await import('./utils/configHandler.js');
    const { Chroma } = await import("@langchain/community/vectorstores/chroma");
    const { processDocumentsToVectorStore } = await import('./rag/vector_store.js');

    // 初始化向量存储
    console.log("2. 初始化向量存储...");
    const vectorStore = new Chroma(embedModel, {
      collectionName: chromaConf.collection_name,
      host: chromaConf.host,
      port: chromaConf.port,
    });
    console.log("✅ 向量存储初始化成功");

    // 处理文档
    console.log("3. 处理文档...");
    const docsDir = "./data";
    await processDocumentsToVectorStore(docsDir, vectorStore);
    console.log("✅ 文档处理成功");

  } catch (error) {
    console.error("❌ 文档处理失败:", error.message);
    console.error("详细错误:", error);
  }
}

// 运行测试
console.log("=== RAG 系统测试 ===");

// 先测试文档处理
testProcessDocuments()
  .then(() => {
    console.log("\n" + "=".repeat(50));
    // 再测试 RAG 查询
    return testRagSummarize();
  })
  .then(() => {
    console.log("\n🎉 所有测试完成！");
  })
  .catch(console.error);