import { AfterViewInit, Component, Inject, OnInit, HostListener } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

declare const L;

const mapMaxWidth = 800;
const mapMobileWidth = 450;

@Component({
  selector: 'app-user-location-map-popup',
  templateUrl: './location-map-popup.component.html',
  styleUrls: ['./location-map-popup.component.css']
})
export class UserLocationMapPopupComponent implements OnInit {

  mapStyles = {
    'width': '400px',
    'height' : '300px'
  }
  
  rendered = false;

  constructor(public dialogRef: MatDialogRef<UserLocationMapPopupComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
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
    this.mapStyles.width = String(width) + "px";
    if (width > mapMobileWidth) {
      this.mapStyles.height = String(width * 0.75) + "px";
    } else {
      this.mapStyles.height = String(height * 0.75) + "px";
    }
  }

  ngOnInit() {
    
  }

  ngAfterViewInit() {
    const map = L.map('map').setView([49.1226, 9.211], 17);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  }
}
