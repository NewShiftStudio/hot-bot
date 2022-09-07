import { DataSource } from 'typeorm';
import { User } from '../common/entities/User';
import { Card } from '../common/entities/Card';
import { Post } from '../common/entities/Post';
import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [Card, User, Post],
  synchronize: true,
});
