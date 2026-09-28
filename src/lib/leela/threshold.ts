export type ThresholdPrompt = {
  question: string;
  invite: string;
};

export const THRESHOLD_PROMPTS: ThresholdPrompt[] = [
  {
    question: "Что в намерении уже живое — даже без клетки и без шестёрки?",
    invite: "Скажи это себе одним предложением. Поле может подождать.",
  },
  {
    question: "Шестёрка не пришла. Что ты слышишь в этом: запрет, паузу или свою спешку?",
    invite: "Ответь себе, не кости. Можно коротко и некрасиво.",
  },
  {
    question: "Кому внутри тебя нужно разрешение войти?",
    invite: "Напиши этой части, что она уже здесь.",
  },
  {
    question: "Где в теле сидит ожидание — челюсть, грудь, живот?",
    invite: "Назови место. Не объясняй его.",
  },
  {
    question: "Какую правду об этом вопросе ты ещё не произносил даже себе?",
    invite: "Одно честное предложение. Его никто не увидит, кроме тебя.",
  },
  {
    question: "Если бы поле открылось сейчас, какой ответ ты боишься встретить первым?",
    invite: "Назови страх. Тогда он перестанет быть дверью.",
  },
  {
    question: "Что ты делаешь вместо входа: готовишься, сомневаешься или уже знаешь и тянешь?",
    invite: "Выбери одно слово и допиши, зачем оно тебе.",
  },
  {
    question: "Каким словом ты себе сейчас мешаешь — и каким можешь помочь?",
    invite: "Два слова рядом. Больше не нужно.",
  },
];

export function thresholdPrompt(misses: number): ThresholdPrompt {
  const index = ((misses % THRESHOLD_PROMPTS.length) + THRESHOLD_PROMPTS.length) % THRESHOLD_PROMPTS.length;
  return THRESHOLD_PROMPTS[index] ?? THRESHOLD_PROMPTS[0];
}
