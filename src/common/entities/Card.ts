import { Entity, Column, JoinColumn, OneToOne } from 'typeorm';
import { Base } from './Base';
import { User } from './User';

@Entity('card')
export class Card extends Base {
  @Column()
  cardTrack: string;

  @Column()
  cardNumber: string;

  @Column()
  barCodeLink: string;

  @OneToOne(() => User, user => user.id)
  @JoinColumn()
  user: Card;
}
