// import { logger } from '@/utils/logger.js'

// logger.info('服务启动')
// logger.debug('开始检索文档')
// logger.error('请求失败')

// import { loadReportPrompts } from "@/utils/promptsLoader.js";
// import {ragConf } from '@/utils/configHandler.js'
// // console.log(loadReportPrompts());
// console.log(ragConf)

//--------------------------------
// import { ChatModelFactory, EmbeddingModelFactory } from '@/model/ChatModelFactory.js'

// const chatModelFactory = new ChatModelFactory();
// const embeddingModelFactory = new EmbeddingModelFactory();

// // 生成模型
// const chatModel = chatModelFactory.generator();
// const embedModel = embeddingModelFactory.generator();

// // 使用模型
// const res = await chatModel.invoke("你好，我是 Qwen 7b 模型");
// console.log(res);

// // ✅ embedding 正确调用
// embedModel.embedQuery("This is a test")
//   .then(response => {
//     console.log("嵌入结果:", response);
//   })
//   .catch(error => {
//     console.error("错误:", error);
//   });

//--------------------------------
import { OllamaEmbeddings } from '@langchain/ollama';
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { processDocumentsToVectorStore } from './rag/vector_store.js';

async function test() {
  // 初始化 embedding 模型
  const embeddingModel = new OllamaEmbeddings({
    model: 'nomic-embed-text:latest',
    baseUrl: 'http://localhost:11434',
  });

  // 初始化 vector store
  const vectorStore = new Chroma({ collectionName: 'test_docs', url: 'http://localhost:8000' });

  // 处理 docs 文件夹
  await processDocumentsToVectorStore('./data/pdf', embeddingModel, vectorStore);

  // 测试查询
  const query = "测试文本内容";
  const queryVector = await embeddingModel.embedQuery(query);
  const results = await vectorStore.similaritySearchVectorWithScore(queryVector, 3);
  
  console.log("查询结果:", results);
}

test().catch(console.error);