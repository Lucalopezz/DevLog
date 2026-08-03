import { RepositoryInterface } from '@/shared/domain/repositories/repository-contract';
import { UserEntity } from '../entities/user.entity';

export interface UserRepository extends RepositoryInterface<UserEntity> {
  findByEmail(email: string): Promise<UserEntity | null>;
}
