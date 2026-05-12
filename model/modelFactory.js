// modelFactory.js
import { ragConf } from '../utils/configHandler.js'
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";

const { chat_model_name, embedding_model_name } = ragConf

// 直接导出函数，简单明了
export function createChatModel() {
  if (chat_model_name === 'qwen2.5:7b') {
    return new ChatOllama({
      model: chat_model_name,
      baseUrl: "http://localhost:11434"
    });
  }
  throw new Error(`Unsupported chat model: ${chat_model_name}`);
}

export function createEmbeddingModel() {
  if (embedding_model_name === 'nomic-embed-text:latest') {
    return new OllamaEmbeddings({
      model: embedding_model_name,
      baseUrl: "http://localhost:11434"
    });
  }
  throw new Error(`Unsupported embedding model: ${embedding_model_name}`);
}

// 可选：如果需要单例模式
let chatModelInstance = null;
export function getChatModel() {
  if (!chatModelInstance) {
    chatModelInstance = createChatModel();
  }
  return chatModelInstance;
}

let embeddingModelInstance = null;
export function getEmbeddingModel() {
  if (!embeddingModelInstance) {
    embeddingModelInstance = createEmbeddingModel();
  }
  return embeddingModelInstance;
}