import { Type } from '@google/genai';

export const substitutesSchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          exerciseId: { type: Type.INTEGER },
          substitutes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                exerciseId: { type: Type.INTEGER },
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
