// Typy, których nie da się wygenerować z OpenAPI: endpointy stats, AI i część
// exercise opisują odpowiedzi w Swaggerze tylko przykładem (bez schematu).
import type { components } from "./schema";

type Schemas = components["schemas"];

export type Exercise = Schemas["Exercise"];
export type Workout = Schemas["Workout"];
export type WorkoutPlan = Schemas["WorkoutPlan"];
export type WorkoutTemplate = Schemas["WorkoutTemplate"];
export type UserDto = Schemas["UserDto"];
export type AdminUserDto = Schemas["AdminUserDto"];
export type AdminUsersPage = Schemas["AdminUsersPageDto"];
export type ScheduledWorkout = Schemas["ScheduledWorkout"];

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

export const SCHEDULED_WORKOUT_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "SKIPPED"] as const;
export type ScheduledWorkoutStatus = (typeof SCHEDULED_WORKOUT_STATUSES)[number];

export type ExerciseProgressPoint = {
  date: string;
  sets: { weight: number; reps: number }[];
  topWeight: number;
  volume: number;
  estimatedOneRepMax: number;
};

export type PersonalRecords = {
  maxWeight: number;
  maxWeightDate: string;
  maxWeightExercise: string;
  bestVolumeInSingleSet: number;
  bestVolumeDate: string;
  bestEstimatedOneRepMax: number;
  bestEstimatedOneRepMaxDate: string;
  bestEstimatedOneRepMaxWeight: number;
  bestEstimatedOneRepMaxReps: number;
};

export type ExercisePersonalRecords = PersonalRecords & {
  exerciseId: string;
  exerciseName: string;
};

export type MuscleGroupStats = {
  muscleGroup: MuscleGroup;
  sets: number;
  volume: number;
};

export type WorkoutFrequencyDay = { date: string; count: number; missed: number };

export type StatsSummary = {
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  avgSetsPerWorkout: number;
  mostTrainedMuscleGroup: MuscleGroup | null;
  currentStreak: number;
};

export type RepRecord = { reps: number; weight: number | null; actualReps: number | null; date: string | null };

export type Adherence = {
  completed: number;
  skipped: number;
  missed: number;
  upcoming: number;
  rate: number | null;
};

export type WeeklyStats = { weekStart: string; workouts: number; sets: number; volume: number };

export const REP_RANGES = ["STRENGTH", "HYPERTROPHY", "ENDURANCE"] as const;
export type RepRange = (typeof REP_RANGES)[number];

export type RepRangeStats = { range: RepRange; sets: number };

export type StagnantExercise = {
  exerciseId: string;
  exerciseName: string;
  bestEstimatedOneRepMax: number;
  bestWeight: number;
  bestReps: number;
  bestDate: string;
  weeksSinceBest: number;
  sessionsSince: number;
  lastSessionDate: string;
};

export type ExerciseSubstitute = Schemas["ExerciseSubstituteDto"];

export type GenerateSubstitutesResult = Schemas["GenerateAllSubstitutesResultDto"];

export type ExerciseUsage = { workoutCount: number; templateCount: number };

export type GeneratedPlan = { plan: WorkoutPlan; templates: WorkoutTemplate[] };

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
  "/stats/exercise/{exerciseId}/rep-records": RepRecord[];
  "/stats/adherence": Adherence;
  "/stats/weekly": WeeklyStats[];
  "/stats/rep-ranges": RepRangeStats[];
  "/stats/stagnation": StagnantExercise[];
  "/exercise/{id}/usage": ExerciseUsage;
  "/ai/generate-plan": GeneratedPlan;
  "/ai/parse-workout": ParsedWorkout;
};
