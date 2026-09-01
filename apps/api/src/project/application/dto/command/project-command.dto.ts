import { ProjectCommandEntity } from '@/project/domain/entities/command/project-command.entity';

export type ProjectCommandOutput = {
  id: string;
  projectId: string;
  title: string;
  command: string;
  description?: string;
  executionOrder?: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ProjectCommandOutputMapper {
  static toOutput(projectCommand: ProjectCommandEntity): ProjectCommandOutput {
    return {
      id: projectCommand.id,
      projectId: projectCommand.projectId,
      title: projectCommand.title,
      command: projectCommand.command,
      description: projectCommand.description,
      executionOrder: projectCommand.executionOrder,
      createdAt: projectCommand.createdAt,
      updatedAt: projectCommand.updatedAt,
    };
  }
}
