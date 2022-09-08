import { differenceInDays } from 'date-fns';
import { Telegram } from 'telegraf';
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

async function updateUsersBalance() {
  const users = await userService.getAll({ step: 'registered' });

  const updatedUserPromises = users.map(async user => {
    await checkUserBalance(user);
  });

  Promise.all(updatedUserPromises);
}

async function checkUserBalance(user: User) {
  const currentBalance = user.balance;
  const iikoBalance = await iikoApi.getUserBalance(user.iikoId);

  if (currentBalance === iikoBalance) return;

  console.log(
    `Update order date for ${user.firstName} ${user.secondName} - ${user.telegramId}`
  );

  return await userService.update(user.telegramId, {
    balance: iikoBalance,
    lastOrderDate: new Date(),
  });
}

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Data source for update lastOrderDate initialized');
    await updateUsersBalance();
  } catch (error) {
    console.log(error);
  }
}

bootstrap();
