import { differenceInCalendarDays } from 'date-fns';
import { Telegram } from 'telegraf';
import { userService } from '../common/services/user.service';
import { AppDataSource } from '../database/appDataSourse';

const token = process.env.USER_BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

const telegram = new Telegram(token);

async function notifyUsers() {
  const usersList = await userService.getAll({
    step: 'registered',
  });
  const today = new Date();

  const filteredUsers = usersList.filter(user => {
    if (!user.lastOrderDate) return;
    const daysFromLastOrder = differenceInCalendarDays(
      user.lastOrderDate,
      today
    );
    console.log('daysFromLastOrder', daysFromLastOrder);
    if (daysFromLastOrder >= 0) return;
    console.log(daysFromLastOrder % 30);
    return daysFromLastOrder % 30 === 0;
  });

  console.log(filteredUsers);
  filteredUsers.forEach(user => {
    try {
      notifyUser(user.chatId);
      console.log(`Пользователь с tgId ${user.telegramId} поздравлен`);
    } catch (error) {
      console.log(
        `Возникла ошибка при поздравлении пользователя с tgId ${user.telegramId}`
      );
      console.log(error);
    }
  });
}

async function notifyUser(userChatId: number) {
  return await telegram.sendMessage(
    userChatId,
    'Вы давно не совершали покупочки! Даем вам скидку на бутерброд и пиво'
  );
}

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Data source for notifications initialized');
    await notifyUsers();
  } catch (error) {
    console.log(error);
  }
}

bootstrap();
