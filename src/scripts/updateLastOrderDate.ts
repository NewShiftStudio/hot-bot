import { iikoApi } from '../api/iikoApi';
import { User } from '../common/entities/User';
import { interviewService } from '../common/services/interview.service';
import { userService } from '../common/services/user.service';
import { AppDataSource } from '../database/appDataSourse';

const token = process.env.USER_BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

async function updateUsersBalance() {
  const users = await userService.getAll({ step: 'registered' });

  for (const user of users) {
    await checkUserBalance(user);
  }
}

async function checkUserBalance(user: User) {
  const currentBalance = user.balance;
  try {
    const iikoBalance = await iikoApi.getUserBalance(user.iikoId);
    if (currentBalance === iikoBalance) return;

    console.log(
      `Update order date for ${user.firstName} ${user.secondName} - ${user.telegramId}`
    );

    const interview = await interviewService.create(user.id);
    await userService.addInterview(user.id, interview);
    return await userService.update(user.telegramId, {
      balance: iikoBalance,
      lastOrderDate: new Date(),
    });
  } catch (error) {
    console.log(`Error on user ${user.telegramId}`, error);
    return;
  }
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
