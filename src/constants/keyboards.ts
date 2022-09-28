import { Markup } from 'telegraf';
import {
  BACK,
  CITY_STATS,
  CREATE_POST,
  INTERVIEW_RESULTS,
  SHOW_BALANCE_TEXT,
  SHOW_RESULT,
  SPEND_TEXT,
} from './text';

export const adminKeyboard = Markup.keyboard([
  [CREATE_POST, CITY_STATS],
  [INTERVIEW_RESULTS],
]);

export const clientKeyboard = Markup.keyboard([
  [SHOW_BALANCE_TEXT, SPEND_TEXT],
]);

export const createPostKeyboard = Markup.keyboard([[SHOW_RESULT, BACK]]);
