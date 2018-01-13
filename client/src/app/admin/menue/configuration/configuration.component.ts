import {Component, Input, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {MatSnackBar} from '@angular/material';
import {AdminAuthService} from '../../services/admin-auth.service';
import {AdminRestService} from '../../services/admin-rest.service';
import {isNullOrUndefined} from 'util';

@Component({
  selector: 'app-admin-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class AdminConfigurationComponent implements OnInit {
  winText: string;
  locations: number;
  userName: string;
  password: string;
  passwordRepeat: string;

  constructor(private http: HttpClient, public snackBar: MatSnackBar,
              public  authService: AdminAuthService, private restService: AdminRestService) {
    this.winText = 'There seems to be a problem with the internet connection';
    this.userName = 'There seems to be a problem with the internet connection';
    this.password = '';
    this.passwordRepeat = '';
  }

  ngOnInit() {
    this.loadCurrentWinText();
    this.loadCurrentUserName();
    this.loadCurrentLocations();
  }

  saveWinText() {
    this.restService.saveExistingEntry('/api/admin/config/winText', {winText: this.winText}).subscribe();
  }

  saveLocations() {
    this.restService.saveExistingEntry('/api/admin/config/locations', {locations: this.locations}).subscribe();
  }

  saveUserName() {
    this.restService.saveExistingEntry('/api/admin/config/username', {username: this.userName}).subscribe();
  }

  savePassword() {
    if (this.password.length === 0) {
      this.snackBar.open('Passwort darf nicht leer sein!', null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    } else if (this.password !== this.passwordRepeat) {
      this.snackBar.open('Passwörter stimmen nicht überein!', null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    } else {
      this.restService.saveExistingEntry('/api/admin/config/password', {
        password: this.password,
        passwordRepeat: this.passwordRepeat
      }).subscribe();
    }
  }

  loadCurrentWinText() {
    this.restService.getEntries('/api/admin/config/winText').subscribe(data => {
      if (!isNullOrUndefined(data)) {
        this.winText = data['result'];
      }
    });
  }


  loadCurrentUserName() {
    this.restService.getEntries('/api/admin/config/username').subscribe(data => {
      if (!isNullOrUndefined(data)) {
        this.userName = data['result'];
      }
    });
  }

  loadCurrentLocations() {
    this.restService.getEntries('/api/admin/config/locations').subscribe(data => {
      if (!isNullOrUndefined(data)) {
        this.locations = data['result'];
      }
    });
  }
}
