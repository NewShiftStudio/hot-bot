import { ValidationResult } from './../@types/entities/ValidationResult';

const regExp = /8\d\d\d\d\d\d\d\d\d\d/;

//format dd.mm.yyyy
export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  return {
    status: 'success',
    message: '',
  };
}
