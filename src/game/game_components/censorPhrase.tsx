import Filter from "badwords-ko";

export const censorPhrase = (text: string) => {
  const filter = new Filter();

  return filter.clean(text);
};
