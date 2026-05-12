import fs from 'fs';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import crypto from 'crypto';
// ------------------ 工具函数 ------------------
// 计算文件内容 MD5
function getFileMD5(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('md5');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

// 读取本地 MD5 文件，返回 Set
function loadMD5Store(storePath) {
  if (!fs.existsSync(storePath)) return new Set();
  const lines = fs.readFileSync(storePath, 'utf-8').split(/\r?\n/).filter(Boolean);
  return new Set(lines);
}

// 保存 MD5 到文件（追加模式）
function saveMD5ToStore(storePath, md5) {
  fs.appendFileSync(storePath, md5 + '\n', { encoding: 'utf-8' });
}

// PDF 加载函数（保持原逻辑）
async function pdfLoader(filePath) {
  const loader = new PDFLoader(filePath, { splitPages: false });
  return await loader.load();
}

export { getFileMD5, loadMD5Store, saveMD5ToStore, pdfLoader };