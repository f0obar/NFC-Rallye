import {Component, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Location} from './location';
import {QuestionSingleanswer} from './questionsingleanswer';
import {Router} from '@angular/router';
import {MatDialog, MatDialogRef, MatSnackBar} from '@angular/material';
import {SharedSimpleDialogComponent} from '../shared/simple-dialog/simple-dialog.component';
import {isNullOrUndefined, isUndefined} from 'util';
import {QuestionMultiplechoice} from './questionmc';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit{

  points = 0;
  gameRunning: boolean;
  sessionID: string;
  groupName: string;
  winText: string;
  progressCount: number;
  progressDone: number;
  currentLocation: Location;
  currentQuestion: any;
  currentTask: string;
  startDate: Date = null;
  endDate: Date = null;

  @ViewChild('progress') progress;


  constructor(private http: HttpClient, private router: Router, private dialog: MatDialog,  public snackBar: MatSnackBar) { }

  /**
   * initializes gamesession and checks for sessionID in local storage. If there is no session id the login page gets displayed.
   */
  ngOnInit() {
    this.gameRunning = false;
    this.sessionID = '';
    this.progressDone = 0;
    this.progressCount = 1;
    if(!isNullOrUndefined(localStorage.getItem('points'))) {
      this.points = Number(localStorage.getItem('points'));
    }

    if(localStorage.getItem('sessionID') !== null){
      this.sessionID = localStorage.getItem('sessionID');
      this.gameRunning = true;
    }

    if(this.gameRunning === true){
      if(this.urlContainsTag()){
        this.handleScannedTag();
      } else {
        this.getStateFromServer();
      }
    }
  }

  /**
   * checks if the current url contains a valid tag for a location
   * @returns {boolean}
   */
  urlContainsTag():boolean {
    const url = this.router.url;
    if(url.startsWith('/tag#/')) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * informs the server about the newly scanned tag in order to advance game state
   */
  handleScannedTag() {
    let url = this.router.url;
    url = url.slice(6);
    console.log('url', url);

    this.http.post('/api/game/sessions/' + this.sessionID + '/location', {tagID: url}).subscribe(
      (data) => {
        if (data['correctLocation'] === true){
          this.snackBar.open('Du hast einen Ort gefunden!',null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        } else {
          this.snackBar.open('Das ist der falsche Ort!',null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        }
        console.log('scanned tag', data);
        this.getStateFromServer();

      },
      (err) => {
        this.snackBar.open('Es ist ein Fehler Aufgetreten',null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        console.log('scanned tag error', err);
        this.getStateFromServer();
      }
    );
  }

  loggedIn(id: string) {
    localStorage.setItem('sessionID',id);
    this.sessionID = id;
    console.log('TEST',localStorage.getItem('sessionID'));
    setTimeout(()=>{
      this.getStateFromServer();
      this.gameRunning = true;},500);
  }

  getStateFromServer() {
    this.http.get('/api/game/sessions/' + this.sessionID).subscribe(
      data => {
        console.log('data from server',data);
        const dataLocation = data['location'];
        const dataQuestion = data['riddle'];
        const dataProgress = data['progress'];

        this.progressCount = dataProgress['count'];
        this.progressDone = dataProgress['done'];
        this.currentTask = data['task'];

        /**
         * If server transmitted valid points the userscore gets initialized
         */
        if(!isNullOrUndefined(data['points'])){
          this.setPoints(data['points']);
        }

        /**
         * If server transmitted a startdate the date gets parsed
         */
        if (!(isUndefined((data['dates'])['startDate']))) {
          this.startDate = this.parseJsonDateToDate((data['dates'])['startDate']);
        }

        /**
         * If server transmitted an enddate the date gets parsed
         */
        if (!(isUndefined((data['dates'])['endDate']))) {
          this.endDate = this.parseJsonDateToDate((data['dates'])['endDate']);
        }

        /**
         * when the session is not finished the current location and question get parsed.
         */
        if(this.currentTask !== 'won') {
          this.currentLocation = new Location(dataLocation['name'], 0, 0, 0, dataLocation['image']);

          /**
           * check if Riddle is Singleanswer or Multiple Choice
           * choices array is empty if the riddle is a singleanswer
           * @type {QuestionSingleanswer}
           */
          if (dataQuestion['choices'].length === 0){
            this.currentQuestion = new QuestionSingleanswer(dataQuestion['description'],dataQuestion['question'],dataQuestion['hint'], dataQuestion['image']);
          } else {
            this.currentQuestion = new QuestionMultiplechoice(dataQuestion['description'],dataQuestion['question'] ,dataQuestion['choices'],dataQuestion['hint'], dataQuestion['image']);
          }
          console.log('the new question/location', this.currentQuestion, this.currentLocation);
        } else {
          this.groupName = data['groupName'];
          this.winText = data['winText'];
        }
      },
      (err: HttpErrorResponse) => {
        console.log('session expired',err);
        if(err['status']=== 403){
          const removeOldSession = this.dialog.open(SharedSimpleDialogComponent, {data: {
            title: 'Session abgelaufen',
            message: 'Deine Schnitzeljagd Session ist leider abgelaufen',
            button1: 'Neue Schnitzeljagd starten',
            button2: 'Abbrechen'
          }});
          removeOldSession.afterClosed().subscribe(result => {
            if(result === 'b1') {
              console.log('user deleted expired session');
              this.clearLocalSession();
            }
          });
        }
      }
    );
  }

  /**
   * points get stored in local storage to check if a new animations needs to be played,
   * when the page refreshes.
   * @param {number} amount
   */
  setPoints(amount: number){
      console.log('setPoints called');
      if (amount < this.points) {
        this.points = amount;
      }
      else if (amount > this.points && amount > Number(localStorage.getItem('points'))) {
        console.log('DEBUG', this.points, localStorage.getItem('points'), amount);
        this.progress.increasePoints(amount);
      }
      console.log('SETTING', amount);
      localStorage.setItem('points', '' + amount);
      console.log('123')
  }

  /**
   * converts servertimestamp to es6 Date
   * @param data
   * @returns {Date}
   */
  parseJsonDateToDate(data: any): Date {
    const date = new Date(data);
    console.log('PARSED',date);
    return date;
  }

  /**
   * clears local storage
   */
  clearLocalSession(): void {
    localStorage.clear();
    this.gameRunning = false;
  }
}
