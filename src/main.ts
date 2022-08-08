import { AppDataSource } from './database/appDataSourse';
import { bot as userBot } from './bot/user/bot';

export async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
    await userBot.launch();
    console.log('User bot successfully launched!');
  } catch (error) {
    console.log(error);
  }
}

bootstrap();

process.once('SIGINT', () => {
  userBot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  userBot.stop('SIGTERM');
});
