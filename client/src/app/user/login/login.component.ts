import {AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material';
import {Router} from '@angular/router';
import {isNullOrUndefined} from 'util';

@Component({
  selector: 'app-user-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class UserLoginComponent implements OnInit,AfterViewInit {
  @Output()
  loginOutput: EventEmitter<string> = new EventEmitter();

  @ViewChild('teamname') teamname: ElementRef;

  imageLogo = '/assets/images/schnitzel_logo.png';

  constructor(private http: HttpClient, public snackBar: MatSnackBar, public router: Router) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    history.pushState(null,null,this.router.url);
    window.addEventListener('popstate', (event) => {
      history.pushState(null,null,this.router.url);
    });
  }



  /**
   * sends the teamname to the server and closes the login screen if the registration was successful.
   * @param {string} teamname
   */
  submitLogin(teamname: string, password: string ) {
    console.log('clicked login button',teamname);
    if (teamname.length > 3 && password.length > 0) {
      this.http.post('/api/game/sessions', {groupName: teamname, password: password}).subscribe(
        (data) => {
          console.log('loginPost data', data['token']);
          this.snackBar.open('Viel Spaß! :)',null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          this.loginOutput.emit('' + data['token']);
        },
        (err) => {
          // bad word filter handling
          if (!isNullOrUndefined(err['error']['error']['suggestion'])){
            this.teamname.nativeElement.value = err['error']['error']['suggestion'];
          }
          this.snackBar.open(err['error']['error']['message'],null, {
            duration: 2000,
            horizontalPosition: 'center'
          });
          console.log('loginPost error', err);
        }
      );
    } else if (teamname.length <= 3) {
      this.snackBar.open('Gruppenname muss aus mindestens 4 Zeichen bestehen!',null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    } else {
      this.snackBar.open('Bitte ein Passwort eingeben!',null, {
        duration: 2000,
        horizontalPosition: 'center'
      });
    }
  }
}
