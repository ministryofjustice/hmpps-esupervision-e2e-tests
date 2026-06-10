export const randomPicker = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const randomItems = <T>(array: T[], count = 1): T[] => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, count);
};
