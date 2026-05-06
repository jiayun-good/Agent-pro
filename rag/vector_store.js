
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pdfParse from 'pdf-parse';
import { OllamaEmbeddings } from '@langchain/ollama';
import { Chroma } from "@langchain/community/vectorstores/chroma";

// --------------------
// 生成文件 md5
// --------------------
export function getFileMd5Hex(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// --------------------
// 遍历文件夹并筛选指定类型
// --------------------
export function listFilesWithAllowedTypes(dirPath, allowedTypes = ['.pdf']) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`${dirPath} 不是有效目录`);
  }

  const files = fs.readdirSync(dirPath)
    .filter(f => allowedTypes.includes(path.extname(f).toLowerCase()))
    .map(f => path.join(dirPath, f));

  return files;
}

// --------------------
// 解析 PDF
// --------------------
export async function pdfLoader(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text; // 返回 PDF 文本
}

// --------------------
// 构建向量并存入 VectorStore
// --------------------
export async function processDocumentsToVectorStore(dirPath, embeddingModel, vectorStore) {
  const files = listFilesWithAllowedTypes(dirPath, ['.pdf']);

  for (const file of files) {
    const md5 = getFileMd5Hex(file);

    // 检查 vectorStore 是否已有此 md5
    const existing = await vectorStore.similaritySearchById(md5);
    if (existing.length > 0) {
      console.log(`文件已存在，跳过: ${file}`);
      continue;
    }

    // 解析 PDF
    const text = await pdfLoader(file);

    // 生成向量
    const vector = await embeddingModel.embedQuery(text);

    // 存入 vector store
    await vectorStore.add({
      id: md5,
      vector,
      metadata: { filePath: file, text }
    });

    console.log(`已处理文件: ${file}`);
  }
}

// --------------------
// 使用示例
// --------------------
async function main() {
  const embeddingModel = new OllamaEmbeddings({
    model: 'nomic-embed-text:latest',
    baseUrl: 'http://localhost:11434',
  });

  // 这里用 Chroma 做示例，你也可以换成自己的 vector_store
  const vectorStore = new Chroma({
    collectionName: 'test_docs',
    url: 'http://localhost:8000', // Docker Chroma 服务地址
    embeddingFunction: embeddingModel, // OllamaEmbeddings 对象
  });

  await processDocumentsToVectorStore('./docs', embeddingModel, vectorStore);
}

main().catch(console.error);