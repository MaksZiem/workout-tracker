# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Built as a university project (coursework or thesis) that an instructor reviews and grades. The instructor and the author are the people who actually look at it. Inside the product, the user is someone who lifts weights: they log workouts, follow a plan, and track their progress. No particular real-world audience has been confirmed.

## Product Purpose
A workout tracker. It logs sessions made of exercises and sets, plans workouts ahead of time, and shows progress. Success means a complete, working, well-presented application that shows the full feature set holding together from backend to frontend.

## Positioning
Open decision. The user hasn't chosen what sets it apart from Strong, Hevy, and similar apps. The candidate from the codebase is the Gemini features: turning a plain-text description into a logged workout, and generating a plan from a goal, training days per week, and constraints, always using exercises from the existing catalog. Treat these as notable features, not as the product's confirmed identity.

## Operating Context
- Responsive web app with a device split by task. Logging a workout is mobile-first because it happens in the gym, on a phone, between sets. Everything else (planner, templates and plans, stats, exercise catalog, admin) is desktop-first because it's used to review and plan, and it still has to work on a phone.
- Workout logging: a workout (date, notes) holds exercises, and each exercise holds sets (weight, reps, completed). Workouts can be duplicated.
- Templates and plans: a plan groups templates, one per training day. Each template exercise has target sets, reps, weight, and rest time.
- Planner: workouts scheduled on dates with a status (PLANNED / COMPLETED / SKIPPED). Includes a "today" view, schedule generation, and starting a scheduled workout.
- Stats: per-exercise progress and records, overall records, muscle-group distribution, frequency, streak, and a summary.
- Exercise catalog grouped by muscle group (CHEST, BACK, SHOULDERS, BICEPS, TRICEPS, LEGS, GLUTES, ABS, FULL_BODY, CARDIO), with "similar exercises" based on embeddings.
- Training goals: STRENGTH, HYPERTROPHY, ENDURANCE, GENERAL.

## Capabilities and Constraints
- Backend: NestJS REST API with Swagger docs, JWT bearer auth, and USER / ADMIN roles. Admin controls the exercise catalog and backfilling embeddings.
- Frontend: Next.js 16 + React 19 + Tailwind CSS 4. It's still the create-next-app starter, so no UI exists yet. Per frontend/AGENTS.md, this Next.js version has breaking changes, so read `node_modules/next/dist/docs/` before writing frontend code.
- AI depends on Gemini, which can fail. The API has an error response for that case, and the UI needs to handle it.
- UI language: Polish and English with a language switcher (i18n). Exercise names come from the catalog and may be Polish-only; how they get translated hasn't been decided.

## Brand Commitments
- Visual standard: the category canon, played straight. The user chose it deliberately over invented worlds on 2026-09-24. The reference products are **Strong** and **Hevy**, and their level of craft is the bar. Conventions are embraced without irony or smuggled quirks.

## Evidence on Hand
- Seed data: `backend/src/seed.ts`. Sample requests: `backend/src/**/*.http`. Example payloads: the Swagger annotations in the controllers.
- There are no real users, testimonials, metrics, logo, or brand assets. Don't make any up.

## Product Principles
1. Every backend capability should be reachable and understandable in the UI, because the whole system is what gets assessed.
2. Logging a workout must be fast and forgiving. Text parsing is a shortcut, not a replacement for manual entry.
3. AI output is always something the user can review and edit, never a black box.
4. Progress should be visible: stats, records, and streaks reward consistent training.
