import {Component, Input, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {MatSnackBar} from '@angular/material';
import {AdminAuthService} from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class AdminConfigurationComponent implements OnInit {

  currentWinText: string;
  currentUserName: string;

  constructor(private http: HttpClient, public snackBar: MatSnackBar,public  authService: AdminAuthService) {
    this.currentWinText = 'There seems to be a problem with the internet connection';
    this.currentUserName = 'There seems to be a problem with the internet connection';
  }

  ngOnInit() {
    this.loadCurrentWinText();
    this.loadCurrentUserName();
  }

  changeEndText(text: string) {
    console.log('changeEndText', text);
    this.http.put(
      '/api/admin/config/winText',
      {winText: text},
      {headers: new HttpHeaders().set('X-Auth-Token', this.authService.getAdminToken())}).map((res: Response) => res.json()).subscribe(
      (data) => {
        console.log('changed end text', data);
        this.snackBar.open('Erfolgreich gespeichert!', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
      },
      (err) => {
        if (err['status'] === 200) {
          this.snackBar.open('Erfolgreich gespeichert!', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        } else {
          this.snackBar.open('Ein Fehler ist Aufgetreten', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        }
        console.log('changed end text', err);
      }
    );
  }

  changeUserName(name: string) {
    console.log('changeUserName', name);
    this.http.put(
      '/api/admin/config/username',
      {username: name},
      {headers: new HttpHeaders().set('X-Auth-Token', this.authService.getAdminToken())}).map((res: Response) => res.json()).subscribe(
      () => {
        console.log('changed end text');
        this.snackBar.open('Erfolgreich gespeichert!', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
      },
      (err) => {
        if (err['status'] === 200) {
          this.snackBar.open('Erfolgreich gespeichert!', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        } else {
          this.snackBar.open('Ein Fehler ist Aufgetreten', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        }
        console.log('changed end text', err);
      }
    );
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
      this.http.put('/api/admin/config/password', {
        password: newpassword,
        passwordRepeat: newpassword2
      }, {headers: new HttpHeaders().set('X-Auth-Token', this.authService.getAdminToken())}).map((res: Response) => res.json()).subscribe(
        (data) => {
          console.log('changed end text', data);
          this.snackBar.open('Erfolgreich gespeichert!', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        },
        (err) => {
          if (err['status'] === 200) {
            this.snackBar.open('Erfolgreich gespeichert!', null, {
              duration: 2000,
              horizontalPosition: 'center'
            });
          } else {
            this.snackBar.open('Ein Fehler ist Aufgetreten', null, {
              duration: 2000,
              horizontalPosition: 'center'
            });
          }
          console.log('Error changing end text', err);
        }
      );
    }
  }

  loadCurrentWinText() {
    console.log('loading current win text');
    this.http.get(
      '/api/admin/config/winText',
      {headers: new HttpHeaders().set('X-Auth-Token', this.authService.getAdminToken())}).map((res: Response) => res.json()).subscribe(
      (data) => {
        console.log('current win text', data);
        this.currentWinText = data['text'];
      },
      (err) => {
        console.log('current win text error', err);
        this.currentWinText = err['error']['text'];
      }
    );
  }


  loadCurrentUserName() {
    console.log('loading current win text');
    this.http.get(
      '/api/admin/config/username',
      {headers: new HttpHeaders().set('X-Auth-Token', this.authService.getAdminToken())}).map((res: Response) => res.json()).subscribe(
      (data) => {
        console.log('current win text', data);
        this.currentUserName = data['text'];
      },
      (err) => {
        console.log('current win text error', err);
        this.currentUserName = err['error']['text'];
      }
    );

  }
}
