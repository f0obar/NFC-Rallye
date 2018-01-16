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
              @Inject(MAT_DIALOG_DATA) public data: any,
              public snackBar: MatSnackBar,
              public  authService: AdminAuthService,
              private restService: AdminRestService) {
  }

  ngOnInit() {
    if (this.data.currentTag != null) {
      this.pageHeader = 'Vorhandenen Tag Bearbeiten';
      this.createNewEntry = false;
    } else {
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
    this.restService.getEntries('/api/admin/locations').then(data => {
        this.locations = [];
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
    }).catch(e => {
    });
  }

  submit() {
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
        }).then(data => {
            this.dialogRef.close();
        }).catch(e => {
        });
      } else {
        this.restService.saveNewEntry('/api/admin/tags',{
          alias: this.data.currentTag.alias,
          location: this.data.currentTag.location,
          tagID: this.data.currentTag.tagID
        }).then(data => {
          this.dialogRef.close();
        }).catch(e => {
        });
      }
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
