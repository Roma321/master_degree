import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Типы для запросов и ответов
type TextRequest = {
  text: string;
  processors?: string[];
};

type LemmaRequest = {
  word: string;
};

type MorphFeaturesResponse = {
  word: string;
  features: Record<string, string>;
};

type InflectRequest = {
  lemma: string;
  features?: Record<string, string>;
  features_str?: string;
};

type InflectResponse = {
  lemma: string;
  inflected: string;
  requested_features: Record<string, string>;
  normal_form: string;
  tag: string;
  success: boolean;
};

type LemmaResponse = {
  lemma: string;
};

type SentenceSplitResponse = {
  sentences: string[];
};

type ProcessResponse = {
  result: any;
};

type ApiError = {
  error: string;
  detail?: string;
  success?: boolean;
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

  // Лемматизация слова
  async getLemma(word: string): Promise<LemmaResponse> {
    try {
      const response: AxiosResponse<LemmaResponse> = await this.client.post('/process/lemma', { word });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Получение морфологических характеристик слова
  async getMorphFeatures(word: string): Promise<MorphFeaturesResponse> {
    try {
      const response: AxiosResponse<MorphFeaturesResponse> = await this.client.post('/process/morph-features', { word });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Словоизменение (постановка слова в заданные грамматические характеристики)
  async inflectWord(params: InflectRequest): Promise<InflectResponse> {
    try {
      const response: AxiosResponse<InflectResponse> = await this.client.post('/process/inflect-word', params);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
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

const test = async () => {
  const api = new StanzaApi();
  const { lemma } = await api.getLemma("столы");
  console.log(lemma); // "стол"

  const { features } = await api.getMorphFeatures("столы");
  console.log(features);
  // { Case: "Nom", Number: "Plur", ... }

  // Вариант 1 - через features словарь
  const result1 = await api.inflectWord({
    lemma: "стол",
    features: { Case: "Dat", Number: "Plur" }
  });

  // Вариант 2 - через features_str (формат Stanza)
  const result2 = await api.inflectWord({
    lemma: "книга",
    features_str: "Case=Gen|Number=Sing"
  });

  console.log(result1.inflected); // "столам"
  console.log(result2.inflected); // "книги"
}

test()