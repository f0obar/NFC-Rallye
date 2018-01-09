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

  currentWinText: string;
  currentUserName: string;

  constructor(private http: HttpClient, public snackBar: MatSnackBar,public  authService: AdminAuthService, private restService: AdminRestService) {
    this.currentWinText = 'There seems to be a problem with the internet connection';
    this.currentUserName = 'There seems to be a problem with the internet connection';
  }

  ngOnInit() {
    this.loadCurrentWinText();
    this.loadCurrentUserName();
  }

  changeEndText(text: string) {
    console.log('changeEndText', text);
    this.restService.saveExistingEntry('/api/admin/config/winText',{winText: text}).subscribe();
  }

  changeUserName(name: string) {
    console.log('changeUserName', name);
    this.restService.saveExistingEntry('/api/admin/config/username',{username: name}).subscribe();
  }

  changePassword(newpassword: string, newpassword2: string) {
    console.log('changePassword');
    if (newpassword.length === 0) {
      this.snackBar.open('Passwort darf nicht leer sein!', null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    } else if (newpassword !== newpassword2) {
      this.snackBar.open('Passwörter stimmen nicht überein!', null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    } else {
      this.restService.saveExistingEntry('/api/admin/config/password',{
        password: newpassword,
        passwordRepeat: newpassword2
      }).subscribe();
    }
  }

  loadCurrentWinText() {
    console.log('loading current win text');
    this.restService.getEntries('/api/admin/config/winText').subscribe(data=>{
      if(!isNullOrUndefined(data)) {
        this.currentWinText = data['result'];
      }
    });
  }


  loadCurrentUserName() {
    console.log('loading current win text');
    this.restService.getEntries('/api/admin/config/username').subscribe(data=>{
      if(!isNullOrUndefined(data)) {
        this.currentUserName = data['result'];
      }
    });
  }
}
