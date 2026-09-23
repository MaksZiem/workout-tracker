import { Type } from '@google/genai';

export const parsedWorkoutSchema = {
  type: Type.OBJECT,
  properties: {
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          exerciseId: { type: Type.INTEGER },
          sets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                reps: { type: Type.INTEGER },
                weight: { type: Type.NUMBER },
              },
              required: ['reps', 'weight'],
            },
          },
        },
        required: ['exerciseId', 'sets'],
      },
    },
  },
  required: ['exercises'],
};
