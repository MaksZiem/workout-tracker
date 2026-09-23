import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly embeddingModel: string;

  constructor(private config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY'),
    });
    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    this.embeddingModel =
      this.config.get<string>('GEMINI_EMBEDDING_MODEL') ??
      'gemini-embedding-001';
  }

  async generateJson<T>(prompt: string, schema: object): Promise<T> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    if (!response.text) {
      throw new Error('Gemini returned an empty response');
    }

    return JSON.parse(response.text) as T;
  }

  async embedText(text: string): Promise<number[]> {
    const response = await this.client.models.embedContent({
      model: this.embeddingModel,
      contents: text,
    });

    const values = response.embeddings?.[0]?.values;
    if (!values) {
      throw new Error('Gemini returned an empty embedding');
    }

    return values;
  }
}
