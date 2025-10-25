import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { AbstractEntity } from '../abstract.entity';

export abstract class AbstractService<T extends AbstractEntity> {
  protected repository: Repository<T>;

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findOne(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
  }

  async findOneBy(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where });
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async update(id: string, updateData: Partial<T>): Promise<T | null> {
    await this.repository.update(id, updateData as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }
}
