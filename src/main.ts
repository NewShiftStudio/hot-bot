import { AppDataSource } from './database/appDataSourse';
import { bot as userBot } from './bot/bot';
import { app } from './server/server';

export async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    if (process.env.NODE_ENV === 'development') {
      await userBot.launch();
      console.log('Bot successfully launched!');
    } else {
      app.use(userBot.webhookCallback('/bot'));
      await userBot.telegram.setWebhook(`${process.env.USER_SERVER_URL}/bot`);
      console.log('Webhook successfully launched');
    }
  } catch (error) {
    console.log(error);
  }
}

bootstrap();

if (process.env.NODE_ENV === 'development') {
  process.once('SIGINT', () => userBot.stop('SIGINT'));
  process.once('SIGTERM', () => userBot.stop('SIGTERM'));
}
