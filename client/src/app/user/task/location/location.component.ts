import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Location} from '../../location';
import {UserLocationCameraPopupComponent} from './location-camera-popup/location-camera-popup.component';
import {UserLocationMapPopupComponent} from './location-map-popup/location-map-popup.component';
import {MatDialog, MatSnackBar} from '@angular/material';
import {Router} from '@angular/router';
import {SharedSimpleDialogComponent} from '../../../shared/simple-dialog/simple-dialog.component';
import {HttpClient} from '@angular/common/http';
import {UserQuizHelpPopupComponent} from '../quiz/quiz-help-popup/quiz-help-popup.component';

@Component({
  selector: 'app-user-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css']
})
export class UserLocationComponent implements OnInit {
  @Input() location: Location;
  @Input() sessionID: string;

  @Output()
  locationLogout: EventEmitter<any> = new EventEmitter();

  @Output()
  locationSkip: EventEmitter<any> = new EventEmitter();

  @Output()
  locationFound: EventEmitter<any> = new EventEmitter();

  constructor(private http: HttpClient,public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router) {
  }

  ngOnInit() {
  }

  /**
   * changes the current url and refreshes site in order to advance state.
   * @param {string} tag
   */
  scannedTag(tag: string): void {
    this.locationFound.emit(tag);
  }

  openCamera() {
    const d = this.dialog.open(UserLocationCameraPopupComponent);
    d.afterClosed().subscribe(result => {
      // Force stop the stream
      d.componentInstance.stopStream();
      // Did we scan something?
      if (<string>result) {
        if ((<string>result).indexOf('/tag/') > -1) {
          this.scannedTag(result);
        } else {
          this.snackBar.open('QR Code konnte nicht korrekt gescanned werden', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        }
      }
    });
  }

  /**
   * skips the current location
   */
  skip(): void {
    const d = this.dialog.open(SharedSimpleDialogComponent, {
      data: {
        title: 'Ort Überspringen',
        message: 'Möchtest du wirklich diesen Ort überspringen? Du kannst nicht zurück kehren, und erhälst keine Punkte.',
        button1: 'Überspringen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        console.log('skipping location');
        this.http.post('/api/game/sessions/' + this.sessionID + '/location', {skip: 'true'}).subscribe(
          (data) => {
            this.snackBar.open('Ort übersprungen!', null, {
              duration: 2000,
              horizontalPosition: 'center'
            });
            this.locationSkip.emit();
          },
          (err) => {
            this.snackBar.open('Es ist ein Fehler aufgetreten.', null, {
              duration: 2000,
              horizontalPosition: 'center'
            });
          });
      }
    });
  }

  openMap() {
    const d = this.dialog.open(UserLocationMapPopupComponent, {
      data: {
        location: this.location
      }
    });
  }

  /**
   * opens popup dialog for emitting logout output.
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
        this.locationLogout.emit();
      }
    });
  }

  help() {
    const d = this.dialog.open(UserQuizHelpPopupComponent, {
    });
  }
}
