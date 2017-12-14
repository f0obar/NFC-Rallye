import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {QuestionSingleanswer} from '../../../questionsingleanswer';
import {QuestionMultiplechoice} from '../../../questionmc';
import {HttpClient} from '@angular/common/http';
import {MatButtonBase, MatDialog, MatSnackBar} from '@angular/material';
import {isNullOrUndefined} from 'util';
import {UserQuizHintPopupComponent} from '../quiz-hint-popup/quiz-hint-popup.component';
import {UserLocationMapPopupComponent} from '../../location/location-map-popup/location-map-popup.component';
import {SharedSimpleDialogComponent} from '../../../../shared/simple-dialog/simple-dialog.component';
import {UserQuizHelpPopupComponent} from "../quiz-help-popup/quiz-help-popup.component";

@Component({
  selector: 'app-user-quiz-multiplechoice',
  templateUrl: './quiz-multiplechoice.component.html',
  styleUrls: ['./quiz-multiplechoice.component.css']
})
export class UserQuizMultiplechoiceComponent implements OnInit {
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


  constructor(private http: HttpClient, public snackBar: MatSnackBar, public dialog: MatDialog) {
  }

  ngOnInit() {
    console.log('QuizComponent got initialized with', this.question);
  }


  imageAvailable(): boolean  {
    return !isNullOrUndefined(this.question.getImage());
  }

  /**
   * opens popup dialog for the hint
   */
  toggleHint() {
    const d = this.dialog.open(UserQuizHintPopupComponent, {
      data: {
        hint: this.question.getHint()
      }
    });
  }

  /**
   * sends answer to the server and checks if its correct
   * @param {string} answer
   */
  solveQuestion(answer: string) {
    console.log('clicked solvebutton', answer);
    if (isNullOrUndefined(answer) || answer === '') {
      this.snackBar.open('Keine Antwort eingegeben!', null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    } else {
      this.http.post('/api/game/sessions/' + this.sessionID + '/riddle', {answer: answer}).subscribe(
        (data) => {
          console.log('submit answer data', data);
          if (data['correctAnswer'] === true) {
            this.snackBar.open('Richtige Anwort!', null, {
              duration: 2000,
              horizontalPosition: 'center'
            });
            this.solution = answer;

            setTimeout(()=>{
              if (!isNullOrUndefined(data['points'])) {
                this.quizPointEmitter.emit(data['points']);
              }
              this.quizOutput.emit();
            }, 2000);
          } else {
            console.log('wrong answer');
            this.snackBar.open('Falsche Antwort', null, {
              duration: 2000,
              horizontalPosition: 'center'
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
    const d = this.dialog.open(SharedSimpleDialogComponent, {
      data: {
        title: 'Quiz Überspringen',
        message: 'Möchtest du wirklich dieses Quiz überspringen? Du kannst nicht zurück kehren, und erhälst keine Punkte.',
        button1: 'Überspringen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        console.log('skipping question');
        this.http.post('/api/game/sessions/' + this.sessionID + '/riddle', {skip: 'true'}).subscribe(
          (data) => {
            this.snackBar.open('Quiz übersprungen!', null, {
              duration: 2000,
              horizontalPosition: 'center'
            });
            this.quizOutput.emit();
          },
          (err) => {
            console.log('skip error', err);
          }
        );
      }
    });
  }

  /**
   * opens popup for the map
   */
  openMap(): void {
    const d = this.dialog.open(UserLocationMapPopupComponent, {
      data: {
        location: this.location
      }
    });
  }

  /**
   * deletes the local session when the user accepts the dialog
   */
  abbrechen() {
    const deleteSession = this.dialog.open(SharedSimpleDialogComponent, {data: {
      title: 'Schnitzeljagd beenden',
      message: 'Möchtest du die Schnitzeljagd wirklich beenden?',
      button1: 'JA BEENDEN',
      button2: 'Abbrechen'
    }});
    deleteSession.afterClosed().subscribe(result => {
      if(result === 'b1') {
        console.log('user deleted session');
        this.quizLogout.emit();
      }
    });
  }

  help() {
    const d = this.dialog.open(UserQuizHelpPopupComponent, {

    });
  }

}
