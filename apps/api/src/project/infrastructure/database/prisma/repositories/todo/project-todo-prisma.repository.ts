import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import { ProjectTodoEntity } from '@/project/domain/entities/todo/project-todo.entity';
import {
  ProjectTodoRepository,
  ProjectTodoSearchParams,
  ProjectTodoSearchResult,
} from '@/project/domain/repositories/todo/project-todo.repository';
import { Prisma } from '@generated/prisma/client';
import { ProjectTodoModelMapper } from './models/project-todo-model.mapper';

export class ProjectTodoPrismaRepository implements ProjectTodoRepository {
  sortableFields = ['title', 'createdAt', 'updatedAt'];

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

  async findAll(): Promise<ProjectTodoEntity[]> {
    const models = await this.prisma.projectTodo.findMany();
    return models.map((model) => ProjectTodoModelMapper.toEntity(model));
  }

  async search(
    props: ProjectTodoSearchParams,
  ): Promise<ProjectTodoSearchResult> {
    // SearchParams permits an empty filter, but to-dos must never be listed across projects.
    const projectId = props.filter?.projectId;
    if (!projectId) throw new Error('Project ID is required to search todos');

    const skip = (props.page - 1) * props.perPage;
    const [openCount, total] = await Promise.all([
      this.prisma.projectTodo.count({
        where: { projectId, completedAt: null },
      }),
      this.prisma.projectTodo.count({ where: { projectId } }),
    ]);
    const orderBy: Prisma.ProjectTodoOrderByWithRelationInput[] =
      props.sort && this.sortableFields.includes(props.sort)
        ? [{ [props.sort]: props.sortDir ?? 'asc' }, { id: 'asc' }]
        : [{ createdAt: 'asc' }, { id: 'asc' }];
    // Two project-scoped queries preserve createdAt/id ordering within both states.
    // A single completedAt sort would incorrectly order completed items by completion time.
    const openTake = Math.max(0, Math.min(props.perPage, openCount - skip));
    const open =
      openTake > 0
        ? await this.prisma.projectTodo.findMany({
            where: { projectId, completedAt: null },
            orderBy,
            skip,
            take: openTake,
          })
        : [];
    const remaining = props.perPage - open.length;
    const completed =
      remaining > 0
        ? await this.prisma.projectTodo.findMany({
            where: { projectId, completedAt: { not: null } },
            orderBy,
            skip: Math.max(0, skip - openCount),
            take: remaining,
          })
        : [];
    return new ProjectTodoSearchResult({
      items: [...open, ...completed].map((model) =>
        ProjectTodoModelMapper.toEntity(model),
      ),
      total,
      currentPage: props.page,
      perPage: props.perPage,
      sort: props.sort,
      sortDir: props.sortDir,
      filter: props.filter,
    });
  }
}
