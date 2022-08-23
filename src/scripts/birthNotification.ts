import { differenceInDays } from 'date-fns';
import { Telegram } from 'telegraf';
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

async function congratulateUsers() {
  const usersList = await userService.getAll({
    step: 'registered',
  });

  const today = new Date();
  const currentYear = today.getFullYear();

  const congratulationsList: (Congratulation | null)[] = usersList.map(user => {
    const dateArr = user.dateOfBirth.split('.');
    const userDate = +dateArr[0];
    const userMonth = +dateArr[1] - 1;
    const userBirthDate = new Date(currentYear, userMonth, userDate);

    const difference = differenceInDays(userBirthDate, today) + 1;
    console.log(difference);

    switch (difference) {
      case 7:
        return {
          user,
          text: 'Ещё не выбрал место, где отмечать др? Лови персональную скидку в 20% и приходи уже к нам',
        };
      case 14:
        return {
          user,
          text: 'Ещё не выбрал, где отмечать др? А вот они мы, такие котики, приходи к нам',
        };
      default:
        return null;
    }
  });

  congratulationsList.forEach(congratulation => {
    if (!congratulation) return;
    const { user, text } = congratulation;
    try {
      congratulateUser(user.chatId, text);
      console.log(`Пользователь с tgId ${user.telegramId} поздравлен`);
    } catch (error) {
      console.log(
        `Возникла ошибка при поздравлении пользователя с tgId ${user.telegramId}`
      );
      console.log(error);
    }
  });
}

async function congratulateUser(userChatId: number, text: string) {
  return await telegram.sendMessage(userChatId, text);
}

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Data source for notifications initialized');
    await congratulateUsers();
  } catch (error) {
    console.log(error);
  }
}

bootstrap();
