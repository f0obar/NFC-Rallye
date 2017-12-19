import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

declare const L; 

@Component({
  selector: 'app-user-location-map-popup',
  templateUrl: './location-map-popup.component.html',
  styleUrls: ['./location-map-popup.component.css']
})
export class UserLocationMapPopupComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<UserLocationMapPopupComponent>,@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    console.log("L:", L);
    const map = L.map('map', { scrollWheelZoom: false}).setView([49.1226, 9.211], 18);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
  }
}
