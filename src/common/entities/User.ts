import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { Base } from './Base';
import { Card } from './Card';

@Entity('user')
export class User extends Base {
  @Column()
  telegramId: number;

  @Column({ nullable: true })
  step: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  secondName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ default: 0 })
  balance: number;

  @OneToOne(() => Card, card => card.user, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  card: Card;
}
