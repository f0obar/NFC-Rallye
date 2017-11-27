import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Location} from './location';
import {QuestionSingleanswer} from './questionsingleanswer';
import {Router} from '@angular/router';
import {MatDialog, MatDialogRef, MatSnackBar} from '@angular/material';
import {SharedSimpleDialogComponent} from '../shared/simple-dialog/simple-dialog.component';
import {isUndefined} from 'util';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit{

  gameRunning: boolean;
  sessionID: string;
  progressCount: number;
  progressDone: number;
  currentLocation: Location;
  currentQuestion: any;
  currentTask: string;
  startDate: Date = null;
  endDate: Date = null;


  constructor(private http: HttpClient, private router: Router, private dialog: MatDialog,  public snackBar: MatSnackBar) { }

  ngOnInit() {
    this.gameRunning = false;
    this.sessionID = '';
    this.progressDone = 0;
    this.progressCount = 1;

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

  urlContainsTag():boolean {
    const url = this.router.url;
    if(url.startsWith('/tag#/')) {
      return true;
    } else {
      return false;
    }
  }

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


        if (!(isUndefined((data['dates'])['startDate']))) {
          this.startDate = this.parseJsonDateToDate((data['dates'])['startDate']);
        }

        if (!(isUndefined((data['dates'])['endDate']))) {
          this.endDate = this.parseJsonDateToDate((data['dates'])['endDate']);
        }

        if(this.currentTask !== 'won') {
          this.currentLocation = new Location(dataLocation['name'], 0, 0, 0, dataLocation['image']);
          this.currentQuestion = new QuestionSingleanswer('0', dataQuestion['description'], dataQuestion['hint'], dataQuestion['image']);
          console.log('the new question/location', this.currentQuestion, this.currentLocation);
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

  parseJsonDateToDate(data: any): Date {
    const date = new Date(data);
    console.log('PARSED',date);
    return date;
  }

  clearLocalSession(): void {
    localStorage.clear();
    this.gameRunning = false;
  }
}
