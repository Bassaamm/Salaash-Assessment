import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class AbstractEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: Date })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt?: Date;

  @Exclude({ toPlainOnly: true })
  @DeleteDateColumn({ select: false, type: 'timestamptz' })
  deletedAt?: Date;
}
