export type Question = {
  label: string;
  answers?: QuestionAnswer[];
  nextStep: string;
};

export type QuestionAnswer = {
  label: string;
  value: string;
};
