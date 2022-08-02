import { DataSource } from 'typeorm';
import { User } from './common/entities/User';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'test.sqlite',
  entities: [User],
  synchronize: true,
});

export const initializeDB = () => {
  try {
    AppDataSource.initialize();
    console.log('Data Source has been initialized!');
  } catch (error) {
    console.error('Error during Data Source initialization', error);
  }
};

initializeDB();
