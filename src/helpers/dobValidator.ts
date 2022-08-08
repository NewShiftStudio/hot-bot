import { isAfter, isValid } from 'date-fns';
import { ValidationResult } from './../@types/entities/ValidationResult';
//format dd.mm.yyyy
export function validateDateOfBirth(dob: string): ValidationResult {
  const dobArr = dob.split('.');
  const date = +dobArr[0];
  const month = +dobArr[1] - 1;
  const year = +dobArr[2];

  if (!date || !month || !year) {
    return {
      status: 'error',
      message: 'Введите дату в формате дд.мм.гггг',
    };
  }

  if (date < 1 || date > 31) {
    return {
      status: 'error',
      message: 'Число не может быть меньше 1 или больше 31. Попробуйте снова',
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

  const dobDate = new Date(Date.UTC(year, month, date));

  if (!isAfter(new Date(), dobDate))
    return {
      status: 'error',
      message: 'Вы еще не родились)',
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
