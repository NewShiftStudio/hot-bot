import { Telegram } from 'telegraf';
import { userService } from '../common/services/user.service';
import { AppDataSource } from '../database/appDataSourse';

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

const telegram = new Telegram(token);

async function congratulateUsers() {
  const usersList = await userService.getAll();

  const today = new Date();

  const date = today.getDate();
  const month = today.getMonth() + 1;

  const filteredUsers = usersList.filter(user => {
    const dateArr = user.dateOfBirth.split('.');
    const userDate = +dateArr[0];
    const userMonth = +dateArr[1];

    return userDate === date && userMonth === month && user.chatId;
  });

  console.log(filteredUsers);
  filteredUsers.forEach(user => {
    try {
      congratulateUser(user.chatId);
      console.log(`Пользователь с tgId ${user.telegramId} поздравлен`);
    } catch (error) {
      console.log(
        `Возникла ошибка при поздравлении пользователя с tgId ${user.telegramId}`
      );
      console.log(error);
    }
  });
}

async function congratulateUser(userChatId: number) {
  return await telegram.sendMessage(userChatId, 'тест рассылка!!');
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
