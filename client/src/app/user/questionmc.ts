import {isUndefined} from 'util';

export class QuestionMultiplechoice {
  constructor(private name: string,private question: string,public choices: string[], private image?: any) {}

  public getQuestion(): string {
    return this.question;
  }

  public getName(): string {
    return this.name;
  }

  public getImage(): any {
    return this.image;
  }
}
