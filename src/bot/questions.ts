export const questions: any = {
  firstName: {
    label: 'Имя',
    nextStep: 'secondName',
  },
  secondName: {
    label: 'Фамилия',
    nextStep: 'phoneNumber',
  },
  phoneNumber: {
    label:
      'Номер телефона\n\nВалидации нет, но зато есть проверка на существование в бд',
    nextStep: 'dateOfBirth',
  },
  dateOfBirth: {
    label:
      'Дата рождения в формате дд.мм.гггг\n\nВалидация сырая, но +- работает',
    nextStep: 'registered',
  },
};
