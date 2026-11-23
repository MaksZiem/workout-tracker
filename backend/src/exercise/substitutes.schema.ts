import { Type } from '@google/genai';

export const substitutesSchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          exerciseId: { type: Type.STRING },
          substitutes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                exerciseId: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ['exerciseId', 'reason'],
            },
          },
        },
        required: ['exerciseId', 'substitutes'],
      },
    },
  },
  required: ['results'],
};
