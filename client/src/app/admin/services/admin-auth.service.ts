import { Injectable } from '@angular/core';
import {isNullOrUndefined} from 'util';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {MatDialog, MatSnackBar} from '@angular/material';

@Injectable()
export class AdminAuthService {

  private static NAME_ADMIN_TOKEN = 'admintoken';
  private static NAME_ADMIN_AUTH = 'X-Auth-Token';
  private adminToken = null;


  constructor(private http: HttpClient, public snackBar: MatSnackBar,private dialog: MatDialog) {
    if (localStorage.getItem(AdminAuthService.NAME_ADMIN_TOKEN) !== null) {
      this.http.get('/api/admin/playsessions',
        {headers: new HttpHeaders().set(AdminAuthService.NAME_ADMIN_AUTH,
            localStorage.getItem(AdminAuthService.NAME_ADMIN_TOKEN))
        }).subscribe(
        (data) => {
          this.adminToken = localStorage.getItem(AdminAuthService.NAME_ADMIN_TOKEN);
        },
        (err) => {
          this.adminToken = null;
          localStorage.removeItem(AdminAuthService.NAME_ADMIN_TOKEN);
        }
      );
    }
  }

  public getAdminToken(): string {
    return this.adminToken;
  }

  public isLoggedIn():boolean {
    return !isNullOrUndefined(this.adminToken);
  }

  public login(username: string, password: string, persistent: boolean) {
    this.http.post('/api/admin/session/', {username: username, password: password}).subscribe(
      (data) => {
        this.adminToken = data['token'];
        if (persistent) {
          localStorage.setItem(AdminAuthService.NAME_ADMIN_TOKEN,data['token']);
        }
      },
      (err) => {
        this.snackBar.open('Wrong Username or Password',null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        console.log('login error', err);
      }
    );
  }

  public logout() {
    this.http.delete('/api/admin/session/' + this.adminToken,
      {headers: new HttpHeaders().set(AdminAuthService.NAME_ADMIN_AUTH, this.adminToken)}).subscribe(
      (data) => {
      },
      (err) => {}
    );

    localStorage.removeItem(AdminAuthService.NAME_ADMIN_TOKEN);
    this.adminToken = null;
    this.dialog.closeAll();
  }
}
