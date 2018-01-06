export class AdminQuiz{
  constructor(public answer: string,
              public choices: string[],
              public description: string,
              public hint: string,
              public image: any,
              public isActive: boolean,
              public location: string,
              public name: string,
              public _id: string,
              public code: string) {}
}
