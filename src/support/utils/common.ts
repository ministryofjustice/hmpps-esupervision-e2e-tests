
export const randomPicker = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export const randomEnum = <T>(anEnum: any): T[keyof T] => {
  const enumValues = Object.keys(anEnum)
    .map((n) => Number.parseInt(n))
    .filter((n) => !Number.isNaN(n)) as unknown as T[keyof T][];
  return randomPicker(enumValues);
};

export const randomItems = <T>(array: T[],count=1) : T[] => {
    return [...array].sort(()=>Math.random() - 0.5).slice(0,count)
}
