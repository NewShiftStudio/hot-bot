import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { Base } from './Base';
import { Card } from './Card';

@Entity('user')
export class User extends Base {
  @Column()
  telegramId: number;

  @Column({ default: '' })
  step: string;

  @Column({ default: '' })
  firstName: string;

  @Column({ default: '' })
  secondName: string;

  @Column({ default: '' })
  phoneNumber: string;

  @Column({ default: '' })
  dateOfBirth: string;

  @Column({ default: 0 })
  balance: number;

  @OneToOne(() => Card, card => card.id)
  @JoinColumn()
  card: Card;
}
