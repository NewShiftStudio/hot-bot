import { DataSource } from 'typeorm';
import { User } from '../common/entities/User';
import { Card } from '../common/entities/Card';
import { Post } from '../common/entities/Post';
import dotenv from 'dotenv';
dotenv.config();

const dbPath = process.env.DB_PATH;

if (!dbPath) {
  throw new Error('Empty db path');
}

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  entities: [Card, User, Post],
  synchronize: true,
});
