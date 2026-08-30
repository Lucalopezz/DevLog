import type { ProjectCommandOutput } from '@/project/application/dto/project-command.dto';

export class ProjectCommandPresenter {
  id: string;
  projectId: string;
  title: string;
  command: string;
  description?: string;
  executionOrder?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(output: ProjectCommandOutput) {
    this.id = output.id;
    this.projectId = output.projectId;
    this.title = output.title;
    this.command = output.command;
    this.description = output.description;
    this.executionOrder = output.executionOrder;
    this.createdAt = output.createdAt;
    this.updatedAt = output.updatedAt;
  }
}
