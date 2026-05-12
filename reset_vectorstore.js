/**
 * 重置向量数据库脚本
 * 用于在更换嵌入模型时清理旧数据并重新生成
 */

import { get_rag_system, processDocumentsToVectorStore } from './rag/vector_store.js';
import { Chroma } from "@langchain/community/vectorstores/chroma";

async function resetVectorStore() {
  console.log("=== 重置向量数据库 ===");

  try {
    // 1. 获取 RAG 系统（使用新的模型配置）
    console.log("1. 初始化 RAG 系统...");
    const { embedModel } = await get_rag_system();
    console.log("✅ RAG 系统初始化成功");

    // 2. 导入配置
    const { chromaConf } = await import('./utils/configHandler.js');

    // 3. 创建新的向量存储（这会自动清理旧集合）
    console.log("2. 创建新的向量存储...");
    const vectorStore = new Chroma(embedModel, {
      collectionName: chromaConf.collection_name,
      host: chromaConf.host,
      port: chromaConf.port,
    });

    // 4. 强制重新处理所有文档
    console.log("3. 强制重新处理所有文档...");
    const docsDir = "./data";
    await processDocumentsToVectorStore(docsDir, vectorStore, true); // force = true

    console.log("✅ 向量数据库重置完成！");

    // 5. 测试新的向量存储
    console.log("4. 测试新的向量存储...");
    const testQuery = "机器人故障";
    const results = await vectorStore.similaritySearch(testQuery, 2);

    console.log(`测试查询: ${testQuery}`);
    results.forEach((doc, i) => {
      console.log(`结果 ${i + 1}: ${doc.pageContent.substring(0, 100)}...`);
    });

  } catch (error) {
    console.error("❌ 重置失败:", error.message);
    console.error("详细错误:", error);
  }
}

// 运行重置
resetVectorStore().catch(console.error);