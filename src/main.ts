import { AppDataSource } from './database/appDataSourse';
import { bot } from './bot/bot';

export async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
    await bot.launch();
    console.log('Bot successfully launched!');
  } catch (error) {
    console.log(error);
  }
}

bootstrap();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
