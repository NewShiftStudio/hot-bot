import { ValidationResult } from './../@types/entities/ValidationResult';

//format dd.mm.yyyy
export function validateDateOfBirth(dob: string): ValidationResult {
  const dobArr = dob.split('.');
  const date = +dobArr[0];
  const month = +dobArr[1];
  const year = +dobArr[2];

  if (!date || !month || !year) {
    return {
      status: 'error',
      message: 'Введите дату в формате дд.мм.гггг',
    };
  }

  if (date > 31 || date < 1)
    return {
      status: 'error',
      message: 'День месяца должен быть между 1 и 31',
    };

  if (month > 12 || date < 1)
    return {
      status: 'error',
      message: 'Месяц должен быть между 1 и 12',
    };

  const maxYear = new Date().getFullYear();

  if (year < 1920 || year > maxYear)
    return {
      status: 'error',
      message: 'А вы точно еще живы?',
    };

  return {
    status: 'success',
    message: '',
  };
}
