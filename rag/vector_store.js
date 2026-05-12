import fs from 'fs';
import path from 'path';
import { chromaConf as chromaConfig } from '../utils/configHandler.js';
import { OllamaEmbeddings } from '@langchain/ollama';
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getFileMD5, loadMD5Store, saveMD5ToStore, pdfLoader } from '../utils/md5Utils.js';
import { getAbsPath } from '../utils/pathTool.js';
import { createChatModel, createEmbeddingModel } from '../model/modelFactory.js'; // 使用新的函数式API

/**
 * 将 PDF 文档处理成向量存储
 * @param {string} dirPath - PDF 文件所在目录
 * @param {Chroma} vectorStore - LangChain Chroma 向量库实例
 * @param {boolean} force - 是否强制重新入库（忽略 MD5）
 */
export async function processDocumentsToVectorStore(dirPath, vectorStore, force = false) {
  const md5StorePath = getAbsPath(path.join(dirPath, chromaConfig.md5_hex_store));
  const md5Set = loadMD5Store(md5StorePath); // 加载已入库的文件 MD5

  const files = fs.readdirSync(getAbsPath(dirPath))
    .filter(f => chromaConfig.allow_knowledge_file_type.includes(f.split('.').pop()))
    .map(f => getAbsPath(path.join(dirPath, f)));

  // 分片器
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: chromaConfig.chunk_size,
    chunkOverlap: chromaConfig.chunk_overlap,
    separators: chromaConfig.separators,
  });

  for (const file of files) {
    const fileName = path.basename(file);
    const fileMD5 = getFileMD5(file);
  
    if (!force && md5Set.has(fileMD5)) {
      console.log(`⏩ 跳过文件: ${fileName} (内容已存在, MD5: ${fileMD5})`);
      continue;
    }
  
    try {
      let docs;
  
      if (file.endsWith('.pdf')) {
        // PDF 文件
        docs = await pdfLoader(file); // [{ pageContent, metadata }, ...]
      } else if (file.endsWith('.txt')) {
        // TXT 文件
        const content = fs.readFileSync(file, 'utf-8');
        docs = [{ pageContent: content, metadata: { source: fileName, filePath: file } }];
      } else {
        console.log(`⚠️ 忽略不支持的文件类型: ${fileName}`);
        continue;
      }
  
      // 分片
      let chunkedDocs = [];
      for (const doc of docs) {
        const chunks = await textSplitter.splitText(doc.pageContent);
        chunks.forEach((chunk, idx) => {
          chunkedDocs.push({
            pageContent: chunk,
            metadata: {
              ...doc.metadata,
              chunkIndex: idx,
              md5: fileMD5
            }
          });
        });
      }
  
      // 入库
      await vectorStore.addDocuments(chunkedDocs);
      console.log(`✅ 已完成入库: ${fileName} (MD5: ${fileMD5})`);
  
      // 更新 MD5
      saveMD5ToStore(md5StorePath, fileMD5);
      md5Set.add(fileMD5);
  
    } catch (error) {
      console.error(`❌ 处理文件出错: ${fileName} | 原因: ${error.message}`);
    }
  }
}

/**
 * 获取向量检索器
 * @param {OllamaEmbeddings} embeddingModel - 嵌入模型实例
 * @param {string} collectionName - 集合名称
 * @param {string} host - Chroma 主机地址
 * @param {number} port - Chroma 端口
 * @returns {Object} 检索器实例
 */
export function getRetriever(embeddingModel, collectionName, host = 'localhost', port = 8000) {
  const vectorStore = new Chroma(embeddingModel, {
    collectionName: collectionName,
    host: host,
    port: port,
  });

  return vectorStore.asRetriever();
}

/**
 * 获取完整的 RAG 系统（包含模型和检索器）- 异步版本
 * @returns {Promise<Object>} 包含 chatModel 和 retriever 的对象
 */
export async function getRagSystem() {
  // 直接使用函数创建模型实例
  const chatModel = createChatModel();
  const embedModel = createEmbeddingModel();

  // 获取检索器
  const retriever = getRetriever(
    embedModel,
    chromaConfig.collection_name,
    chromaConfig.host,
    chromaConfig.port
  );

  return {
    chatModel,
    retriever,
    embedModel
  };
}

/**
 * 获取向量存储实例（用于添加文档）
 * @returns {Promise<Chroma>} Chroma 向量存储实例
 */
export async function getVectorStore() {
  const embedModel = createEmbeddingModel();
  
  const vectorStore = new Chroma(embedModel, {
    collectionName: chromaConfig.collection_name,
    host: chromaConfig.host,
    port: chromaConfig.port,
  });
  
  return vectorStore;
}