import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { Base } from './Base';
import { Card } from './Card';

@Entity('user')
export class User extends Base {
  @Column({ unique: true })
  telegramId: number;

  @Column({ nullable: true })
  chatId: number;

  @Column({ nullable: true })
  step: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  secondName: string;

  @Column({ nullable: true })
  city: string;

  @Column({ unique: true, nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ default: '' })
  iikoId: string;

  @Column({ default: 0 })
  balance: number;

  @Column({ nullable: true })
  lastOrderDate: Date;

  @Column({ default: false })
  isAdmin: boolean;

  @OneToOne(() => Card, card => card.user, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  card: Card;
}
