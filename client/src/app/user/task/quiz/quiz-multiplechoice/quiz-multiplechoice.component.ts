import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {QuestionMultiplechoice} from '../../../questionmc';
import {HttpClient} from '@angular/common/http';
import {MatDialog, MatSnackBar} from '@angular/material';
import {isNullOrUndefined} from 'util';
import {SharedSimpleDialogComponent} from '../../../../shared/simple-dialog/simple-dialog.component';
import {UserQuizHelpPopupComponent} from '../quiz-help-popup/quiz-help-popup.component';
import {Router} from '@angular/router';
import {UserDialogService} from '../../../services/user-dialog.service';

@Component({
  selector: 'app-user-quiz-multiplechoice',
  templateUrl: './quiz-multiplechoice.component.html',
  styleUrls: ['./quiz-multiplechoice.component.css']
})
export class UserQuizMultiplechoiceComponent implements OnInit,AfterViewInit {
  @Input() question: QuestionMultiplechoice;
  @Input() sessionID: string;
  @Input() location: Location;

  @Output()
  quizOutput: EventEmitter<any> = new EventEmitter();

  @Output()
  quizLogout: EventEmitter<any> = new EventEmitter();

  @Output()
  quizPointEmitter: EventEmitter<any> = new EventEmitter();

  usedAnswers = [];
  solution = '';

  constructor(private http: HttpClient,
              public snackBar: MatSnackBar,
              public dialog: MatDialog,
              private router: Router,
              private dialogService: UserDialogService) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    history.pushState(null,null,this.router.url);
    window.addEventListener('popstate', (event) => {
      history.pushState(null,null,this.router.url);
    });
  }
  /**
   * sends answer to the server and checks if its correct
   * @param {string} answer
   */
  solveQuestion(answer: string) {
    if (isNullOrUndefined(answer) || answer === '') {
      this.snackBar.open('Keine Antwort eingegeben!', null, {
        duration: 2000,
        horizontalPosition: 'center',
        panelClass: 'offset-snack-bar'
      });
    } else {
      this.http.post('/api/game/sessions/' + this.sessionID + '/riddle', {answer: answer}).subscribe(
        (data) => {
          if (data['correctAnswer'] === true) {
            this.snackBar.open('Richtige Anwort!', null, {
              duration: 2000,
              horizontalPosition: 'center',
              panelClass: 'offset-snack-bar'
            });
            this.solution = answer;
            if (!isNullOrUndefined(data['points'])) {
              this.quizPointEmitter.emit(data['points']);
            }

            setTimeout(()=>{
              this.quizOutput.emit();
            }, 2000);
          } else {
            this.snackBar.open('Falsche Antwort', null, {
              duration: 2000,
              horizontalPosition: 'center',
              panelClass: 'offset-snack-bar'
            });
            this.usedAnswers.push(answer);
          }
        },
        (err) => {
          console.log('submit answer error', err);
        }
      );
    }
  }

  isAnswerUsed(answer: string): boolean {
    return this.usedAnswers.indexOf(answer) > -1;
  }

  isAnswerCorrect(answer: string): boolean {
    return answer === this.solution;
  }


  /**
   * skips the current question
   */
  skipQuestion(): void {
    const d = this.dialogService.open(SharedSimpleDialogComponent, {
      data: {
        title: 'Quiz überspringen',
        message: 'Möchtest du wirklich dieses Quiz überspringen? Du kannst nicht zurück kehren, und erhälst keine Punkte.',
        button1: 'Überspringen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        this.http.post('/api/game/sessions/' + this.sessionID + '/riddle', {skip: 'true'}).subscribe(
          (data) => {
            this.snackBar.open('Quiz übersprungen!', null, {
              duration: 2000,
              horizontalPosition: 'center',
              panelClass: 'offset-snack-bar'
            });
            this.quizOutput.emit();
          },
          (err) => {
          }
        );
      }
    });
  }

  /**
   * deletes the local session when the user accepts the dialog
   */
  abbrechen() {
    const deleteSession = this.dialogService.open(SharedSimpleDialogComponent, {data: {
        title: 'Rallye verlassen',
        message: 'Möchtest du die Session wirklich verlassen? Die Session kann fortgesetzt werden,' +
        ' indem du dich mit deinem Gruppennamen und Passwort erneut anmeldest.',
        button1: 'Ja verlassen',
        button2: 'Abbrechen'
    }});
    deleteSession.afterClosed().subscribe(result => {
      if(result === 'b1') {
        this.quizLogout.emit();
      }
    });
  }

  help() {
    const d = this.dialogService.open(UserQuizHelpPopupComponent, {

    });
  }

}
