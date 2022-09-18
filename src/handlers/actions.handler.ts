import { Context, Markup, Telegram } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { User } from '../common/entities/User';
import { interviewService } from '../common/services/interview.service';
import { postService } from '../common/services/post.service';
import { userService } from '../common/services/user.service';
import { interviewQuestions } from '../constants/interviewQuestions';
import { registrationQuestions } from '../constants/registrationQuestions';
import { getDeclensionWordByCount } from '../helpers/wordHelper';

const HELLO_MESSAGE_TEXT =
  'Добро пожаловать в бот Est. 1993.\n\nЭто бот программы лояльности. С его помощью вы сможете копить баллы и тратить их на наши легендарные хот-доги.\n\nЧтобы стать участником программы, пожалуйста, зарегистрируйтесь. Это займёт не больше двух минут — просто ответьте на несколько вопросов.';

export async function handleStartRegistration(ctx: Context<Update>) {
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
}

export async function handleAnswerQuestionnaire(
  ctx: Context<Update> & {
    match: RegExpExecArray;
  },
) {
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
  ctx.editMessageText(`${question.label}\n_${answerLabel}_`, {
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
}

export async function handleStartInterview(
  ctx: Context<Update> & {
    match: RegExpExecArray;
  },
) {
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
}

export async function handleCancelInterview(
  ctx: Context<Update> & {
    match: RegExpExecArray;
  },
) {
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
}

export async function handleSendPost(
  ctx: Context<Update> & {
    match: RegExpExecArray;
  },
) {
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
      ctx.telegram,
      usersList,
      post.fileIds,
      post.text,
    );
  } else {
    successMessagesCount = await sendTextMessage(
      ctx.telegram,
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
}

async function sendTextMessage(
  telegram: Telegram,
  usersList: User[],
  text: string,
) {
  const sendedMessagePromises = usersList.map(async (user) => {
    try {
      const res = await telegram.sendMessage(user.chatId, text);
      return res;
    } catch (error) {
      console.log(error);
      return;
    }
  });

  const sendedMessages = (await Promise.all(sendedMessagePromises)).filter(
    (message) => !!message,
  );

  return sendedMessages.length;
}

async function sendMediaMessage(
  telegram: Telegram,
  usersList: User[],
  fileIds: string,
  text: string,
) {
  const media: any = fileIds
    .trim()
    .split(' ')
    .map((id, index) => ({
      type: 'photo',
      media: id,
      caption: index === 0 ? text : '',
    }));

  const sendedMessagePromises = usersList.map(async (user) => {
    try {
      const res = await telegram.sendMediaGroup(user.chatId, media);
      return res;
    } catch (error) {
      console.log(error);
      return;
    }
  });

  const sendedMessages = (await Promise.all(sendedMessagePromises)).filter(
    (message) => !!message,
  );

  return sendedMessages.length;
}
