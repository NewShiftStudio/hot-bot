import { DataSource } from 'typeorm';
import { User } from '../common/entities/User';
import { Card } from '../common/entities/Card';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'test.sqlite',
  entities: [Card, User],
  synchronize: true,
});
