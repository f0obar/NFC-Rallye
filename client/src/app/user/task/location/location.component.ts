import {AfterViewInit, Component, EventEmitter, Input, Output} from '@angular/core';
import {Location} from '../../location';
import {UserLocationCameraPopupComponent} from './location-camera-popup/location-camera-popup.component';
import {UserLocationMapPopupComponent} from '../../../shared/map/location-map-popup.component';
import {MatDialog, MatSnackBar} from '@angular/material';
import {Router} from '@angular/router';
import {SharedSimpleDialogComponent} from '../../../shared/simple-dialog/simple-dialog.component';
import {HttpClient} from '@angular/common/http';
import {UserQuizHelpPopupComponent} from '../quiz/quiz-help-popup/quiz-help-popup.component';
import {UserDialogService} from '../../services/user-dialog.service';

@Component({
  selector: 'app-user-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css']
})
export class UserLocationComponent implements AfterViewInit {
  @Input() location: Location;
  @Input() sessionID: string;

  @Output()
  locationLogout: EventEmitter<any> = new EventEmitter();

  @Output()
  locationSkip: EventEmitter<any> = new EventEmitter();

  @Output()
  locationFound: EventEmitter<any> = new EventEmitter();

  constructor(private http: HttpClient, public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router,private dialogService: UserDialogService) {
  }

  ngAfterViewInit() {
    history.pushState(null, null, this.router.url);
    window.addEventListener('popstate', (event) => {
      history.pushState(null, null, this.router.url);
    });
  }

  /**
   * changes the current url and refreshes site in order to advance state.
   * @param {string} tag
   */
  scannedTag(tag: string): void {
    this.locationFound.emit(tag);
  }

  openSnackBar(msg: string): void {
    this.snackBar.open(msg, null, {
      duration: 2000,
      horizontalPosition: 'center',
      panelClass: 'offset-snack-bar'
    });
  }

  openCamera() {
    const d = this.dialogService.open(UserLocationCameraPopupComponent,{});
    d.afterClosed().subscribe(result => {
      // Force stop the stream
      d.componentInstance.stopStream();
      // Did we scan something?
      if (<string>result) {
        if ((<string>result).indexOf('/tag/') > -1) {
          this.scannedTag(result);
        } else {
          this.openSnackBar('QR Code konnte nicht korrekt gescanned werden');
        }
      }
    });
  }

  /**
   * skips the current location
   */
  skip(): void {
    const d = this.dialogService.open(SharedSimpleDialogComponent, {
      data: {
        title: 'Ort überspringen',
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
            this.openSnackBar('Ort übersprungen!');
            this.locationSkip.emit();
          },
          (err) => {
            this.openSnackBar('Es ist ein Fehler aufgetreten.');
          });
      }
    });
  }

  openMap() {
    const d = this.dialogService.open(UserLocationMapPopupComponent, {
      maxWidth: '98vw',
      panelClass: 'app-full-bleed-dialog',
      data: {
        location: this.location,
        admin: false
      }
    });
  }

  /**
   * opens popup dialog for emitting logout output.
   */
  abbrechen() {
    const deleteSession = this.dialogService.open(SharedSimpleDialogComponent, {
      data: {
        title: 'Schnitzeljagd verlassen',
        message: 'Möchtest du die Session wirklich verlassen? Die Session kann fortgesetzt werden,' +
        ' indem du dich mit deinem Gruppennamen und Passwort erneut anmeldest.',
        button1: 'JA verlassen',
        button2: 'Abbrechen'
      }
    });
    deleteSession.afterClosed().subscribe(result => {
      if (result === 'b1') {
        console.log('user deleted session');
        this.locationLogout.emit();
      }
    });
  }

  help() {
    const d = this.dialogService.open(UserQuizHelpPopupComponent, {});
  }
}
