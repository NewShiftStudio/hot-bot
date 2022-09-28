import { Question } from '../@types/entities/Questions';

export const interviewQuestions: Record<string, Question> = {
  dish: {
    label: 'Как вам блюда',
    nextStep: 'service',
  },
  service: {
    label: 'Как вам сервис?',
    nextStep: 'cocktailCard',
  },
  cocktailCard: {
    label: 'Как вам коктейльная карта?',
    nextStep: 'purity',
  },
  purity: {
    label: 'Чистота в заведении',
    nextStep: 'closed',
  },
};
