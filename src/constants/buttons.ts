import { Markup } from 'telegraf';

export const adminButtons = Markup.keyboard([
  ['📝 Создать пост', '📊 Статистика'],
  ['📋 Результаты опроса'],
]);

export const clientButtons = Markup.keyboard([
  ['💰 Показать баланс', '💳 Использовать баллы'],
]);
