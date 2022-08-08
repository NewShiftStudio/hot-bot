import { Entity, Column } from 'typeorm';
import { Base } from './Base';

@Entity('posts')
export class Post extends Base {
  @Column()
  creatorTelegramId: number;

  @Column({ nullable: true })
  text: string;

  @Column({ default: '' })
  fileIds: string;
}
