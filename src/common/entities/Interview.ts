import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from './Base';
import { User } from './User';

@Entity('interview')
export class Interview extends Base {
  @Column({ nullable: true })
  step: string; // created, sended, ...steps, closed, canceled

  @Column({ nullable: true })
  dish: number;

  @Column({ nullable: true })
  service: number;

  @Column({ nullable: true })
  cocktailCard: number;

  @Column({ nullable: true })
  purity: number;

  @ManyToOne(() => User, (user) => user.interviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}
