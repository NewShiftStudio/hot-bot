import { differenceInDays } from 'date-fns';
import { Markup, Telegram } from 'telegraf';
import { iikoApi } from '../api/iikoApi';
import { User } from '../common/entities/User';
import { userService } from '../common/services/user.service';
import { AppDataSource } from '../database/appDataSourse';

type Congratulation = {
  user: User;
  text: string;
};

const token = process.env.USER_BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

const telegram = new Telegram(token);

async function mailingUsers() {
  const users = await userService.getAllWithInterview();

  for (const user of users) {
    await setInterviewRequest(user);
  }
}

async function setInterviewRequest(user: User) {
  const button = Markup.inlineKeyboard([
    Markup.button.callback('Начать!', 'startInterview'),
  ]);
  await telegram.sendMessage(user.chatId, 'Привет, давай на интервью!', button);
}

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Data source for interview mailing initialized');
    await mailingUsers();
  } catch (error) {
    console.log(error);
  }
}

bootstrap();
