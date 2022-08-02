import { Telegraf } from 'telegraf';

import dotenv from 'dotenv';
dotenv.config();

import './server';
import { questions } from './questions';

import { userService } from './common/services/user.service';
import { validateDateOfBirth } from './helpers/dobValidator';
import { validatePhoneNumber } from './helpers/phoneValidation';
import { ValidationResult } from './@types/entities/ValidationResult';

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error('BOT_TOKEN must be provided!');
}

const bot = new Telegraf(token);

bot.command('start', async ctx => {
  ctx.reply('Я живой!');
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
    return ctx.reply('Вы успешно зарегистрировались!');
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

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
