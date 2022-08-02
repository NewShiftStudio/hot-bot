import { Entity, Column, JoinColumn, OneToOne } from 'typeorm';
import { Base } from './Base';
import { User } from './User';

@Entity('card')
export class Card extends Base {
  @Column({ nullable: true })
  cardTrack: string;

  @Column({ nullable: true })
  cardNumber: string;

  @Column({ nullable: true })
  barCodeLink: string;

  @OneToOne(() => User, user => user.card, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  user: User;
}
