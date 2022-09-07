import { Question } from '../@types/entities/Questions';

export const questions: Record<string, Question> = {
  firstName: {
    label: 'Ваше имя',
    nextStep: 'secondName',
  },
  secondName: {
    label: 'Ваша фамилия',
    nextStep: 'city',
  },
  city: {
    label: 'Из какого вы города?',
    answers: [
      { label: 'Москва', value: 'MSK' },
      { label: 'Санкт-Петербург', value: 'SPB' },
    ],
    nextStep: 'phoneNumber',
  },
  phoneNumber: {
    label: 'Ваш номер телефона',
    nextStep: 'dateOfBirth',
  },
  dateOfBirth: {
    label: 'Когда вы родились?\n\n(в формате дд.мм.гггг)',
    nextStep: 'registered',
  },
};
