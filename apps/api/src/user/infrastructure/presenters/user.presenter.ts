import { UserOutput } from '@/user/application/dto/user-output.dto';

export class UserPresenter {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(output: UserOutput) {
    this.id = output.id;
    this.name = output.name;
    this.email = output.email;
    this.createdAt = output.createdAt;
    this.updatedAt = output.updatedAt;
  }
}
