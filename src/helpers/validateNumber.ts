import { ValidationResult } from '../@types/entities/ValidationResult';

export function validateNumber(number: number): ValidationResult {
  if (isNaN(number)) {
    return {
      status: 'error',
      message: 'Введите число!',
    };
  }

  if (number < 1)
    return {
      status: 'error',
      message: 'Ну не все так плохо! Должно быть не меньше 1',
    };

  if (number > 10)
    return {
      status: 'error',
      message: 'Мы понимаем как вам понравилось, но 10 хватит!',
    };

  if (Number.isInteger(number)) {
    return {
      status: 'error',
      message: 'Введите целое число',
    };
  }

  return {
    status: 'success',
    message: '',
  };
}
