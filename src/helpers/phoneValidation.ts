import { ValidationResult } from './../@types/entities/ValidationResult';

//format dd.mm.yyyy
export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  return {
    status: 'success',
    message: '',
  };
}
