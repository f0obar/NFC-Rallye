import {Injectable} from '@angular/core';
import {AdminAuthService} from './admin-auth.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {MatSnackBar} from '@angular/material';
import 'rxjs/add/operator/catch';

@Injectable()
export class AdminRestService {

  private static NAME_ADMIN_AUTH = 'X-Auth-Token';

  constructor(public http: HttpClient, private snackBar: MatSnackBar, private authService: AdminAuthService) {
  }

  public getEntries(url: string): Promise<Object> {
    return this.http.get(url,
      {headers: new HttpHeaders().set(AdminRestService.NAME_ADMIN_AUTH, this.authService.getAdminToken())}).map(
      (data) => {
        return data;
      }
    ).catch((e: any) => {
      this.handleError(e);
      return null;
    }).toPromise();
  }

  public saveExistingEntry(url: string, body: any): Promise<Object> {
    return this.http.put(url, body,
      {headers: new HttpHeaders().set(AdminRestService.NAME_ADMIN_AUTH, this.authService.getAdminToken())}).map(
      () => {
        this.snackBar.open('Erfolgreich gespeichert!', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        return true;
      }
    ).catch((e: any) => {
      this.handleError(e);
      return null;
    }).toPromise();
  }

  public saveNewEntry(url: string, body: any): Promise<Object> {
    return this.http.post(url, body,
      {headers: new HttpHeaders().set(AdminRestService.NAME_ADMIN_AUTH, this.authService.getAdminToken())}).map(
      () => {
        this.snackBar.open('Erfolgreich gespeichert!', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        return true;
      }
    ).catch((e: any) => {
      this.handleError(e);
      return null;
    }).toPromise();
  }


  public deleteEntry(url: string): Promise<Object> {
    return this.http.delete(url,
      {headers: new HttpHeaders().set(AdminRestService.NAME_ADMIN_AUTH, this.authService.getAdminToken())}).map(
      () => {
        this.snackBar.open('Erfolgreich gelöscht.', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        return true;
      }
    ).catch((e: any) => {
      this.handleError(e);
      return null;
    }).toPromise();
  }


  private handleError(error: any) {
    if (error['status'] === 400 && error.error.result) {
      this.snackBar.open(error.error.result, null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    } else if (error['status'] === 401) {
      this.snackBar.open('Unauthorized, bitte erneut anmelden!', null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
      this.authService.logout();
    } else {
      console.log('TEST',error);
      this.snackBar.open('Ein Fehler ist Aufgetreten: ' + error['statusText'] , null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    }
  }
}
