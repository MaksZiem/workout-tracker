import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1795460396730 implements MigrationInterface {
  name = 'Init1795460396730';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "password" character varying NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "surname" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'USER', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exercise_musclegroup_enum" AS ENUM('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'GLUTES', 'ABS', 'FULL_BODY', 'CARDIO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "muscleGroup" "public"."exercise_musclegroup_enum", "substitutesGeneratedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_4420597915e901ab5d6f2bcaee4" UNIQUE ("name"), CONSTRAINT "PK_a0f107e3a2ef2742c1e91d97c14" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise_set" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "setNumber" integer NOT NULL DEFAULT '1', "weight" numeric(6,2) NOT NULL, "reps" integer NOT NULL, "restSeconds" integer, "completed" boolean NOT NULL DEFAULT false, "workoutExerciseId" uuid, CONSTRAINT "PK_69cfb98aa32b1f317df60c81900" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_exercise" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL DEFAULT '0', "workoutId" uuid, "exerciseId" uuid, CONSTRAINT "PK_9598996a913c5f5114f9e6403b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "notes" character varying, "finishedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_ea37ec052825688082b19f0d939" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_template_exercise" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL DEFAULT '0', "targetSets" integer NOT NULL DEFAULT '3', "targetReps" integer NOT NULL, "targetWeight" numeric(6,2), "restSeconds" integer, "templateId" uuid, "exerciseId" uuid, CONSTRAINT "PK_f240b9a8ab28985e32164854249" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "notes" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_aea7bdb578979ab3fd974331f5c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "notes" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "planId" uuid, CONSTRAINT "PK_5d74a5962ac1aef92f31a334d02" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."scheduled_workout_status_enum" AS ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "scheduled_workout" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "status" "public"."scheduled_workout_status_enum" NOT NULL DEFAULT 'PLANNED', "userId" uuid, "templateId" uuid, "workoutId" uuid, CONSTRAINT "PK_7bd415ad6e264a811183e29f082" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise_substitute" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reason" character varying NOT NULL, "rank" integer NOT NULL DEFAULT '0', "exerciseId" uuid, "substituteId" uuid, CONSTRAINT "UQ_74cfbf89d48b51d33a0690691ec" UNIQUE ("exerciseId", "substituteId"), CONSTRAINT "PK_3ca3473bb724b60d1139a5c1f6e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_set" ADD CONSTRAINT "FK_22259a5ea074eb9433f21ae8248" FOREIGN KEY ("workoutExerciseId") REFERENCES "workout_exercise"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercise" ADD CONSTRAINT "FK_35fe273716366d768fba9964813" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercise" ADD CONSTRAINT "FK_a2ac7d92eeb9bd5fc2bb9896611" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout" ADD CONSTRAINT "FK_5c6e4714ac75eab49d2009f956c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_template_exercise" ADD CONSTRAINT "FK_6601dd5460c777aec53d68da75f" FOREIGN KEY ("templateId") REFERENCES "workout_template"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_template_exercise" ADD CONSTRAINT "FK_466a0e3e89f1883a73e78a1af71" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_plan" ADD CONSTRAINT "FK_5414926acb1a1a08bebf7b33bc3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_template" ADD CONSTRAINT "FK_b94d1a7d120e26dc31040928e3d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_template" ADD CONSTRAINT "FK_d598258eefa5aec8372131e13d4" FOREIGN KEY ("planId") REFERENCES "workout_plan"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_workout" ADD CONSTRAINT "FK_506ca67ef12ff73d49a830d0daa" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_workout" ADD CONSTRAINT "FK_cc68a91e507e25c78997b522331" FOREIGN KEY ("templateId") REFERENCES "workout_template"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_workout" ADD CONSTRAINT "FK_750136fb1683d627022fce2cecf" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_substitute" ADD CONSTRAINT "FK_3de4a05772ea21c72f98ee5ad2b" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_substitute" ADD CONSTRAINT "FK_001b78991cd566ec9889eaa43b7" FOREIGN KEY ("substituteId") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exercise_substitute" DROP CONSTRAINT "FK_001b78991cd566ec9889eaa43b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_substitute" DROP CONSTRAINT "FK_3de4a05772ea21c72f98ee5ad2b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_workout" DROP CONSTRAINT "FK_750136fb1683d627022fce2cecf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_workout" DROP CONSTRAINT "FK_cc68a91e507e25c78997b522331"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scheduled_workout" DROP CONSTRAINT "FK_506ca67ef12ff73d49a830d0daa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_template" DROP CONSTRAINT "FK_d598258eefa5aec8372131e13d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_template" DROP CONSTRAINT "FK_b94d1a7d120e26dc31040928e3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_plan" DROP CONSTRAINT "FK_5414926acb1a1a08bebf7b33bc3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_template_exercise" DROP CONSTRAINT "FK_466a0e3e89f1883a73e78a1af71"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_template_exercise" DROP CONSTRAINT "FK_6601dd5460c777aec53d68da75f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout" DROP CONSTRAINT "FK_5c6e4714ac75eab49d2009f956c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercise" DROP CONSTRAINT "FK_a2ac7d92eeb9bd5fc2bb9896611"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercise" DROP CONSTRAINT "FK_35fe273716366d768fba9964813"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercise_set" DROP CONSTRAINT "FK_22259a5ea074eb9433f21ae8248"`,
    );
    await queryRunner.query(`DROP TABLE "exercise_substitute"`);
    await queryRunner.query(`DROP TABLE "scheduled_workout"`);
    await queryRunner.query(
      `DROP TYPE "public"."scheduled_workout_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "workout_template"`);
    await queryRunner.query(`DROP TABLE "workout_plan"`);
    await queryRunner.query(`DROP TABLE "workout_template_exercise"`);
    await queryRunner.query(`DROP TABLE "workout"`);
    await queryRunner.query(`DROP TABLE "workout_exercise"`);
    await queryRunner.query(`DROP TABLE "exercise_set"`);
    await queryRunner.query(`DROP TABLE "exercise"`);
    await queryRunner.query(`DROP TYPE "public"."exercise_musclegroup_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
