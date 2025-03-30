import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LemmaResponse, MorphFeaturesResponse, InflectRequest, InflectResponse, SentenceSplitResponse, ProcessResponse, ApiError } from './types';

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

  // Лемматизация слова
  async getLemma(word: string): Promise<LemmaResponse> {
    try {
      const response: AxiosResponse<LemmaResponse> = await this.client.post('/api/v1/morph/lemma', { word });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Получение морфологических характеристик слова
  async getMorphFeatures(word: string): Promise<MorphFeaturesResponse> {
    try {
      const response: AxiosResponse<MorphFeaturesResponse> = await this.client.post('/api/v1/morph/features', { word });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Словоизменение (постановка слова в заданные грамматические характеристики)
  async inflectWord(params: InflectRequest): Promise<InflectResponse> {
    try {
      const response: AxiosResponse<InflectResponse> = await this.client.post('/api/v1/morph/inflect', params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Разбиение текста на предложения (razdel)
  async splitSentences(text: string): Promise<SentenceSplitResponse> {
    try {
      const response: AxiosResponse<SentenceSplitResponse> = await this.client.post('/api/v1/text/sentence-split', { text });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // POS-тэгинг
  async posTagging(text: string): Promise<ProcessResponse> {
    try {
      const response: AxiosResponse<ProcessResponse> = await this.client.post('/api/v1/text/pos', { text });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // NER (распознавание именованных сущностей)
  async namedEntityRecognition(text: string): Promise<ProcessResponse> {
    try {
      const response: AxiosResponse<ProcessResponse> = await this.client.post('/api/v1/text/ner', { text });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Анализ зависимостей
  async dependencyParsing(text: string): Promise<ProcessResponse> {
    try {
      const response: AxiosResponse<ProcessResponse> = await this.client.post('/api/v1/text/depparse', { text });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Проверка здоровья сервиса
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response: AxiosResponse<{ status: string }> = await this.client.get('/api/v1/service/health');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Обработка ошибок
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError;
      const errorMessage = apiError?.detail || apiError?.error || error.message;

      if (apiError?.success === false) {
        throw new Error(`Inflection failed: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }
    throw new Error('Unknown error occurred');
  }
}

export default StanzaApi;