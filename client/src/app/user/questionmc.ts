import {isNullOrUndefined} from 'util';

export class QuestionMultiplechoice {
  constructor(private name: string,private question: string,public choices: string[], private image?: any, public code?:string) {}

  public getQuestion(): string {
    return this.question;
  }
  public imageAvailable(): boolean {
    return !isNullOrUndefined(this.image) && !isNullOrUndefined(this.image.filetype) && this.image.filetype != "";
  }
  public codeAvailable(): boolean {
    return !isNullOrUndefined(this.code) && this.code.length > 0;
  }

  public getName(): string {
    return this.name;
  }

  public getImage(): any {
    return this.image;
  }
}
