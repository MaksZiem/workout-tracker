import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './exercise.entity';
import { MuscleGroup } from 'src/enums/muscle-group.enum';
import { CreateExerciseDto } from './dtos/create-exercise.dto';
import { UpdateExerciseDto } from './dtos/update-exercise.dto';
import { assignDefined } from 'src/helpers/assign-defined';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise) private repo: Repository<Exercise>,
  ) {}

  findAll(muscleGroup?: MuscleGroup) {
    return this.repo.find({
      where: muscleGroup ? { muscleGroup } : {},
    });
  }

  findOne(id: number) {
    return this.repo.findOneBy({id})
  }

  create(dto: CreateExerciseDto): Promise<Exercise> {
    const exercise = this.repo.create(dto)
    return this.repo.save(exercise)
  }

  async update(id: number, dto: UpdateExerciseDto) {
    const exercise = await this.findOne(id)
    if(!exercise) {
      throw new NotFoundException('Exercise not found')
    }
    assignDefined(exercise, dto)
    return this.repo.save(exercise)
  }

  async remove(id: number) {
    const exercise = await this.findOne(id)
    if(!exercise) {
      throw new NotFoundException('Exercise not found')
    }
    return this.repo.remove(exercise)
  }
}
