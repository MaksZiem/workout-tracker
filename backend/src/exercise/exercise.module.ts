import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { Exercise } from './exercise.entity';
import { UsersModule } from 'src/users/users.module';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise]), UsersModule, GeminiModule],
  controllers: [ExerciseController],
  providers: [ExerciseService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
