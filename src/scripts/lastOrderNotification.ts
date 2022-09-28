import { differenceInCalendarDays } from 'date-fns';
import { Telegram } from 'telegraf';
import { User } from '../common/entities/User';
import { userService } from '../common/services/user.service';
import { AppDataSource } from '../database/appDataSourse';

const token = process.env.USER_BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

type Notification = {
  user: User;
  text: string;
};

const NOTIFICATION_30_DAYS =
  'Есть планы на выходные? Ваш баланс: 350. Новый прекрасный месяц, чтобы порадовать себя. Ждем вас на гастротерапию в est. 1993 🌭\n\nЗабронировать можно по номерам телефонов тут 👇🏼\n\nEst1993.ru';

const NOTIFICATION_60_DAYS =
  'Видим, что давно у нас не были.. Заходите! 💃 Дарим 200 баллов за верность. Эти баллы сгорят через 4 дня, успей потратить!\n\nЗабронировать можно по номерам телефонов тут 👇🏼\n\nEst1993.ru';

const telegram = new Telegram(token);

async function notifyUsers() {
  const usersList = await userService.getAll({
    step: 'registered',
  });
  const today = new Date();

  const usersToNotify = usersList.reduce<Notification[]>((acc, user) => {
    if (!user.lastOrderDate) return acc;
    const daysFromLastOrder = differenceInCalendarDays(
      today,
      user.lastOrderDate,
    );
    if (daysFromLastOrder <= 0) return acc;
    switch (daysFromLastOrder) {
      case 30:
        acc.push({
          user,
          text: NOTIFICATION_30_DAYS,
        });
        return acc;
      case 60:
        acc.push({
          user,
          text: NOTIFICATION_60_DAYS,
        });
        return acc;
      default:
        return acc;
    }
  }, []);

  usersToNotify.forEach((notification) => {
    try {
      notifyUser(notification.user.chatId, notification.text);
      console.log(
        `Пользователь с tgId ${notification.user.telegramId} оповещен`,
      );
    } catch (error) {
      console.log(
        `Возникла ошибка при поздравлении пользователя с tgId ${notification.user.telegramId}}`,
      );
      console.log(error);
    }
  });
}

async function notifyUser(userChatId: number, text: string) {
  return await telegram.sendMessage(userChatId, text);
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
