import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import {
  handleCreatePost,
  handleBack,
  handleDeleteUser,
  handleGetUserStats,
  handleGetXlsFile,
  handlePhotoMessage,
  handleRegisterAdmin,
  handleShowResult,
  handleStartMessage,
  handleTextMessage,
  handleShowBalance,
  handleSendBarCode,
} from '../handlers/messages.handler';
import {
  handleAnswerQuestionnaire,
  handleCancelInterview,
  handleSendPost,
  handleStartInterview,
  handleStartRegistration,
} from '../handlers/actions.handler';
import {
  BACK,
  CITY_STATS,
  CREATE_POST,
  INTERVIEW_RESULTS,
  SHOW_BALANCE_TEXT,
  SHOW_RESULT,
  SPEND_TEXT,
} from '../constants/text';
dotenv.config();

const userToken = process.env.USER_BOT_TOKEN;

if (!userToken) {
  throw new Error('USER_BOT_TOKEN must be provided!');
}

export const bot = new Telegraf(userToken);

bot.start(handleStartMessage);

bot.hears(SHOW_BALANCE_TEXT, handleShowBalance);
bot.hears(SPEND_TEXT, handleSendBarCode);
bot.hears(CITY_STATS, handleGetUserStats);
bot.hears(INTERVIEW_RESULTS, handleGetXlsFile);
bot.hears(CREATE_POST, handleCreatePost);
bot.hears(SHOW_RESULT, handleShowResult);
bot.hears(BACK, handleBack);

bot.command('balance', handleShowBalance);
bot.command('spend', handleSendBarCode);
bot.command('cityStats', handleGetUserStats);
bot.command('createXls', handleGetXlsFile);
bot.command('createPost', handleCreatePost);
bot.command('registerAdmin', handleRegisterAdmin);
bot.command('delete', handleDeleteUser);

bot.on('text', handleTextMessage);
bot.on('photo', handlePhotoMessage);

bot.action(/answer_[A-Za-z0-9]*_\w*/, handleAnswerQuestionnaire);
bot.action(/startInterview_[0-9]*/, handleStartInterview);
bot.action(/cancelInterview_[0-9]*/, handleCancelInterview);
bot.action('send', handleSendPost);
bot.action('register', handleStartRegistration);
