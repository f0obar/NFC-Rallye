import {Component, OnInit,} from '@angular/core';
import {AdminAuthService} from '../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class AdminLoginComponent implements OnInit {

  constructor(private  authService: AdminAuthService) { }

  ngOnInit() {
  }

  /**
   * sends password and username to the server. If server responds with an ok the output emitter fires.
   * @param name
   * @param password
   * @param keeploggedin
   */
  submitLogin(name: string, password: string, keeploggedin: boolean) {
    this.authService.login(name,password,keeploggedin);
  }
}
