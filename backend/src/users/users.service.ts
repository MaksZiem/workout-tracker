import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { capitalize } from 'src/helpers/capitalize';
import { hashPassword } from 'src/helpers/hash-password';
import { assignDefined } from 'src/helpers/assign-defined';
import { Workout } from 'src/workout/workout.entity';
import { UserRole } from 'src/enums/user-role.enum';
import { FindUsersDto, UserSortField } from './dtos/find-users.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(email: string, password: string, name: string, surname: string) {
    const user = this.repo.create({
      email,
      password,
      name: capitalize(name),
      surname: capitalize(surname),
    });
    return this.repo.save(user);
  }

  findOne(id: number) {
    return this.repo.findOneBy({id})
  }

  /**
   * Strona listy użytkowników z liczbą treningów (dla panelu administratora):
   * wyszukiwanie po imieniu, nazwisku i e-mailu, sortowanie i paginacja w bazie.
   */
  async findPage(filters: FindUsersDto) {
    const limit = Number(filters.limit ?? 20)
    const sort = filters.sort ?? 'name'
    const order = filters.order === 'desc' ? 'DESC' : 'ASC'
    const search = filters.search?.trim()

    const where = (qb: SelectQueryBuilder<User>) => {
      if (search) {
        // % i _ z frazy traktujemy dosłownie, nie jako wzorzec ILIKE.
        const q = `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
        qb.where(
          "(u.name ILIKE :q OR u.surname ILIKE :q OR u.email ILIKE :q OR (u.name || ' ' || u.surname) ILIKE :q)",
          { q },
        )
      }
      return qb
    }

    const total = await where(this.repo.createQueryBuilder('u')).getCount()
    const pageCount = Math.max(1, Math.ceil(total / limit))
    const page = Math.min(Number(filters.page ?? 1), pageCount)

    const query = where(
      this.repo
        .createQueryBuilder('u')
        .leftJoin(Workout, 'w', 'w."userId" = u.id')
        .select(['u.id AS id', 'u.email AS email', 'u.name AS name', 'u.surname AS surname', 'u.role AS role'])
        .addSelect('COUNT(w.id)', 'workoutCount')
        .groupBy('u.id'),
    )
    const byField: Record<UserSortField, string[]> = {
      name: ['LOWER(u.name)', 'LOWER(u.surname)'],
      email: ['LOWER(u.email)'],
      role: ['u.role'],
      workoutCount: ['"workoutCount"'],
    }
    byField[sort].forEach((expr, i) => (i ? query.addOrderBy(expr, order) : query.orderBy(expr, order)))
    if (sort === 'role' || sort === 'workoutCount') {
      // Remis (ta sama rola, tyle samo treningów) rozstrzyga alfabet, jak na liście domyślnej.
      byField.name.forEach((expr) => query.addOrderBy(expr, 'ASC'))
    }
    // Stała kolejność przy pozostałych remisach, żeby wiersze nie skakały między stronami.
    query.addOrderBy('u.id', 'ASC')

    const rows = await query
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ id: number; email: string; name: string; surname: string; role: UserRole; workoutCount: string }>()

    return {
      items: rows.map((r) => ({ ...r, workoutCount: Number(r.workoutCount) })),
      total,
      page,
      limit,
      pageCount,
    }
  }

  find(email: string) {
    return this.repo.find({where: {email}})
  }

  async update(id: number, attrs: Partial<User>) {
    const user = await this.findOne(id)
    if(!user) {
      throw new NotFoundException('User not found')
    }
    if(attrs.password) {
      attrs.password = await hashPassword(attrs.password)
    }

    assignDefined(user, attrs)
    return this.repo.save(user)
  }

  async remove(id: number) {
    const user = await this.findOne(id)
     if(!user) {
      throw new NotFoundException('User not found')
    }
    return this.repo.remove(user)
  }
}
