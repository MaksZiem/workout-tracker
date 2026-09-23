import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY'),
    });
    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
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
}
