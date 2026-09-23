import { Type } from '@google/genai';

export const workoutPlanSchema = {
  type: Type.OBJECT,
  properties: {
    templates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          notes: { type: Type.STRING },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                exerciseId: { type: Type.INTEGER },
                order: { type: Type.INTEGER },
                targetSets: { type: Type.INTEGER },
                targetReps: { type: Type.INTEGER },
                targetWeight: { type: Type.NUMBER },
                restSeconds: { type: Type.INTEGER },
              },
              required: ['exerciseId', 'order', 'targetSets', 'targetReps'],
            },
          },
        },
        required: ['name', 'exercises'],
      },
    },
  },
  required: ['templates'],
};
