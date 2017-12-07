import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-admin-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class AdminLoginComponent implements OnInit {

  @Output()
  loginOutput: EventEmitter<any> = new EventEmitter();

  constructor(private http: HttpClient, public snackBar: MatSnackBar) { }

  ngOnInit() {
  }

  /**
   * sends password and username to the server. If server responds with an ok the output emitter fires.
   * @param name
   * @param password
   * @param keeploggedin
   */
  submitLogin(name: string, password: string, keeploggedin: boolean) {
    console.log('admin login', name, password);
    this.http.post('/api/admin/session/', {username: name, password: password}).subscribe(
      (data) => {
        console.log('loginPost data', data);
        this.loginOutput.emit({token: data['token'], keep: keeploggedin});
      },
      (err) => {
        this.snackBar.open('Wrong Username or Password',null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        console.log('loginPost error', err);
      }
    );
  }
}
