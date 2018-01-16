import {isNullOrUndefined, isUndefined} from 'util';

export class QuestionSingleanswer {
  constructor(private name: string,private question: string,private hint?: string, private image?: any,public code?:string) {}

  public getQuestion(): string {
    return this.question;
  }

  public getHint(): string {
    if(isUndefined(this.hint)){
      return 'Sorry but there is no Hint for this Question';
    } else {
      return this.hint;
    }
  }

  public imageAvailable(): boolean {
    return !isNullOrUndefined(this.image) && !isNullOrUndefined(this.image.filetype) && this.image.filetype !== '';
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
