import { randomUUID } from 'crypto';
import { Context, Markup } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import {
  ConsentStatus,
  CreateUserDto,
  SEX,
} from '../@types/dto/user/create.dto';
import { ValidationResult } from '../@types/entities/ValidationResult';
import { iikoApi } from '../api/iikoApi';
import { Interview } from '../common/entities/Interview';
import { User } from '../common/entities/User';
import { interviewService } from '../common/services/interview.service';
import { postService } from '../common/services/post.service';
import { userService } from '../common/services/user.service';
import { adminButtons, clientButtons } from '../constants/keyboards';
import { interviewQuestions } from '../constants/interviewQuestions';
import { registrationQuestions } from '../constants/registrationQuestions';
import { validateDateOfBirth } from '../helpers/dobValidator';
import { formatDateToIiko } from '../helpers/formatDate';
import { validatePhoneNumber } from '../helpers/phoneValidation';
import { validateNumber } from '../helpers/validateNumber';
import { getDeclensionWordByCount } from '../helpers/wordHelper';
import { generateXls } from '../scripts/createInterviewsXls';
import * as fs from 'fs';
import path from 'path';

const HELLO_MESSAGE_TEXT =
  'Добро пожаловать в бот Est. 1993.\n\nЭто бот программы лояльности. С его помощью вы сможете копить баллы и тратить их на наши легендарные хот-доги.\n\nЧтобы стать участником программы, пожалуйста, зарегистрируйтесь. Это займёт не больше двух минут — просто ответьте на несколько вопросов.';
const END_REGISTRATION_TEXT =
  'Спасибо, что присоединились к сообществу настоящих гедонистов! Дарим вам 200 приветственных бонусов. Оплачивайте ими 50% от вашего чека! 🔥\n\nКстати, забыли сказать, при бронировании столика по промокоду «eat in est»  вы получаете сет из наших невероятных тапасов! Забронировать можно по номерам телефонов тут 👇🏼\n\nEst1993.ru';

export async function handleStartMessage(ctx: Context) {
  const telegramId = ctx.message?.from.id;

  if (!telegramId) return;

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
}

export async function showBalance(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await userService.getByTelegramId(telegramId);
  if (!user || user.step !== 'registered')
    return ctx.reply(
      'Чтобы увидеть баланс, пожалуйста, завершите регистрацию.',
    );

  const messageId = (await ctx.reply('Загрузка...')).message_id;

  const balance = await iikoApi.getUserBalance(user.iikoId);
  if (!balance && balance !== 0) {
    return ctx.reply(
      'Произошла ошибка получения баланса. Обратитесь к администратору',
    );
  }

  await ctx.deleteMessage(messageId);

  return ctx.replyWithMarkdown(
    `Сейчас на вашем балансе: _${balance} ${getDeclensionWordByCount(
      user.balance,
      ['баллов', 'балл', 'балла'],
    )}_.`,
  );
}

export async function sendBarCode(ctx: Context) {
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
      },
    );
  } catch (error) {
    console.log(error);
    ctx.deleteMessage(messageId);
    ctx.reply(
      `Не удалось получить штрих-код карты.\n\nНомер вашей карты: ${user.card.cardNumber}`,
    );
  } finally {
    return ctx.deleteMessage(messageId);
  }
}

export async function createPost(ctx: Context) {
  const telegramId = ctx.from?.id;

  if (!telegramId) return;

  const user = await userService.getByTelegramId(telegramId);
  if (!user || !user.isAdmin) return;

  const postsList = await postService.getAll({
    creatorTelegramId: telegramId,
  });

  await Promise.all(
    postsList.map(async (post) => await postService.delete(post.id)),
  );

  await postService.create({
    creatorTelegramId: telegramId,
    fileIds: '',
  });

  return ctx.reply(
    '📢 Режим создания поста.\n\n✏️ Чтобы обновить текст, просто отправьте его в новом сообщении. Обратите внимание: в сообщении не должно быть фото, видео и других файлов.\n\n🌅 Чтобы добавить фотографию, отправьте её отдельным сообщением. Если фотографий несколько, отправьте их по одной, иначе бот не сможет их сохранить.',
    Markup.keyboard([['📋 Показать результат', '◀️ Назад']]),
  );
}

export async function handleTextMessage(ctx: Context) {
  const message = ctx.message as Message.TextMessage;
  const telegramId = message.from?.id;
  if (!telegramId) return;
  const user = await userService.getByTelegramId(telegramId);
  if (!user) return;

  const messageText = message.text;

  if (user.isAdmin) {
    savePostText(ctx, telegramId, messageText);
  }

  const step = user.step;

  if (step !== 'registered') {
    return saveUserRegisterAnswer(ctx, user, messageText);
  }

  const interview = user.interviews.find(
    (interview) =>
      !['closed', 'init', 'canceled', 'sended'].includes(interview.step),
  );

  if (interview) {
    return saveInterviewAnswer(ctx, interview, messageText);
  }

  return;
}

export async function handlePhotoMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const post = await postService.getOne({ creatorTelegramId: telegramId });
  if (!post) return;

  const message = ctx.message as Message.PhotoMessage;

  const fileId = message.photo[message.photo.length - 1].file_id;
  const newFilesList = post.fileIds + ' ' + fileId;
  await postService.update(telegramId, {
    fileIds: newFilesList,
  });
  return ctx.reply('Фото добавлено!');
}

export async function handleDeleteUser(ctx: Context) {
  if (process.env.NODE_ENV === 'production') return;
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    await userService.delete(telegramId);
    ctx.reply('Вы успешно удалены из базы', Markup.removeKeyboard());
  } catch (error) {
    console.log(error);
    ctx.reply('Произошла ошибка при удалении');
  }
}

export async function handleRegisterAdmin(ctx: Context) {
  if (
    (ctx.message as Message.TextMessage).text.slice(14).trim() !==
    process.env.REGISTER_ADMIN_PASSWORD
  )
    return;

  const telegramId = ctx.from?.id;

  if (!telegramId) return;

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
}

export async function handleBack(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  try {
    await postService.deleteByCreatorId(telegramId);
    ctx.reply('Пост удален', adminButtons);
  } catch (error) {
    console.log(error);
    ctx.reply('Произошла ошибка при выходе из режима создания поста');
  }
}

export async function handleShowResult(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

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
}

export async function handleGetUserStats(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await userService.getByTelegramId(telegramId);
  if (!user?.isAdmin) return;

  const loaderMsg = await ctx.reply('Загрузка статистики...');

  const stats = await userService.getCityStats();

  ctx.deleteMessage(loaderMsg.message_id);

  return ctx.reply(
    `Всего пользователей в программе лояльности — ${stats.total}\nПользователей из Москвы — ${stats.msk}\nПользователей из Санкт-Петербурга — ${stats.spb}`,
  );
}

export async function handleGetXlsFile(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  const user = await userService.getByTelegramId(telegramId);
  if (!user || !user.isAdmin) return;
  const loader = await ctx.reply('Генерируем файл...');
  const fileName = randomUUID();
  const result = await generateXls(fileName);
  ctx.deleteMessage(loader.message_id);
  if (result.status === 'error') {
    return ctx.reply(result.message);
  }

  try {
    return await ctx.replyWithDocument(
      [
        process.env.PUBLIC_URL,
        process.env.PUBLIC_FOLDER || '',
        `${fileName}.zip`,
      ].join('/'),
    );
  } catch (error) {
    console.log('send xlsx error:', error);
    return ctx.reply('Произошла ошибка');
  } finally {
    fs.promises.unlink(
      path.resolve(
        __dirname,
        process.env.PUBLIC_FOLDER || '',
        '/',
        `${fileName}.xlsx`,
      ),
    );
    fs.promises.unlink(
      path.resolve(
        __dirname,
        process.env.PUBLIC_FOLDER || '',
        '/',
        `${fileName}.zip`,
      ),
    );
  }
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
  answer: string,
) {
  const step = interview.step;
  const nextInterviewStep = interviewQuestions[step].nextStep;
  const numberAnswer = +answer;

  const validationResult = validateNumber(numberAnswer);

  if (validationResult.status === 'error') {
    return ctx.reply(validationResult.message);
  }

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
  answer: string,
) {
  const step = user.step;
  const telegramId = user.telegramId;
  const question = registrationQuestions[step];

  if (question.answers) return 'Пожалуйста, выберите ответ из списка';

  const validationResult = await validateStep(step, answer);

  if (validationResult.status !== 'success') {
    return ctx.reply(validationResult.message);
  }

  if (!question) {
    console.error(
      `У пользователя ${telegramId} произошла ошибка на этапе ${step}`,
    );
    return 'Возникла ошибка. Обратитесь к администратору';
  }

  const nextStep = question.nextStep;

  if (!nextStep) {
    console.error(
      `У пользователя ${telegramId} произошла ошибка. Отсутствует этап после ${step}`,
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
    const buttons = nextQuestion.answers.map((answer) =>
      Markup.button.callback(
        answer.label,
        `answer_${nextStep}_${answer.value}`,
      ),
    );
    return ctx.reply(nextQuestion.label, Markup.inlineKeyboard(buttons));
  }
  return ctx.reply(nextQuestion.label);
}

async function validateStep(
  stepName: string,
  answer: string,
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

async function registerUserInIIko(ctx: Context, user: User) {
  const loadingMessage = await ctx.reply(
    'Регистрируем в бонусной программе...',
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
        `Ошибка регистрации в iiko пользователя ${user.telegramId}`,
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
    return ctx.reply(END_REGISTRATION_TEXT, clientButtons);
  } catch (error) {
    console.log(`Ошибка при регистрации пользователя: ${user.telegramId}`);
    ctx.deleteMessage(loadingMessage.message_id);
    return ctx.reply(
      'Возникла ошибка при регистрации в бонусную программу, обратитесь к администратору',
    );
  }
}
