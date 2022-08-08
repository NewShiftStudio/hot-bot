import { ValidationResult } from './../@types/entities/ValidationResult';

let PHONE_REGEX = /^(8)[0-9]{10}/;

export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  if (!PHONE_REGEX.test(phoneNumber)) {
    return {
      status: 'error',
      message: 'Введите телефон в фермате 89999999999',
    };
  } else {
    return {
      status: 'success',
      message: '',
    };
  }
}
