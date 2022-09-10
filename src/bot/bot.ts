import { Context, Markup, Telegraf, Telegram } from 'telegraf';
import { registrationQuestions } from '../constants/registrationQuestions';
import { userService } from '../common/services/user.service';
import { validateDateOfBirth } from '../helpers/dobValidator';
import { validatePhoneNumber } from '../helpers/phoneValidation';
import { ValidationResult } from '../@types/entities/ValidationResult';

import dotenv from 'dotenv';
import { getDeclensionWordByCount } from '../helpers/wordHelper';
import { postService } from '../common/services/post.service';
import { User } from '../common/entities/User';
import { iikoApi } from '../api/iikoApi';
import {
  ConsentStatus,
  CreateUserDto,
  SEX,
} from '../@types/dto/user/create.dto';
import { formatDateToIiko } from '../helpers/formatDate';
import { interviewService } from '../common/services/interview.service';
import { interviewQuestions } from '../constants/interviewQuestions';
import { Interview } from '../common/entities/Interview';
dotenv.config();

const userToken = process.env.USER_BOT_TOKEN;

if (!userToken) {
  throw new Error('USER_BOT_TOKEN must be provided!');
}

export const bot = new Telegraf(userToken);
const telegram = new Telegram(userToken);

const HELLO_MESSAGE_TEXT =
  'Добро пожаловать в бот Est. 1993.\n\nЭто бот программы лояльности. С его помощью вы сможете копить баллы и тратить их на наши легендарные хот-доги.\n\nЧтобы стать участником программы, пожалуйста, зарегистрируйтесь. Это займёт не больше двух минут — просто ответьте на несколько вопросов.';
const END_REGISTRATION_TEXT =
  'Спасибо, что присоединились к сообществу настоящих гедонистов! Дарим вам 200 приветственных бонусов. Оплачивайте ими 50% от вашего чека! 🔥\n\nКстати, забыли сказать, при бронировании столика по промокоду «eat in est»  вы получаете сет из наших невероятных тапасов! Забронировать можно по номерам телефонов тут 👇🏼\n\nEst1993.ru';
const SHOW_BALANCE_TEXT = '💰 Показать баланс';
const SPEND_TEXT = '💳 Использовать баллы';
const MINUTE = 60 * 1000;

bot.hears(SHOW_BALANCE_TEXT, showBalance);
bot.command('balance', showBalance);

bot.hears(SPEND_TEXT, sendBarCode);
bot.command('spend', sendBarCode);

bot.start(async ctx => {
  const telegramId = ctx.message.from.id;

  const user = await userService.getByTelegramId(telegramId);
  if (!user) {
    return ctx.reply(
      HELLO_MESSAGE_TEXT,
      Markup.inlineKeyboard([
        Markup.button.callback('Давайте ваши вопросы', 'register'),
      ])
    );
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

bot.command('/registerAdmin', async ctx => {
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
      'Отлично! Теперь вы можете:\nСоздавать рассылки используя команду /createPost\nПолучать статистику по городам /cityStats'
    );
  } catch (error) {
    console.log(error);
    return ctx.reply('Произошла ошибка прои назначении роли');
  }
});

bot.command('/cityStats', async ctx => {
  const telegramId = ctx.from.id;
  const user = await userService.getByTelegramId(telegramId);

  if (!user?.isAdmin) return;

  const stats = await userService.getCityStats();

  ctx.reply(
    `Статистика:\n\nВсего пользователей: ${stats.total}\nМосква: ${stats.msk}\nСПб: ${stats.spb}`
  );
});

bot.command('/createPost', async ctx => {
  const telegramId = ctx.from.id;

  const user = await userService.getByTelegramId(telegramId);
  if (!user || !user.isAdmin) return;

  const postsList = await postService.getAll({
    creatorTelegramId: telegramId,
  });

  await Promise.all(
    postsList.map(async post => await postService.delete(post.id))
  );

  await postService.create({
    creatorTelegramId: telegramId,
    fileIds: '',
  });

  return ctx.reply(
    '📢 Режим создания поста.\n\n✏️ Чтобы обновить текст, просто отправьте его в новом сообщении. Обратите внимание: в сообщении не должно быть фото, видео и других файлов.\n\n🌅 Чтобы добавить фотографию, отправьте её отдельным сообщением. Если фотографий несколько, отправьте их по одной, иначе бот не сможет их сохранить.',
    Markup.keyboard([['📋 Показать результат', '◀️ Назад']])
  );
});

bot.hears('◀️ Назад', async ctx => {
  const telegramId = ctx.from.id;
  try {
    await postService.deleteByCreatorId(telegramId);
    ctx.reply('Пост удален', Markup.removeKeyboard());
  } catch (error) {
    console.log(error);
    ctx.reply('Произошла ошибка при выходе из режима создания поста');
  }
});

bot.hears('📋 Показать результат', async ctx => {
  const telegramId = ctx.from.id;

  const post = await postService.getOne({ creatorTelegramId: telegramId });
  if (!post) return;

  if (!post.text && !post.fileIds)
    return ctx.reply(
      'Нельзя отправить пост без контента.\n\nВведите текст или приложите фото'
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
    Markup.inlineKeyboard([Markup.button.callback('Отправить', 'send')])
  );
});

bot.on('text', async ctx => {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user) return;

  const messageText = ctx.message.text;

  if (user.isAdmin) {
    savePostText(ctx, telegramId, messageText);
  }

  const step = user.step;

  if (step !== 'registered') {
    return saveUserRegisterAnswer(ctx, user, messageText);
  }

  const interview = user.interviews.find(
    interview =>
      !['closed', 'init', 'canceled', 'sended'].includes(interview.step)
  );

  if (interview) {
    return saveInterviewAnswer(ctx, interview, messageText);
  }

  return;
});

bot.on('photo', async ctx => {
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

bot.action(/answer_[A-Za-z0-9]*_\w*/, async ctx => {
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
    question.answers?.find(answer => answer.value === value)?.label || '';
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
      'Не удалось сохранить данные. Обратитесь к администратору'
    );
  }

  const nextQuestion = registrationQuestions[nextStep];

  if (nextQuestion.answers) {
    const buttons = nextQuestion.answers.map(answer =>
      Markup.button.callback(answer.label, `answer_${nextStep}_${answer.value}`)
    );
    return ctx.reply(nextQuestion.label, Markup.inlineKeyboard(buttons));
  }
  return ctx.reply(nextQuestion.label);
});

bot.action('startInterview', async ctx => {
  ctx.answerCbQuery();
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  ctx.deleteMessage();

  const user = await userService.getByTelegramId(telegramId);
  if (!user) return;

  const interview = user.interviews.find(
    interview =>
      !['closed', 'init', 'canceled', 'sended'].includes(interview.step)
  );
  if (!interview) return;

  await interviewService.update(interview.id, {
    step: 'dish',
  });

  ctx.reply('Да начнется интервью! Ответы от 1 до 10!!');
  console.log(interviewQuestions.dish.label);

  ctx.reply(interviewQuestions.dish.label);
});

bot.action('send', async ctx => {
  ctx.answerCbQuery();
  ctx.deleteMessage();
  const telegramId = ctx.from?.id;

  if (!telegramId) return;

  const post = await postService.getOne({ creatorTelegramId: telegramId });
  if (!post) return;

  const usersList = await userService.getAll({ step: 'registered' });
  let successMessagesCount = 0;
  if (post.fileIds) {
    successMessagesCount = await sendMediaMessage(
      usersList,
      post.fileIds,
      post.text
    );
  } else {
    successMessagesCount = await sendTextMessage(usersList, post.text);
  }

  await postService.deleteByCreatorId(telegramId);
  await ctx.reply(
    `Сообщение получили ${successMessagesCount} ${getDeclensionWordByCount(
      successMessagesCount,
      ['пользователей', 'пользователь', 'пользователя']
    )} из  ${usersList.length}`,
    Markup.removeKeyboard()
  );
});

bot.action('register', async ctx => {
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

async function sendTextMessage(usersList: User[], text: string) {
  const sendedMessagePromises = usersList.map(async user => {
    try {
      const res = await telegram.sendMessage(user.chatId, text);
      return res;
    } catch (error) {
      console.log(error);
      return;
    }
  });

  const sendedMessages = (await Promise.all(sendedMessagePromises)).filter(
    message => !!message
  );

  return sendedMessages.length;
}

async function sendMediaMessage(
  usersList: User[],
  fileIds: string,
  text: string
) {
  const media: any = fileIds
    .trim()
    .split(' ')
    .map((id, index) => ({
      type: 'photo',
      media: id,
      caption: index === 0 ? text : '',
    }));

  const sendedMessagePromises = usersList.map(async user => {
    try {
      const res = await telegram.sendMediaGroup(user.chatId, media);
      return res;
    } catch (error) {
      console.log(error);
      return;
    }
  });

  const sendedMessages = (await Promise.all(sendedMessagePromises)).filter(
    message => !!message
  );

  return sendedMessages.length;
}

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

async function setCardToUser(userId: number) {
  try {
    return await userService.setCard(userId);
  } catch (error) {
    console.log(`Ошибка выдачи карты пользователю ${userId}`);
  }
  return;
}

async function savePostText(ctx: Context, telegramId: number, text: string) {
  const post = await postService.getOne({ creatorTelegramId: telegramId });
  if (post) {
    await postService.update(telegramId, {
      text,
    });
    ctx.reply('Текст поста обновлен');
  }
}

async function saveInterviewAnswer(
  ctx: Context,
  interview: Interview,
  answer: string
) {
  const step = interview.step;
  const nextInterviewStep = interviewQuestions[step].nextStep;
  await interviewService.update(interview.id, {
    [step]: answer,
    step: nextInterviewStep,
  });
  if (nextInterviewStep === 'closed') {
    return ctx.reply('Спасибо за отзыв! Мы учтем вашу оценку!');
  }
  return ctx.reply(interviewQuestions[nextInterviewStep].label);
}

async function saveUserRegisterAnswer(
  ctx: Context,
  user: User,
  answer: string
) {
  const step = user.step;
  const telegramId = user.telegramId;
  const question = registrationQuestions[step];

  if (question.answers) return 'Пожалуйста, выберите ответ из списка';

  const validationResult = await validateStep(step, answer);

  if (validationResult.status !== 'success') {
    return validationResult.message;
  }

  if (!question) {
    console.error(
      `У пользователя ${telegramId} произошла ошибка на этапе ${step}`
    );
    return 'Возникла ошибка. Обратитесь к администратору';
  }

  const nextStep = question.nextStep;

  if (!nextStep) {
    console.error(
      `У пользователя ${telegramId} произошла ошибка. Отсутствует этап после ${step}`
    );
    return 'Возникла ошибка. Обратитесь к администратору';
  }

  try {
    await userService.update(telegramId, {
      [step]: answer,
      step: nextStep,
    });
  } catch (error) {
    console.log(error);
    return 'Не удалось сохранить данные. Обратитесь к администратору';
  }

  if (nextStep === 'registered') {
    return registerUserInIIko(ctx, user);
  }

  const nextQuestion = registrationQuestions[nextStep];

  if (nextQuestion.answers) {
    const buttons = nextQuestion.answers.map(answer =>
      Markup.button.callback(answer.label, `answer_${nextStep}_${answer.value}`)
    );
    return ctx.reply(nextQuestion.label, Markup.inlineKeyboard(buttons));
  }
  return ctx.reply(nextQuestion.label);
}

async function registerUserInIIko(ctx: Context, user: User) {
  const loadingMessage = await ctx.reply(
    'Регистрируем в бонусной программе...'
  );
  try {
    const updatedUser = await setCardToUser(user.id);
    if (!updatedUser)
      return 'Ошибка при выдаче карты. Обратитесь к администратору';
    const newUserData: CreateUserDto = {
      name: updatedUser.firstName,
      surName: updatedUser.secondName,
      cardNumber: updatedUser.card.cardNumber,
      cardTrack: updatedUser.card.cardTrack,
      phone: updatedUser.phoneNumber,
      birthday: formatDateToIiko(updatedUser.dateOfBirth),
      sex: SEX.NOT_SPECIFIED,
      consentStatus: ConsentStatus.GIVEN,
    };
    const iikoUserId = await iikoApi.createUser(newUserData);
    if (!iikoUserId) {
      throw new Error(
        `Ошибка регистрации в iiko пользователя ${user.telegramId}`
      );
    }
    await userService.update(updatedUser.telegramId, {
      iikoId: iikoUserId,
    });

    const iikoBalance = await iikoApi.getUserBalance(iikoUserId);

    await userService.update(user.telegramId, {
      balance: iikoBalance,
    });
    ctx.deleteMessage(loadingMessage.message_id);
    return ctx.reply(
      END_REGISTRATION_TEXT,
      Markup.keyboard([[SHOW_BALANCE_TEXT, SPEND_TEXT]])
        .oneTime()
        .resize()
    );
  } catch (error) {
    console.log(`Ошибка при регистрации пользователя: ${user.telegramId}`);
    ctx.deleteMessage(loadingMessage.message_id);
    return ctx.reply(
      'Возникла ошибка при регистрации в бонусную программу, обратитесь к администратору'
    );
  }
}

async function showBalance(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await userService.getByTelegramId(telegramId);
  if (!user || user.step !== 'registered')
    return ctx.reply(
      'Чтобы увидеть баланс, пожалуйста, завершите регистрацию.'
    );

  const messageId = (await ctx.reply('Загрузка...')).message_id;

  const balance = await iikoApi.getUserBalance(user.iikoId);
  if (!balance && balance !== 0) {
    return ctx.reply(
      'Произошла ошибка получения баланса. Обратитесь к администратору'
    );
  }

  await ctx.deleteMessage(messageId);

  return ctx.replyWithMarkdown(
    `Сейчас на вашем балансе: _${balance} ${getDeclensionWordByCount(
      user.balance,
      ['баллов', 'балл', 'балла']
    )}_.`
  );
}

async function sendBarCode(ctx: Context) {
  const telegramId = ctx.from?.id;

  if (!telegramId) return;

  const messageId = (await ctx.reply('Загрузка...')).message_id;

  const user = await userService.getByTelegramId(telegramId);
  if (!user || user.step !== 'registered') {
    ctx.deleteMessage(messageId);
    return ctx.reply('Для списания баллов необходимо зарегистрироваться');
  }

  await userService.update(telegramId, {
    lastOrderDate: new Date(),
  });

  try {
    await ctx.replyWithPhoto(
      [process.env.PUBLIC_URL, user.card.barCodeLink].join('/'),
      {
        caption: `Отлично! Чтобы списать баллы, покажите этот бар-код вашему официанту.`,
      }
    );
  } catch (error) {
    console.log(error);
    ctx.deleteMessage(messageId);
    ctx.reply(
      `Не удалось получить штрих-код карты.\n\nНомер вашей карты: ${user.card.cardNumber}`
    );
  } finally {
    return ctx.deleteMessage(messageId);
  }
}
