import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Location} from '../../location';
import {UserLocationCameraPopupComponent} from './location-camera-popup/location-camera-popup.component';
import {UserLocationMapPopupComponent} from './location-map-popup/location-map-popup.component';
import {MatDialog, MatSnackBar} from '@angular/material';
import {Router} from '@angular/router';
import {CameraConfig} from './camera-config';
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

  backCamera: boolean = null;
  frontCamera: boolean = null;

  cameraReady = false;
  cameraChecked = false;

  @Output()
  locationLogout: EventEmitter<any> = new EventEmitter();

  @Output()
  locationSkip: EventEmitter<any> = new EventEmitter();

  constructor(private http: HttpClient,public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router) {
  }

  ngOnInit() {
    if (this.cameraChecked === false) {
      this.checkCameras();
    }
  }

  /**
   * changes the current url and refreshes site in order to advance state.
   * @param {string} tag
   */
  scannedTag(tag: string): void {
    const suffix = tag.slice(tag.indexOf('/tag/'), tag.length);
    console.log('suffix=', suffix);
    window.open(location.origin + suffix, '_self');
  }

  openCamera() {
    if (this.cameraReady) {
      const cameraConfig: CameraConfig = {front: this.frontCamera, back: this.backCamera};
      const d = this.dialog.open(UserLocationCameraPopupComponent, {data: cameraConfig});
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
    } else {
      if (this.cameraChecked === true) {
        this.snackBar.open('Wir konnten keine Kamera finden', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
      } else {
        this.snackBar.open('Wir checken gerade deine Kameras, gib uns bitte noch eine Sekunde', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
      }
    }
  }

  /**
   * checks accessible cameras on the device
   */
  checkCameras(): void {
    const backCamera: Promise<MediaStream> = this.checkBackCamera();
    backCamera.then(response => {
      this.backCamera = true;
      console.log('We have a back camera');
      response.getTracks().forEach(function (track) {
        track.stop();
      });
    }).catch(response => {
      this.backCamera = false;
      console.log(response);
    });

    const frontCamera: Promise<MediaStream> = this.checkFrontCamera();
    frontCamera.then(response => {
      this.frontCamera = true;
      console.log('We have a front camera');
      response.getTracks().forEach(function (track) {
        track.stop();
      });
    }).catch(response => {
      this.frontCamera = false;
      console.log(response);
    });

    Promise.all([backCamera, frontCamera].map(p => p.catch(e => e))).then(() => {
      this.cameraChecked = true;
      if (this.backCamera === true || this.frontCamera === true) {
        this.cameraReady = true;
      }
    });
  }

  checkBackCamera(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia(CameraConfig.backConstraints);
  }

  checkFrontCamera(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia(CameraConfig.frontConstraints);
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
