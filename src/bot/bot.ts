import { Context, Markup, Telegraf } from 'telegraf';
import { questions } from './questions';
import { userService } from '../common/services/user.service';
import { validateDateOfBirth } from '../helpers/dobValidator';
import { validatePhoneNumber } from '../helpers/phoneValidation';
import { ValidationResult } from '../@types/entities/ValidationResult';

import dotenv from 'dotenv';
import { getDeclensionWordByCount } from '../helpers/wordHelper';
dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

export const bot = new Telegraf(token);

const SHOW_BALANCE_TEXT = '💰 Показать баланс';
const SPEND_TEXT = '💳 Использовать баллы';

bot.hears(SHOW_BALANCE_TEXT, showBalance);
bot.command('balance', spend);

bot.hears(SPEND_TEXT, spend);
bot.command('spend', spend);

bot.start(async ctx => {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);
  const chatId = ctx.message.chat.id;
  if (!user) {
    ctx.reply(
      'Добро пожаловать в hot-bot.\n\nЭто бот со скидочными картами.\nЧтобы получить доступ ответьте на пару вопрос для регистрации в программе лояльности'
    );
    await userService.create({ telegramId, chatId, step: 'firstName' });
    const firstQuestion = questions.firstName.label;
    return ctx.reply(firstQuestion);
  }

  if (user.step !== 'registered') {
    return ctx.reply('Пожалуйста, завершите регистрацию');
  }

  return ctx.reply(
    'Добро пожаловать в hot-not! ',
    Markup.keyboard([[SHOW_BALANCE_TEXT, SPEND_TEXT]])
      .oneTime()
      .resize()
  );
});

bot.command('delete', async ctx => {
  const telegramId = ctx.message.from.id;
  try {
    await userService.delete(telegramId);
    ctx.reply('Вы успешно удалены из базы', Markup.removeKeyboard());
  } catch (error) {
    console.log(error);
    ctx.reply('Произошла ошибка при удалении');
  }
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
      'Вы успешно зарегистрировались!\n\nВам начислено 200 бонусов за регистрацию. Теперь вы можете проверить свой баланс, написав команду /balance',
      Markup.keyboard([[SHOW_BALANCE_TEXT, SPEND_TEXT]])
        .oneTime()
        .resize()
    );
  }

  return ctx.reply(questions[nextStep].label);
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

async function showBalance(ctx: any) {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user)
    return ctx.reply(
      'Для получения информации о балансе необходимо завершить регистрацию'
    );
  return ctx.replyWithMarkdown(
    `На данный момент ваш баланс: _${user.balance} ${getDeclensionWordByCount(
      user.balance,
      ['баллов', 'балл', 'балла']
    )}_.`
  );
}

async function spend(ctx: any) {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user)
    return ctx.reply('Для списания баллов необходимо зарегистрироваться');
  await userService.update(telegramId, { balance: 0 });
  return ctx.replyWithPhoto(
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=830&q=80',
    {
      caption: `Отлично! Для списания баллов просто покажите этот бар-код вашему официанту\n\ncardNumber: ${user.card.cardNumber}\nbarCodeFile: ${user.card.barCodeLink}`,
    }
  );
}
