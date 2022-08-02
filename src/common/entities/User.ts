import { Entity, Column } from 'typeorm';
import { Base } from './Base';

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
}
