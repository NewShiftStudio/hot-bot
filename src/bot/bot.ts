import { Markup, Telegraf } from 'telegraf';
import { questions } from './questions';
import { userService } from '../common/services/user.service';
import { validateDateOfBirth } from '../helpers/dobValidator';
import { validatePhoneNumber } from '../helpers/phoneValidation';
import { ValidationResult } from '../@types/entities/ValidationResult';

import dotenv from 'dotenv';
dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

export const bot = new Telegraf(token);

bot.command('start', ctx => {
  ctx.reply(
    'Добро пожаловать в hot-bot. Список команд:\n\n/register - регистрация в системе скидок\n/delete - удаление вашего профиля из системы скидок'
  );
});

bot.command('delete', async ctx => {
  const telegramId = ctx.message.from.id;
  try {
    await userService.delete(telegramId);
    ctx.reply('Вы успешно удалены из базы');
  } catch (error) {
    console.log(error);
    ctx.reply('Произошла ошибка при удалении');
  }
});

bot.command('register', async ctx => {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);

  if (!user) {
    await userService.create({ telegramId, step: 'firstName' });
    const firstQuestion = questions.firstName.label;
    ctx.reply(firstQuestion);
  } else {
    ctx.reply('Вы уже зарегистрированы!');
  }
});

bot.command('balance', async ctx => {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);

  if (!user) {
    return ctx.reply(
      'Вы не зарегистрированы. Чтобы отобразить ваш баланс, пожалуйста пройдите регистрацию, написал /register '
    );
  }

  return ctx.reply(
    `Ваш баланс ${user.balance}`,
    Markup.inlineKeyboard([Markup.button.callback('Списать баллы', 'spend')])
  );
});

bot.on('text', async ctx => {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user) return;

  const step = user.step;
  if (step === 'registered') {
    return;
  }
  const answer = ctx.message.text;
  const question = questions[step];

  const validationResult = await validateStep(step, answer);

  if (validationResult.status !== 'success') {
    return ctx.reply(validationResult.message);
  }

  if (!question) {
    console.error(
      `У пользователя ${telegramId} произошла ошибка на этапе ${step}`
    );
    return ctx.reply('Возникла ошибка. Обратитесь к администратору');
  }

  const nextStep = question.nextStep;

  if (!nextStep) {
    console.error(
      `У пользователя ${telegramId} произошла ошибка. Отсутствует этап после ${step}`
    );
    return ctx.reply('Возникла ошибка. Обратитесь к администратору');
  }

  try {
    await userService.update(telegramId, {
      [step]: answer,
      step: nextStep,
    });
  } catch (error) {
    console.log(error);
    return ctx.reply(
      'Не удалось сохранить данные. Обратитесь к администратору'
    );
  }

  if (nextStep === 'registered') {
    await userService.setCard(user.id);
    await userService.update(telegramId, { balance: 200 });
    await ctx.reply('✅ Скидочная карта создана');
    await ctx.reply(
      '❗️ Интеграция с iiko пока не работает. По плану на этом этапе уже создана и назначена карта. Теперь все эти данные отправляются в iiko и назначается нормальный баланс.\n\nP.S. Сейчас он замокан'
    );
    return ctx.reply(
      'Вы успешно зарегистрировались!\n\nВам начислено 200 бонусов за регистрацию. Теперь вы можете проверить свой баланс, написав команду /balance'
    );
  }

  return ctx.reply(questions[nextStep].label);
});

bot.action('spend', async ctx => {
  ctx.answerCbQuery();
  const telegramId = ctx.callbackQuery.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user) return;
  await userService.update(telegramId, { balance: 0 });
  ctx.replyWithPhoto(
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=830&q=80',
    {
      caption: `Ха-ха. Теперь ты на нуле!\n\nШучу. Вот инфа о твоей карте и тп:\n\ncardNumber: ${user.card.cardNumber}\nbarCodeFile: ${user.card.barCodeLink}\n\n(Тут идет отправка бар-кода. Ее пока нельзя осуществить по причине того, что тг не дает отправлять медиа с локального сервера. Поэтому вот фото котика)`,
    }
  );
});

async function validateStep(
  stepName: string,
  answer: string
): Promise<ValidationResult> {
  switch (stepName) {
    case 'dateOfBirth':
      return validateDateOfBirth(answer);
    case 'phoneNumber':
      const user = await userService.findOneByPhone(answer);
      if (!user) return validatePhoneNumber(answer);
      return {
        status: 'error',
        message: 'Пользователь с таким номером уже зарегистрирован!',
      };
    default:
      return {
        status: 'success',
        message: '',
      };
  }
}
