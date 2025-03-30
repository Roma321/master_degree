import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Типы для запросов и ответов
type TextRequest = {
  text: string;
  processors?: string[];
};

type SentenceSplitResponse = {
  sentences: string[];
};

type ProcessResponse = {
  result: any; // Можно заменить на более конкретный тип в зависимости от структуры ответа Stanza
};

type ApiError = {
  error: string;
  detail?: string;
};

// Класс-обёртка для API
class StanzaApi {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Разбиение текста на предложения (razdel)
  async splitSentences(text: string): Promise<SentenceSplitResponse> {
    try {
      const response: AxiosResponse<SentenceSplitResponse> = await this.client.post('/process/sentence-split', { text });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // POS-тэгинг
  async posTagging(text: string): Promise<ProcessResponse> {
    try {
      const response: AxiosResponse<ProcessResponse> = await this.client.post('/process/pos', { text });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // NER (распознавание именованных сущностей)
  async namedEntityRecognition(text: string): Promise<ProcessResponse> {
    try {
      const response: AxiosResponse<ProcessResponse> = await this.client.post('/process/ner', { text });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Анализ зависимостей
  async dependencyParsing(text: string): Promise<ProcessResponse> {
    try {
      const response: AxiosResponse<ProcessResponse> = await this.client.post('/process/depparse', { text });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Кастомный пайплайн
  async customPipeline(text: string, processors: string[]): Promise<ProcessResponse> {
    try {
      const response: AxiosResponse<ProcessResponse> = await this.client.post('/process/custom', { 
        text, 
        processors 
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Проверка здоровья сервиса
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response: AxiosResponse<{ status: string }> = await this.client.get('/health');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Обработка ошибок
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError;
      throw new Error(apiError?.detail || apiError?.error || error.message);
    }
    throw new Error('Unknown error occurred');
  }
}

export default StanzaApi;