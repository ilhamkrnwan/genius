type QuestionWithOptions = {
  options?: string[];
  correctAnswerIndex?: number;
  correctOptionIndex?: number;
};

export type ShuffledQuestion<T extends QuestionWithOptions> = T & {
  originalOptionIndexes: number[];
};

export function shuffleQuestions<T extends QuestionWithOptions>(questions: T[]): ShuffledQuestion<T>[] {
  return questions.map((question) => {
    const options = question.options || [];
    const indexes = options.map((_, index) => index);

    for (let index = indexes.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
    }

    const correctIndex = question.correctAnswerIndex ?? question.correctOptionIndex ?? -1;
    return {
      ...question,
      options: indexes.map((index) => options[index]),
      ...(question.correctAnswerIndex !== undefined && { correctAnswerIndex: indexes.indexOf(correctIndex) }),
      ...(question.correctOptionIndex !== undefined && { correctOptionIndex: indexes.indexOf(correctIndex) }),
      originalOptionIndexes: indexes,
    };
  });
}
