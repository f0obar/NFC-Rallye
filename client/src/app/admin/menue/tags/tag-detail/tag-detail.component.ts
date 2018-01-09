import {Component, Inject, OnInit} from '@angular/core';
import {AdminTag} from '../admin-tag';
import {AdminLocation} from '../../locations/admin-location';
import {MAT_DIALOG_DATA, MatDialogRef, MatSnackBar} from '@angular/material';
import {isNullOrUndefined} from 'util';
import {AdminAuthService} from '../../../services/admin-auth.service';
import {AdminRestService} from '../../../services/admin-rest.service';

@Component({
  selector: 'app-admin-tag-detail',
  templateUrl: './tag-detail.component.html',
  styleUrls: ['./tag-detail.component.css']
})
export class AdminTagDetailComponent implements OnInit {
  pageHeader: string;
  createNewEntry: boolean;
  locations: Array<AdminLocation>;

  constructor(public dialogRef: MatDialogRef<AdminTagDetailComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any, public snackBar: MatSnackBar,public  authService: AdminAuthService, private restService: AdminRestService) {
  }

  ngOnInit() {
    if (this.data.currentTag != null) {
      console.log('tag detail initialized with location', this.data.currentTag);
      this.pageHeader = 'Vorhandenen Tag Bearbeiten';
      this.createNewEntry = false;
    } else {
      console.log('tag detail initialized without location');
      this.loadDefaults();
      this.pageHeader = 'Neuen Tag Hinzufügen';
      this.createNewEntry = true;
    }
    this.loadLocations();
  }

  loadDefaults() {
    this.data.currentTag = new AdminTag('sample alias',
      null,
      'sample ID',
      'sample name');
    this.generateID();
  }

  loadLocations() {
    console.log('loading current locations from server');
    this.restService.getEntries('/api/admin/locations').subscribe(data => {
      if(!isNullOrUndefined(data)){
        this.locations = [];
        console.log('loaded current locations', data);
        for (const d in data) {
          if (data.hasOwnProperty(d)) {
            this.locations.push(
              new AdminLocation(data[d]['description'],
                data[d]['image'],
                data[d]['isActive'],
                data[d]['name'],
                data[d]['_id'],
                data[d]['lat'],
                data[d]['lng'],
                data[d]['lvl'] + ''));
          }
        }
      }
    });
  }

  submit() {
    console.log('TEST', this.data.currentTag.location);
    if (isNullOrUndefined(this.data.currentTag.location)) {
      this.snackBar.open('Wähle einen zugehörigen Ort aus!', null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    } else {
      if (this.createNewEntry === false) {
        this.restService.saveExistingEntry('/api/admin/tags/' + this.data.currentTag._id, {
          alias: this.data.currentTag.alias,
          location: this.data.currentTag.location,
          tagID: this.data.currentTag.tagID,
          _id: this.data.currentTag._id
        }).subscribe(data => {
          if(data === true){
            this.dialogRef.close();
          }
        });
      } else {
        this.restService.saveNewEntry('/api/admin/tags',{
          alias: this.data.currentTag.alias,
          location: this.data.currentTag.location,
          tagID: this.data.currentTag.tagID
        }).subscribe(data => {
          if(data === true){
            this.dialogRef.close();
          }
        });
      }
      console.log('saving quiz detail', this.data.currentTag);
    }
  }

  generateID() {
    this.data.currentTag.tagID = this.data.currentTag.alias + '-';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 10; i++) {
      this.data.currentTag.tagID += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
