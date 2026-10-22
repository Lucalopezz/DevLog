import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProjectTodoEntity } from '@/project/domain/entities/todo/project-todo.entity';
import {
  ProjectTodoPage,
  ProjectTodoRepository,
} from '@/project/domain/repositories/todo/project-todo.repository';
import { ProjectTodoModelMapper } from './models/project-todo-model.mapper';

export class ProjectTodoPrismaRepository implements ProjectTodoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insert(entity: ProjectTodoEntity): Promise<void> {
    await this.prisma.projectTodo.create({
      data: ProjectTodoModelMapper.toPersistence(entity),
    });
  }

  async update(entity: ProjectTodoEntity): Promise<void> {
    await this.prisma.projectTodo.update({
      where: { id: entity.id },
      data: {
        title: entity.title,
        completedAt: entity.completedAt ?? null,
        updatedAt: entity.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.projectTodo.delete({ where: { id } });
  }

  async findById(id: string): Promise<ProjectTodoEntity | null> {
    const model = await this.prisma.projectTodo.findUnique({ where: { id } });
    return model ? ProjectTodoModelMapper.toEntity(model) : null;
  }

  async search(
    projectId: string,
    page: number,
    perPage: number,
  ): Promise<ProjectTodoPage> {
    const skip = (page - 1) * perPage;
    const [openCount, total] = await Promise.all([
      this.prisma.projectTodo.count({
        where: { projectId, completedAt: null },
      }),
      this.prisma.projectTodo.count({ where: { projectId } }),
    ]);
    const orderBy = [{ createdAt: 'asc' as const }, { id: 'asc' as const }];
    // Two indexed partitions preserve createdAt/id ordering within both states.
    // A single completedAt sort would incorrectly order completed items by completion time.
    const openTake = Math.max(0, Math.min(perPage, openCount - skip));
    const open =
      openTake > 0
        ? await this.prisma.projectTodo.findMany({
            where: { projectId, completedAt: null },
            orderBy,
            skip,
            take: openTake,
          })
        : [];
    const remaining = perPage - open.length;
    const completed =
      remaining > 0
        ? await this.prisma.projectTodo.findMany({
            where: { projectId, completedAt: { not: null } },
            orderBy,
            skip: Math.max(0, skip - openCount),
            take: remaining,
          })
        : [];
    return {
      items: [...open, ...completed].map((model) =>
        ProjectTodoModelMapper.toEntity(model),
      ),
      total,
      currentPage: page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }
}
