// Typy, których nie da się wygenerować z OpenAPI: endpointy stats, AI i część
// exercise opisują odpowiedzi w Swaggerze tylko przykładem (bez schematu).
// Źródło prawdy: backend/src/stats/{stats.service,helpers}.ts, backend/src/ai/ai.service.ts,
// backend/src/exercise/exercise.service.ts. Przy zmianach w backendzie aktualizuj ręcznie.
import type { components } from "./schema";

type Schemas = components["schemas"];

export type Exercise = Schemas["Exercise"];
export type Workout = Schemas["Workout"];
export type WorkoutPlan = Schemas["WorkoutPlan"];
export type WorkoutTemplate = Schemas["WorkoutTemplate"];
export type UserDto = Schemas["UserDto"];

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MUSCLE_GROUPS = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "GLUTES",
  "ABS",
  "FULL_BODY",
  "CARDIO",
] as const satisfies readonly Exercise["muscleGroup"][];
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const TRAINING_GOALS = ["STRENGTH", "HYPERTROPHY", "ENDURANCE", "GENERAL"] as const;
export type TrainingGoal = (typeof TRAINING_GOALS)[number];

export const SCHEDULED_WORKOUT_STATUSES = ["PLANNED", "COMPLETED", "SKIPPED"] as const;
export type ScheduledWorkoutStatus = (typeof SCHEDULED_WORKOUT_STATUSES)[number];

/** GET /stats/exercise/:exerciseId/progress (tablica) */
export type ExerciseProgressPoint = {
  date: string;
  sets: { weight: number; reps: number }[];
  topWeight: number;
  volume: number;
  estimatedOneRepMax: number;
};

/** GET /stats/exercise/:exerciseId/records */
export type PersonalRecords = {
  maxWeight: number;
  maxWeightDate: string;
  maxWeightExercise: string;
  bestVolumeInSingleSet: number;
  bestVolumeDate: string;
  bestEstimatedOneRepMax: number;
  bestEstimatedOneRepMaxDate: string;
};

/** GET /stats/records (tablica) */
export type ExercisePersonalRecords = PersonalRecords & {
  exerciseId: number;
  exerciseName: string;
};

/** GET /stats/muscle-groups (tablica) */
export type MuscleGroupStats = {
  muscleGroup: MuscleGroup;
  sets: number;
  volume: number;
};

/** GET /stats/frequency (tablica, gęsta lista dni) */
export type WorkoutFrequencyDay = { date: string; count: number };

/** GET /stats/summary */
export type StatsSummary = {
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  avgSetsPerWorkout: number;
  mostTrainedMuscleGroup: MuscleGroup | null;
  currentStreak: number;
};

/** GET /exercise/:id/similar (tablica) */
export type SimilarExercise = { exercise: Exercise; similarity: number };

/** POST /exercise/backfill-embeddings */
export type BackfillEmbeddingsResult = { updated: number };

/** POST /ai/generate-plan */
export type GeneratedPlan = { plan: WorkoutPlan; templates: WorkoutTemplate[] };

/** POST /ai/parse-workout: zaktualizowany trening z ćwiczeniami i seriami */
export type ParsedWorkout = Workout;

/**
 * Nadpisania odpowiedzi 2xx dla operacji, które w OpenAPI mają `unknown`.
 * Używane przez `typed()` w ./typed.ts.
 */
export type ResponseOverrides = {
  "/stats/exercise/{exerciseId}/progress": ExerciseProgressPoint[];
  "/stats/exercise/{exerciseId}/records": PersonalRecords;
  "/stats/records": ExercisePersonalRecords[];
  "/stats/muscle-groups": MuscleGroupStats[];
  "/stats/frequency": WorkoutFrequencyDay[];
  "/stats/summary": StatsSummary;
  "/exercise/{id}/similar": SimilarExercise[];
  "/exercise/backfill-embeddings": BackfillEmbeddingsResult;
  "/ai/generate-plan": GeneratedPlan;
  "/ai/parse-workout": ParsedWorkout;
};
