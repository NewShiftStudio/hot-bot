import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import {
  createPost,
  handleBack,
  handleDeleteUser,
  handleGetUserStats,
  handleGetXlsFile,
  handlePhotoMessage,
  handleRegisterAdmin,
  handleShowResult,
  handleStartMessage,
  handleTextMessage,
  sendBarCode,
  showBalance,
} from '../handlers/messages.handler';
import {
  handleAnswerQuestionnaire,
  handleCancelInterview,
  handleSendPost,
  handleStartInterview,
  handleStartRegistration,
} from '../handlers/actions.handler';
dotenv.config();

const userToken = process.env.USER_BOT_TOKEN;

if (!userToken) {
  throw new Error('USER_BOT_TOKEN must be provided!');
}

export const SHOW_BALANCE_TEXT = '💰 Показать баланс';
export const SPEND_TEXT = '💳 Использовать баллы';

export const bot = new Telegraf(userToken);

bot.start(handleStartMessage);

bot.command('balance', showBalance);
bot.hears(SHOW_BALANCE_TEXT, showBalance);

bot.command('spend', sendBarCode);
bot.hears(SPEND_TEXT, sendBarCode);

bot.command('/cityStats', handleGetUserStats);
bot.hears('📊 Статистика', handleGetUserStats);

bot.command('/createXls', handleGetXlsFile);
bot.hears('📋 Результаты опроса', handleGetXlsFile);

bot.command('/createPost', createPost);
bot.hears('📝 Создать пост', createPost);

bot.command('delete', handleDeleteUser);

bot.command('/registerAdmin', handleRegisterAdmin);

bot.hears('◀️ Назад', handleBack);

bot.hears('📋 Показать результат', handleShowResult);

bot.on('text', handleTextMessage);

bot.on('photo', handlePhotoMessage);

bot.action(/answer_[A-Za-z0-9]*_\w*/, handleAnswerQuestionnaire);

bot.action(/startInterview_[0-9]*/, handleStartInterview);

bot.action(/cancelInterview_[0-9]*/, handleCancelInterview);

bot.action('send', handleSendPost);

bot.action('register', handleStartRegistration);
