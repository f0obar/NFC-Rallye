import {Component, Inject, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AdminLocation} from '../admin-location';
import {MAT_DIALOG_DATA, MatDialogRef, MatSnackBar} from '@angular/material';
import {isNullOrUndefined} from "util";

@Component({
  selector: 'app-admin-location-detail',
  templateUrl: './location-detail.component.html',
  styleUrls: ['./location-detail.component.css']
})
export class AdminLocationDetailComponent implements OnInit {
  pageHeader: string;
  createNewEntry: boolean;

  constructor(
    public dialogRef: MatDialogRef<AdminLocationDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient, public snackBar: MatSnackBar) {
  }

  ngOnInit() {
    if (this.data.currentLocation != null) {
      console.log('location detail initialized with location');
      this.pageHeader = 'Vorhandenen Ort Bearbeiten';
      this.createNewEntry = false;
    } else {
      console.log('location detail initialized without location');
      this.loadDefaults();
      this.pageHeader = 'Neuen Ort Hinzufügen';
      this.createNewEntry = true;
    }
  }

  loadDefaults() {
    this.data.currentLocation = new AdminLocation('sample description', {
      filename: '',
      filesize: '',
      filetype: '',
      base64: '',
    }, true, 'sample name', '12345','49.1226','9.211',"0");
  }

  submit() {
    if (this.createNewEntry === false) {
      this.http.put('/api/admin/locations/' + this.data.currentLocation._id, {
        description: this.data.currentLocation.description,
        image: this.data.currentLocation.image,
        isActive: this.data.currentLocation.isActive,
        name: this.data.currentLocation.name,
        _id: this.data.currentLocation._id
      }, {headers: new HttpHeaders().set('X-Auth-Token', this.data.adminToken)}).subscribe(
        (data) => {
          console.log('successfully edited location');
          this.snackBar.open('Erfolgreich gespeichert!', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          this.dialogRef.close();
        },
        (err) => {
          this.snackBar.open('Ein Fehler ist Aufgetreten', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          console.log('error editing location', err);
        }
      );
    } else {
      this.http.post('/api/admin/locations', {
        description: this.data.currentLocation.description,
        image: this.data.currentLocation.image,
        isActive: this.data.currentLocation.isActive,
        name: this.data.currentLocation.name
      }, {headers: new HttpHeaders().set('X-Auth-Token', this.data.adminToken)}).subscribe(
        (data) => {
          this.snackBar.open('Erfolgreich gespeichert!', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          console.log('successfully added new location');
          this.dialogRef.close();
        },
        (err) => {
          this.snackBar.open('Ein Fehler ist Aufgetreten', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          console.log('error editing location', err);
        }
      );
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  handleFileSelect(evt) {
    const files = evt.target.files;
    const file = files[0];

    console.log('filename', file.name);
    console.log('filesize', file.size);
    console.log('filetype', file.type);

    this.data.currentLocation.image = new Object();
    this.data.currentLocation.image.filename = file.name;
    this.data.currentLocation.image.filesize = file.size;
    this.data.currentLocation.image.filetype = file.type;

    if (files && file) {
      const reader = new FileReader();
      reader.onload = this._handleReaderLoaded.bind(this);
      reader.readAsBinaryString(file);
    }
  }

  _handleReaderLoaded(readerEvt) {
    const binaryString = readerEvt.target.result;
    this.data.currentLocation.image.base64 = btoa(binaryString);
  }

  /**
   * checks if there is a valid image
   */
  isImageAvailable():boolean {
    return  !isNullOrUndefined(this.data.currentLocation.image) &&!isNullOrUndefined(this.data.currentLocation.image.filetype);
  }
}
