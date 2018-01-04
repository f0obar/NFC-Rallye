import { Component, OnInit } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  authenticated: boolean;
  adminToken: string;

  constructor(private http: HttpClient,public snackBar: MatSnackBar) {
    this.authenticated = false;
    this.adminToken = '';
  }

  /**
   * checks local storage for an old admin token
   */
  ngOnInit() {
    if(localStorage.getItem('admintoken') !== null){
      this.checkAdminTokenValid(localStorage.getItem('admintoken'));
    }
  }

  /**
   * checks if old admin token is still valid
   */
  checkAdminTokenValid(adminToken: string){
    this.http.get('/api/admin/playsessions', {headers: new HttpHeaders().set('X-Auth-Token', adminToken)}).subscribe(
      (data) => {
        this.adminToken = adminToken;
        this.authenticated = true;
      },
      (err) => {
        if(err['status']=== 401){
          localStorage.removeItem('admintoken');
          this.snackBar.open('Session ist abgelaufen',null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
        }
      }
    );
  }

  /**
   * sets admin token in the local storage and changes from login screen to menue
   * @param data
   */
  loggedIn(data: any) {
    console.log('setting token:',data['token']);
    if(data['keep'] === true){
      localStorage.setItem('admintoken',data['token']);
    }
    this.adminToken = data['token'];
    this.authenticated = true;
  }

  /**
   * removes admin token from local storage if the session could be successfully deleted in the backend
   */
  logout(): void{
    console.log('logout');
    this.http.delete('/api/admin/session/' + this.adminToken,{headers: new HttpHeaders().set('X-Auth-Token', this.adminToken)}).subscribe(
      (data) => {
        console.log('logout successfull', data);
        this.adminToken = '';
        localStorage.removeItem('admintoken');
        this.authenticated = false;
      },
      (err) => {
        console.log('logout error', err);
        this.adminToken = '';
        localStorage.removeItem('admintoken');
        this.authenticated = false;
      }
    );
  }
}
