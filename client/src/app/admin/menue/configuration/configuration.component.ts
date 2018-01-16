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
    this.restService.saveExistingEntry('/api/admin/config/winText', {winText: this.winText}).then().catch(e => {
    });
  }

  saveLocations() {
    this.restService.saveExistingEntry('/api/admin/config/locations', {locations: this.locations}).then().catch(e => {
    });
  }

  saveUserName() {
    this.restService.saveExistingEntry('/api/admin/config/username', {username: this.userName}).then().catch(e => {
    });
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
      }).then().catch(e => {
      });
    }
  }

  loadCurrentWinText() {
    this.restService.getEntries('/api/admin/config/winText').then(data => {
        this.winText = data['result'];
    }).catch(e => {
    });;
  }


  loadCurrentUserName() {
    this.restService.getEntries('/api/admin/config/username').then(data => {
        this.userName = data['result'];
    }).catch(e => {
    });
  }

  loadCurrentLocations() {
    this.restService.getEntries('/api/admin/config/locations').then(data => {
      this.locations = data['result'];
    }).catch(e => {
    });
  }
}
