import { AppDataSource } from './database/appDataSourse';
import { bot as userBot } from './bot/bot';
import { app } from './server/server';
import { getRequiredEnvsByNodeEnv } from './helpers/gerRequiredEnvsByNodeEnv';
import type { NodeEnv } from './@types/entities/App';

const envs = [
  'NODE_ENV',
  'USER_BOT_TOKEN',
  'PUBLIC_FOLDER',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'IIKO_API_LOGIN',
  'REGISTER_ADMIN_PASSWORD',
];

const requiredEnvs = getRequiredEnvsByNodeEnv(
  { common: envs, development: ['SENTRY_DSN'], production: ['SENTRY_DSN'] },
  process.env.NODE_ENV as NodeEnv,
);

requiredEnvs.forEach((envKey) => {
  if (!process.env[envKey]) {
    throw new Error(`Added ${envKey} to .env file !!`);
  }
});

export async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    if (process.env.NODE_ENV === 'local') {
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
