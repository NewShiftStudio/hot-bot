import { Markup, Telegram } from 'telegraf';
import { Interview } from '../common/entities/Interview';
import { interviewService } from '../common/services/interview.service';
import { userService } from '../common/services/user.service';
import { AppDataSource } from '../database/appDataSourse';

const token = process.env.USER_BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

const telegram = new Telegram(token);

async function mailingUsers() {
  const users = await userService.getAllWithInterview();

  for (const user of users) {
    const interview = user.interviews.find(
      (interview) => interview.step === 'created',
    );
    if (interview) {
      await setInterviewRequest(user.chatId, interview);
    }
  }
}

async function setInterviewRequest(chatId: number, interview: Interview) {
  const button = Markup.inlineKeyboard([
    Markup.button.callback('Давайте!', `startInterview_${interview.id}`),
    Markup.button.callback('Не хочу', `cancelInterview_${interview.id}`),
  ]);
  await interviewService.update(interview.id, {
    step: 'sended',
  });
  await telegram.sendMessage(chatId, 'Привет, давай на интервью!', button);
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
