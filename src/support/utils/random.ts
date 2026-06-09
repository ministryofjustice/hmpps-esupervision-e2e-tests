export const randomPicker = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const randomItems = <T>(array: T[], count = 1): T[] => {
  return [...array].sort(() => Math.random() - 0.5).slice(0, count);
};
