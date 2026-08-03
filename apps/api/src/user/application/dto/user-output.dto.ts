import { UserEntity } from "@/user/domain/entities/user.entity";

export type UserOutput = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export class UserOutputMapper {
  static toOutput(user: UserEntity): UserOutput {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
}
