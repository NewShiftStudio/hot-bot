import { AppDataSource } from './database/appDataSourse';
import { bot as userBot } from './bot/bot';
import { app } from './server/server';
import { getRequiredEnvsByNodeEnv } from './helpers/gerRequiredEnvsByNodeEnv';
import type { NodeEnv } from './@types/entities/App';
import { launchStaticServer } from './server/staticServer';

const envs = [
  'NODE_ENV',
  'USER_BOT_TOKEN',
  'BAR_CODES_FOLDER',
  'STATIC_SERVER_PORT',
  'STATIC_SERVER_URL',
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
    await launchStaticServer();
    console.log(
      `Static server launched at PORT: ${process.env.STATIC_SERVER_PORT}`,
    );
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

if (process.env.NODE_ENV === 'local') {
  process.once('SIGINT', () => userBot.stop('SIGINT'));
  process.once('SIGTERM', () => userBot.stop('SIGTERM'));
}
