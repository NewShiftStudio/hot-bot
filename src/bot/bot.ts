import { Context, Markup, Telegraf, Telegram } from 'telegraf';
import { registrationQuestions } from '../constants/registrationQuestions';
import { userService } from '../common/services/user.service';
import { getDeclensionWordByCount } from '../helpers/wordHelper';
import { postService } from '../common/services/post.service';
import { interviewService } from '../common/services/interview.service';
import { interviewQuestions } from '../constants/interviewQuestions';
import { adminButtons, clientButtons } from '../constants/buttons';
import { userBotService } from './services/userBot.service';

import dotenv from 'dotenv';
dotenv.config();

const userToken = process.env.USER_BOT_TOKEN;

if (!userToken) {
  throw new Error('USER_BOT_TOKEN must be provided!');
}

export const bot = new Telegraf(userToken);

const HELLO_MESSAGE_TEXT =
  'Добро пожаловать в бот Est. 1993.\n\nЭто бот программы лояльности. С его помощью вы сможете копить баллы и тратить их на наши легендарные хот-доги.\n\nЧтобы стать участником программы, пожалуйста, зарегистрируйтесь. Это займёт не больше двух минут — просто ответьте на несколько вопросов.';

const SHOW_BALANCE_TEXT = '💰 Показать баланс';
const SPEND_TEXT = '💳 Использовать баллы';

bot.command('balance', userBotService.showBalance);
bot.hears(SHOW_BALANCE_TEXT, userBotService.showBalance);

bot.command('spend', userBotService.sendBarCode);
bot.hears(SPEND_TEXT, userBotService.sendBarCode);

bot.command('/cityStats', userBotService.getCityStats);
bot.hears('📊 Статистика', userBotService.getCityStats);

bot.command('/createXls', userBotService.getXlsFile);
bot.hears('📋 Результаты опроса', userBotService.getXlsFile);

bot.command('/createPost', userBotService.createPost);
bot.hears('📝 Создать пост', userBotService.createPost);

bot.start(async (ctx) => {
  const telegramId = ctx.message.from.id;

  const user = await userService.getByTelegramId(telegramId);
  if (!user) {
    return ctx.reply(
      HELLO_MESSAGE_TEXT,
      Markup.inlineKeyboard([
        Markup.button.callback('Давайте ваши вопросы', 'register'),
      ]),
    );
  }

  if (user.step !== 'registered') {
    return ctx.reply('Пожалуйста, завершите регистрацию');
  }

  return ctx.reply('Добро пожаловать в hot-not! ', clientButtons);
});

bot.command('delete', async (ctx) => {
  const telegramId = ctx.message.from.id;
  try {
    await userService.delete(telegramId);
    ctx.reply('Вы успешно удалены из базы', Markup.removeKeyboard());
  } catch (error) {
    console.log(error);
    ctx.reply('Произошла ошибка при удалении');
  }
});

bot.command('/registerAdmin', async (ctx) => {
  if (
    ctx.message.text.slice(14).trim() !== process.env.REGISTER_ADMIN_PASSWORD
  ) {
    return;
  }

  const telegramId = ctx.from.id;

  try {
    await userService.update(telegramId, {
      isAdmin: true,
    });
    return ctx.reply(
      'Отлично! Теперь вы можете:\nСоздавать рассылки используя команду /createPost\nПолучать статистику по городам /cityStats',
      adminButtons,
    );
  } catch (error) {
    console.log(error);
    return ctx.reply('Произошла ошибка при назначении роли');
  }
});

bot.hears('◀️ Назад', async (ctx) => {
  const telegramId = ctx.from.id;
  try {
    await postService.deleteByCreatorId(telegramId);
    ctx.reply('Пост удален', adminButtons);
  } catch (error) {
    console.log(error);
    ctx.reply('Произошла ошибка при выходе из режима создания поста');
  }
});

bot.hears('📋 Показать результат', async (ctx) => {
  const telegramId = ctx.from.id;

  const post = await postService.getOne({ creatorTelegramId: telegramId });
  if (!post) return;

  if (!post.text && !post.fileIds)
    return ctx.reply(
      'Нельзя отправить пост без контента.\n\nВведите текст или приложите фото',
    );

  if (!post.fileIds) {
    await ctx.reply(post.text);
  } else {
    const media: any = post.fileIds
      .trim()
      .split(' ')
      .map((id, index) => ({
        type: 'photo',
        media: id,
        caption: index === 0 ? post.text : '',
      }));

    await ctx.replyWithMediaGroup(media);
  }

  return ctx.reply(
    'Сделать рассылку?',
    Markup.inlineKeyboard([Markup.button.callback('Отправить', 'send')]),
  );
});

bot.on('text', async (ctx) => {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user) return;

  const messageText = ctx.message.text;

  if (user.isAdmin) {
    userBotService.savePostText(ctx, telegramId, messageText);
  }

  const step = user.step;

  if (step !== 'registered') {
    return userBotService.saveUserRegisterAnswer(ctx, user, messageText);
  }

  const interview = user.interviews.find(
    (interview) =>
      !['closed', 'init', 'canceled', 'sended'].includes(interview.step),
  );

  if (interview) {
    return userBotService.saveInterviewAnswer(ctx, interview, messageText);
  }

  return;
});

bot.on('photo', async (ctx) => {
  const telegramId = ctx.from.id;
  const post = await postService.getOne({ creatorTelegramId: telegramId });
  if (!post) return;

  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  const newFilesList = post.fileIds + ' ' + fileId;
  await postService.update(telegramId, {
    fileIds: newFilesList,
  });
  return ctx.reply('Фото добавлено!');
});

bot.action(/answer_[A-Za-z0-9]*_\w*/, async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return ctx.answerCbQuery('Произошла ошибка');

  ctx.answerCbQuery();

  const actionsString = ctx.match[0];
  const [_, step, value] = actionsString.split('_');

  if (!step || !value) return;
  const question = registrationQuestions[step];
  if (!question) return;
  const nextStep = question.nextStep;

  const answerLabel =
    question.answers?.find((answer) => answer.value === value)?.label || '';
  ctx.editMessageText(`Ваш город -  _${answerLabel}_`, {
    parse_mode: 'Markdown',
  });
  try {
    await userService.update(telegramId, {
      [step]: value,
      step: nextStep,
    });
  } catch (error) {
    console.log(error);
    return ctx.reply(
      'Не удалось сохранить данные. Обратитесь к администратору',
    );
  }

  const nextQuestion = registrationQuestions[nextStep];

  if (nextQuestion.answers) {
    const buttons = nextQuestion.answers.map((answer) =>
      Markup.button.callback(
        answer.label,
        `answer_${nextStep}_${answer.value}`,
      ),
    );
    return ctx.reply(nextQuestion.label, Markup.inlineKeyboard(buttons));
  }
  return ctx.reply(nextQuestion.label);
});

bot.action(/startInterview_[0-9]*/, async (ctx) => {
  ctx.answerCbQuery();
  ctx.deleteMessage();

  const actionsString = ctx.match[0];
  const [_, interviewId] = actionsString.split('_');

  const interview = await interviewService.getOne(+interviewId);

  if (!interview) return ctx.reply('Простите, срок ответа истек');

  await interviewService.update(interview.id, {
    step: 'dish',
  });
  await ctx.reply('Да начнется интервью! Ответы от 1 до 10!!');
  return ctx.reply(interviewQuestions.dish.label);
});

bot.action(/cancelInterview_[0-9]*/, async (ctx) => {
  ctx.answerCbQuery();
  ctx.deleteMessage();

  const actionsString = ctx.match[0];
  const [_, interviewId] = actionsString.split('_');

  const interview = await interviewService.getOne(+interviewId);

  if (!interview) return ctx.reply('Простите, срок ответа истек');

  await interviewService.update(interview.id, {
    step: 'canceled',
  });
  return await ctx.reply('Вы отказались от прохождения опроса(');
});

bot.action('send', async (ctx) => {
  ctx.answerCbQuery();
  ctx.deleteMessage();
  const telegramId = ctx.from?.id;

  if (!telegramId) return;

  const post = await postService.getOne({ creatorTelegramId: telegramId });
  if (!post) return;

  const usersList = await userService.getAll({ step: 'registered' });
  let successMessagesCount = 0;
  if (post.fileIds) {
    successMessagesCount = await userBotService.sendMediaMessage(
      usersList,
      post.fileIds,
      post.text,
    );
  } else {
    successMessagesCount = await userBotService.sendTextMessage(
      usersList,
      post.text,
    );
  }

  await postService.deleteByCreatorId(telegramId);
  await ctx.reply(
    `Сообщение получили ${successMessagesCount} ${getDeclensionWordByCount(
      successMessagesCount,
      ['пользователей', 'пользователь', 'пользователя'],
    )} из  ${usersList.length}`,
    Markup.removeKeyboard(),
  );
});

bot.action('register', async (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(HELLO_MESSAGE_TEXT);
  const telegramId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!telegramId) return;

  const checkUser = await userService.getByTelegramId(telegramId);
  if (!!checkUser) return;

  await userService.create({ telegramId, chatId, step: 'firstName' });
  const firstQuestion = registrationQuestions.firstName.label;
  return ctx.reply(firstQuestion);
});
