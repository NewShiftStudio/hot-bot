export const questions: any = {
  firstName: {
    label: 'Ваше имя',
    nextStep: 'secondName',
  },
  secondName: {
    label: 'Ваша фамилия',
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
