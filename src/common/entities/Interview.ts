import { Entity, Column, JoinColumn, OneToOne } from 'typeorm';
import { Base } from './Base';
import { User } from './User';

@Entity('interview')
export class Interview extends Base {
  @Column({ nullable: true })
  step: string; // init, 'step', closed

  @Column({ nullable: true })
  dish: number;

  @Column({ nullable: true })
  service: number;

  @Column({ nullable: true })
  cocktailCard: number;

  @Column({ nullable: true })
  purity: number;

  @OneToOne(() => User, user => user.interview, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;
}
