import { ragConf } from '../utils/configHandler.js'
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";


const { chat_model_name, embedding_model_name } = ragConf
class BaseModelFactory {
  constructor() {
    if (this.constructor === BaseModelFactory) {
      throw new Error("Cannot instantiate abstract class BaseModelFactory");
    }
  }

  generator() {
    throw new Error("Method 'generator()' must be implemented.");
  }
}

class ChatModelFactory extends BaseModelFactory {
  generator() {
    if (chat_model_name === 'qwen:7b') {
      return new ChatOllama({
        model: chat_model_name,
        baseUrl: "http://localhost:11434"
      });
    }

    throw new Error(`Unsupported chat model: ${chat_model_name}`);
  }
}

class EmbeddingModelFactory extends BaseModelFactory {
  generator() {
    if (embedding_model_name === 'nomic-embed-text:latest') {
      return new OllamaEmbeddings({
        model: embedding_model_name,
        baseUrl: "http://localhost:11434"
      });
    }

    throw new Error(`Unsupported embedding model: ${embedding_model_name}`);
  }
}

export { ChatModelFactory, EmbeddingModelFactory }