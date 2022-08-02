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
    label: 'Номер телефона',
    nextStep: 'dateOfBirth',
  },
  dateOfBirth: {
    label: 'Дата рождения',
    nextStep: 'registered',
  },
};
