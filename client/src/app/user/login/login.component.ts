import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-user-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class UserLoginComponent implements OnInit {
  @Output()
  loginOutput: EventEmitter<string> = new EventEmitter();

  imageLogo = '/assets/images/schnitzel_logo.png';

  constructor(private http: HttpClient, public snackBar: MatSnackBar) { }

  ngOnInit() {
  }

  /**
   * sends the teamname to the server and closes the login screen if the registration was successful.
   * @param {string} teamname
   */
  submitLogin(teamname: string) {
    console.log('clicked login button',teamname);
    if (teamname.length > 3) {
      this.http.post('/api/game/sessions', {groupName: teamname}).subscribe(
        (data) => {
          console.log('loginPost data', data);
          this.snackBar.open('Viel Spaß! :)',null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          this.loginOutput.emit('' + data);
        },
        (err) => {
          console.log('loginPost error', err);
        }
      );
    } else {
     this.snackBar.open('Gruppenname muss aus mindestens 4 Zeichen bestehen',null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    }
  }
}
