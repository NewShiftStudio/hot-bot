import { getDaysInMonth, isAfter, isValid } from 'date-fns';
import { ValidationResult } from './../@types/entities/ValidationResult';
import { getDeclensionWordByCount } from './wordHelper';
//format dd.mm.yyyy
export function validateDateOfBirth(dob: string): ValidationResult {
  const dobArr = dob.split('.');
  const date = +dobArr[0];
  const month = +dobArr[1] - 1;
  const year = +dobArr[2];

  if (isNaN(date) || isNaN(month) || isNaN(year)) {
    return {
      status: 'error',
      message: 'Введите дату в формате дд.мм.гггг',
    };
  }

  if (month < 0 || month > 11) {
    return {
      status: 'error',
      message: 'Месяц не может быть меньше 1 или больше 12. Попробуйте снова',
    };
  }

  if (year < 1920) {
    return {
      status: 'error',
      message: 'Вы еще живы?',
    };
  }

  const dobMonth = new Date(Date.UTC(year, month, 1));

  const daysInMonth = getDaysInMonth(dobMonth);

  if (date < 1) {
    return {
      status: 'error',
      message: 'Число месяца начинается с 1. Попробуйте еще раз',
    };
  }

  if (date > daysInMonth) {
    return {
      status: 'error',
      message: `В это месяце ${daysInMonth} ${getDeclensionWordByCount(
        daysInMonth,
        ['дней', 'день', 'дня'],
      )}. Попробуйте еще раз`,
    };
  }

  const dobDate = new Date(Date.UTC(year, month, date));

  if (!isAfter(new Date(), dobDate))
    return {
      status: 'error',
      message: 'Мне кажется вы еще не родились. Попробуйте еще раз',
    };

  if (!isValid(dobDate))
    return {
      status: 'error',
      message: 'Введите дату в формате дд.мм.гг',
    };

  return {
    status: 'success',
    message: '',
  };
}
