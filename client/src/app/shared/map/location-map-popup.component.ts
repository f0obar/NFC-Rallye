import {AfterViewInit, Component, Inject, HostListener} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatSnackBar} from '@angular/material';
import {isNullOrUndefined} from 'util';
import {HttpClient, HttpHeaders} from '@angular/common/http';

declare const L;

const mapMaxWidth = 800;
const mapMobileWidth = 450;

@Component({
  selector: 'app-user-location-map-popup',
  templateUrl: './location-map-popup.component.html',
  styleUrls: ['./location-map-popup.component.css']
})
export class UserLocationMapPopupComponent implements AfterViewInit {

  customIcon = L.icon({
    iconUrl: '../../../../assets/images/location_pin.svg',


    iconSize:     [48, 48], // size of the icon
    iconAnchor:   [24, 48], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  mapStyles = {
    'width': '400px',
    'height' : '300px'
  }

  rendered = false;

  constructor(public dialogRef: MatDialogRef<UserLocationMapPopupComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any, public snackBar: MatSnackBar,private http: HttpClient) {
    this.resizeMap();
    this.rendered = true;
  }

  @HostListener('window:resize') onResize() {
    if(this.rendered) {
      this.resizeMap();
    }
  }


  resizeMap(): void {
    let width = window.screen.width;
    const height = window.screen.height;
    if (width > mapMaxWidth) {
      width = mapMaxWidth;
    }
    this.mapStyles.width = String(width) + 'px';
    if (width > mapMobileWidth) {
      this.mapStyles.height = String(width * 0.75) + 'px';
    } else {
      this.mapStyles.height = String(height * 0.75) + 'px';
    }
  }

  ngAfterViewInit() {
    const map = L.map('map').setView([49.1226, 9.211], 17);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if(this.data.admin === false) {
      if (!isNullOrUndefined(this.data.location.getLatitude())) {
        L.marker([this.data.location.getLatitude(),this.data.location.getLongitude()], {icon: this.customIcon}).addTo(map);
      }
    } else {
      if(!isNullOrUndefined(this.data.location.longitude)) {
        const myMarker = L.marker([this.data.location.latitude,
          this.data.location.longitude],
          {title: 'Ort', alt: 'Position', draggable: true, icon: this.customIcon})
          .addTo(map)
          .on('dragend', () => {
            const coord = String(myMarker.getLatLng()).split(',');
            const lat = coord[0].split('(')[1];
            console.log('LAT',lat);
            const lng = coord[1].split(')')[0];
            console.log('LNG',lng);

            this.data.location.latitude = lat;
            this.data.location.longitude = lng;
          });
      } else {
        const myMarker = L.marker([49.1226, 9.211], {title: 'Ort', alt: 'Position', draggable: true, icon: this.customIcon})
          .addTo(map)
          .on('dragend', () => {
            const coord = String(myMarker.getLatLng()).split(',');
            const lat = (coord[0].split('('))[1];
            console.log('LAT',lat);
            const lng = (coord[1].split(')'))[0];
            console.log('LNG',lng);

            this.data.location.latitude = lat;
            this.data.location.longitude = lng;
          });
      }
    }
  }

  /**
   * submits new / edited quiz to the server using rest api
   */
  submit() {
    console.log('location',this.data.location);
    this.http.put('/api/admin/locations/' + this.data.location._id, {
      lat: this.data.location.latitude,
      lng: this.data.location.longitude,
      lvl: this.data.location.level
    }, {headers: new HttpHeaders().set('X-Auth-Token', this.data.adminToken)}).subscribe(
      () => {
        console.log('successfully edited quiz');
        this.snackBar.open('Erfolgreich gespeichert!', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        this.dialogRef.close();
      },
      (err) => {
        console.log('error editing quiz', err);
        this.snackBar.open('Ein Fehler ist Aufgetreten', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
      }
    );
  }

  /**
   * closes dialog
   */
  cancel() {
    this.dialogRef.close();
  }
}