import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AdminAuthService} from '../services/admin-auth.service';

@Component({
  selector: 'app-admin-menue',
  templateUrl: './menue.component.html',
  styleUrls: ['./menue.component.css']
})
export class AdminMenueComponent implements OnInit {

  public menueItems: Array<string>;
  currentSelection = '';

  constructor(private router: Router, public  authService: AdminAuthService) {
    this.menueItems = [];
    this.menueItems.push('Status');
    this.menueItems.push('Konfiguration');
    this.menueItems.push('Orte');
    this.menueItems.push('Rätsel');
    this.menueItems.push('Tags');
    this.currentSelection = 'Status';
  }

  selectEntry(selection: string){
    switch(selection) {
      case 'Status': {
        this.router.navigateByUrl('/admin/status');
        break;
      }
      case 'Rätsel': {
        this.router.navigateByUrl('/admin/riddles');
        break;
      }
      case 'Konfiguration': {
        this.router.navigateByUrl('/admin/configuration');
        break;
      }
      case 'Orte': {
        this.router.navigateByUrl('/admin/locations');
        break;
      }
      case 'Tags': {
        this.router.navigateByUrl('/admin/tags');
        break;
      }
    }
    this.currentSelection = selection;
  }

  ngOnInit() {
    const url = this.router.url;
    switch(url) {
      case '/admin/status': {
        this.currentSelection = 'Status';
        break;
      }
      case '/admin/riddles': {
        this.currentSelection = 'Rätsel';
        break;
      }
      case '/admin/configuration': {
        this.currentSelection = 'Konfiguration';
        break;
      }
      case '/admin/locations': {
        this.currentSelection = 'Orte';
        break;
      }
      case '/admin/tags': {
        this.currentSelection = 'Tags';
        break;
      }
    }
  }
}
