declare module "badwords-ko" {
  export default class Filter {
    constructor();
    clean(text: string): string;
    check?(text: string): boolean;
  }
}