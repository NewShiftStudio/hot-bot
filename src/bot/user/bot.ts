import { Markup, Telegraf, Telegram } from 'telegraf';
import { questions } from './questions';
import { userService } from '../../common/services/user.service';
import { validateDateOfBirth } from '../../helpers/dobValidator';
import { validatePhoneNumber } from '../../helpers/phoneValidation';
import { ValidationResult } from '../../@types/entities/ValidationResult';

import dotenv from 'dotenv';
import { getDeclensionWordByCount } from '../../helpers/wordHelper';
import { postService } from '../../common/services/post.service';
import { User } from '../../common/entities/User';
import axios from 'axios';
import { AuthToken } from '../../@types/dto/auth/authToken';
import { OrganizationsResponseDto } from '../../@types/dto/organization/response';
import { IikoUser } from '../../@types/entities/IikoUser';
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
  'Поздравляем, вы успешно зарегистрировались!\n\nМы уже начислили 200 приветственных баллов на ваш счёт. Теперь вы можете копить и тратить их в Est. 1993.\n\nЧтобы проверить баланс, нажмите на кнопку «Показать баланс».';
const SHOW_BALANCE_TEXT = '💰 Показать баланс';
const SPEND_TEXT = '💳 Использовать баллы';

bot.hears(SHOW_BALANCE_TEXT, showBalance);
bot.command('balance', showBalance);

bot.hears(SPEND_TEXT, spend);
bot.command('spend', spend);

bot.command('/test', async ctx => {
  const telegramId = ctx.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user) return;

  const authToken = await getAuthToken();
  if (!authToken) return;
  console.log(authToken);
  const organizationId = await getOrganizationId(authToken);
  console.log(organizationId);
  if (!organizationId) return;
  const iikoUser = await getCustomerInfo(
    authToken,
    organizationId,
    user.iikoId
  );
  console.log(iikoUser?.walletBalances[0]);

  return;
});

bot.command('/add', async ctx => {
  const telegramId = ctx.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user) return;
  const authToken = await getAuthToken();
  if (!authToken) return;
  const organizationId = await getOrganizationId(authToken);
  if (!organizationId) return;
  try {
    const response = await axios.post(
      'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/wallet/hold',
      {
        customerId: user.iikoId,
        walletId: '01330000-6bec-ac1f-706b-08da7721127c',
        sum: 200,
        organizationId,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
  } catch (error) {
    console.log(error);
  }
});

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
  if (ctx.message.text.slice(14).trim() !== process.env.POST_PASSWORD) {
    return;
  }

  const telegramId = ctx.from.id;

  try {
    await userService.update(telegramId, {
      canCratePosts: true,
    });
    return ctx.reply(
      'Отлично! Теперь вы можете создавать рассылки используя команду /createPost'
    );
  } catch (error) {
    console.log(error);
    return ctx.reply('Произошла ошибка прои назначении роли');
  }
});

bot.command('/createPost', async ctx => {
  const telegramId = ctx.from.id;

  const user = await userService.getByTelegramId(telegramId);
  if (!user || !user.canCratePosts) return;

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

  if (user.canCratePosts) {
    const post = await postService.getOne({ creatorTelegramId: telegramId });
    if (post) {
      await postService.update(telegramId, {
        text: ctx.message.text,
      });
      return ctx.reply('Текст поста обновлен');
    }
  }

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
    const updatedUser = await userService.getByTelegramId(telegramId);
    if (!updatedUser) return;
    const authToken = await getAuthToken();
    if (!authToken) return;
    const organizationId = await getOrganizationId(authToken);
    const userData: Partial<IikoUser> = {
      name: updatedUser.firstName,
      surName: updatedUser.secondName,
      cardNumber: updatedUser.card.cardNumber,
      cardTrack: updatedUser.card.cardTrack,
      phone: updatedUser.phoneNumber,
      organizationId,
    };
    const iikoUserId = await createOrUpdateIikoUser(authToken, userData);
    if (!iikoUserId) return;
    await userService.update(telegramId, {
      iikoId: iikoUserId.id,
    });
    console.log(iikoUserId);
    await ctx.reply('✅ Скидочная карта создана');
    await ctx.reply(
      '❗️ Интеграция с iiko пока не работает. По плану на этом этапе уже создана и назначена карта. Теперь все эти данные отправляются в iiko и назначается нормальный баланс.\n\nP.S. Сейчас он замокан'
    );
    return ctx.reply(
      END_REGISTRATION_TEXT,
      Markup.keyboard([[SHOW_BALANCE_TEXT, SPEND_TEXT]])
        .oneTime()
        .resize()
    );
  }

  return ctx.reply(questions[nextStep].label);
});

bot.command('add', async ctx => {
  const authToken = await getAuthToken();
  if (!authToken) return;
  const organizationId = await getOrganizationId(authToken);
  console.log(organizationId);
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
  const firstQuestion = questions.firstName.label;
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

async function showBalance(ctx: any) {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user || user.step !== 'registered')
    return ctx.reply(
      'Чтобы увидеть баланс, пожалуйста, завершите регистрацию.'
    );
  return ctx.replyWithMarkdown(
    `Сейчас на вашем балансе: _${user.balance} ${getDeclensionWordByCount(
      user.balance,
      ['баллов', 'балл', 'балла']
    )}_.`
  );
}

async function getAuthToken() {
  try {
    const response = await axios.post(
      'https://api-ru.iiko.services/api/1/access_token',
      {
        apiLogin: 'ae6300eb-be2',
      }
    );
    const authData = response.data as AuthToken;
    return authData.token;
  } catch (error) {
    console.log(error);
    return;
  }
}

async function getOrganizationId(authToken: string) {
  try {
    const response = await axios.post(
      'https://api-ru.iiko.services/api/1/organizations',
      {
        returnAdditionalInfo: false,
        includeDisabled: false,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    const data = response.data as OrganizationsResponseDto;
    return data.organizations[0].id;
  } catch (error) {
    console.log(error);
    return;
  }
}

async function createOrUpdateIikoUser(
  authToken: string,
  user: Partial<IikoUser>
) {
  try {
    const response = await axios.post(
      'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/create_or_update',
      user,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    return response.data as { id: string };
  } catch (error) {
    console.log(error);
    return;
  }
}

async function getCustomerInfo(
  authToken: string,
  organizationId: string,
  id: string
) {
  try {
    const response = await axios.post(
      'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/info',
      {
        type: 'id',
        id,
        organizationId,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    return response.data as IikoUser;
  } catch (error) {
    console.log(error);
    return;
  }
}

async function spend(ctx: any) {
  const telegramId = ctx.message.from.id;
  const user = await userService.getByTelegramId(telegramId);
  if (!user || user.step !== 'registered')
    return ctx.reply('Для списания баллов необходимо зарегистрироваться');
  return ctx.replyWithPhoto(
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=830&q=80',
    {
      caption: `Отлично! Чтобы списать баллы, покажите этот бар-код вашему официанту.`,
    }
  );
}
