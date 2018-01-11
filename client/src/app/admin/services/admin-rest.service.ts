import { Injectable } from '@angular/core';
import {AdminAuthService} from './admin-auth.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {MatSnackBar} from '@angular/material';

@Injectable()
export class AdminRestService {

  private static NAME_ADMIN_AUTH = 'X-Auth-Token';

  constructor(public http: HttpClient,private snackBar: MatSnackBar,private authService: AdminAuthService) { }

  public getEntries(url: string): any {
    return this.http.get(url, {headers: new HttpHeaders().set(AdminRestService.NAME_ADMIN_AUTH, this.authService.getAdminToken())}).map(
      (data) => {
        return data;
      },
      (err) => {
        if (err['status']===401){
          this.snackBar.open('Unauthorized, bitte erneut anmelden!', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          this.authService.logout();
        }
        this.snackBar.open('Fehler beim Laden der Resource', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        return null;
      }
    );
  }

  public saveExistingEntry(url: string, body: any): any {
    return this.http.put(url, body, {headers: new HttpHeaders().set(AdminRestService.NAME_ADMIN_AUTH, this.authService.getAdminToken())}).map(
      (data) => {
        console.log('successfully saved');
        this.snackBar.open('Erfolgreich gespeichert!', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        return true;
      },
      (err) => {
        if (err['status']===401){
          this.snackBar.open('Unauthorized, bitte erneut anmelden!', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          this.authService.logout();
        } else {
          this.snackBar.open('Ein Fehler ist Aufgetreten', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        }
        console.log('error saving existing entry', err);
        return false;
      }
    );
  }

  public saveNewEntry(url: string, body: any): any {
    return this.http.post(url, body, {headers: new HttpHeaders().set(AdminRestService.NAME_ADMIN_AUTH, this.authService.getAdminToken())}).map(
      (data) => {
        console.log('successfully saved');
        this.snackBar.open('Erfolgreich gespeichert!', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        return true;
      },
      (err) => {
        if (err['status']===401){
          this.snackBar.open('Unauthorized, bitte erneut anmelden!', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          this.authService.logout();
        } else {
          this.snackBar.open('Ein Fehler ist Aufgetreten', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        }
        console.log('error saving new entry', err);
        return false;
      }
    );
  }


  public deleteEntry(url: string): any {
    return this.http.delete(url, {headers: new HttpHeaders().set(AdminRestService.NAME_ADMIN_AUTH, this.authService.getAdminToken())}).map(
      (data) => {
        this.snackBar.open('Erfolgreich gelöscht.', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        console.log('deleting successful', data);
        return true;
      },
      (err) => {
        if (err['status']===401){
          this.snackBar.open('Unauthorized, bitte erneut anmelden!', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          this.authService.logout();
        } else {
          this.snackBar.open('Ein Fehler ist Aufgetreten', null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        }
        return false;
      }
    );
  }

}
