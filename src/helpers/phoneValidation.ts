import { ValidationResult } from './../@types/entities/ValidationResult';

let PHONE_REGEX = /^((\+7)|8)\d{10}$/;

export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  if (!PHONE_REGEX.test(phoneNumber)) {
    return {
      status: 'error',
      message: 'Введите телефон в формате +79999999999',
    };
  } else {
    return {
      status: 'success',
      message: '',
    };
  }
}
