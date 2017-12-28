import {isNullOrUndefined, isUndefined} from 'util';

export class QuestionSingleanswer {
  constructor(private name: string,private question: string,private hint?: string, private image?: any) {}

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
    return !isNullOrUndefined(this.image) && !isNullOrUndefined(this.image.filetype);
  }
  public getName(): string {
    return this.name;
  }

  public getImage(): any {
    return this.image;
  }
}
