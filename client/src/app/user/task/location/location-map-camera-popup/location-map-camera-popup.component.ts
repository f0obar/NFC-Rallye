import {Component, Inject, OnInit, AfterContentInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';
import {UserLocationMapPopupComponent} from '../location-map-popup/location-map-popup.component';

declare const qrcode: any;

@Component({
  selector: 'app-user-location-camera-popup',
  templateUrl: './location-map-camera-popup.component.html',
  styleUrls: ['./location-map-camera-popup.component.css']
})
export class UserLocationCameraPopupComponent implements OnInit, AfterContentInit {

  constructor(public dialogRef: MatDialogRef<UserLocationMapPopupComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  width = 0;
  height = 0;

  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;

  streaming = false;

  constraints: any;

  captureIntervalId: any;

  ngOnInit() {

  }

  ngAfterContentInit() {
    this.video = <HTMLVideoElement>window.document.getElementById('v');
    this.canvas = <HTMLCanvasElement>document.getElementById('qr-canvas');

    this.video.addEventListener('canplay', () => {
      this.width = this.video.videoWidth;
      this.height = this.video.videoHeight;

      // Firefox currently has a bug where the height can't be read from
      // the video, so we will make assumptions if this happens.

      if (isNaN(this.height)) {
        this.height = this.width / (4 / 3);
      }

      this.video.setAttribute('width', String(this.width));
      this.video.setAttribute('height', String(this.height));
      this.canvas.setAttribute('width', String(this.width));
      this.canvas.setAttribute('height', String(this.height));
      this.streaming = true;
    });

    this.constraints = {
      audio: false,
      video: {
        facingMode: {
          exact: 'user'
        }
      }
    };
    this.startStream();
  }

  openVideo(): void {
    this.video.style.height = 'auto';
  }

  read(a): void {
    this.stopStream();
    this.dialogRef.close(a);
  }

  capture(): void {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const context = this.canvas.getContext('2d');
    context.drawImage(this.video, 0, 0, this.width, this.height);
    qrcode.decode(context, this.width, this.height);
  }

  handleSuccess(stream) {
    const videoTracks = stream.getVideoTracks();
    console.log(videoTracks);
    this.video.srcObject = stream;

    qrcode.callback = this.read.bind(this);

    this.captureIntervalId = setInterval(() => {
      this.capture();
    }, 200);
  }

  handleError(error) {
    console.error(error);
    this.streaming = false;
  }

  startStream() {
    if (!this.streaming) {
      console.log('Starting Stream!');
      navigator.mediaDevices
        .getUserMedia(this.constraints)
        .then(response => {
          this.handleSuccess(response);
        })
        .catch(response => {
          this.handleError(response);
        });
      this.openVideo();
      this.streaming = true;
    }
  }

  stopStream() {
    if (this.streaming) {
      console.log('Stopping Stream!');
      clearInterval(this.captureIntervalId);
      const stream = this.video.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach(function (track) {
        track.stop();
      });
      this.video.srcObject = null;
      this.streaming = false;
    }
  }
}